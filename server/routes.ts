import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { 
  loginSchema, 
  insertMessageSchema, 
  updateMessageReadSchema,
  typingStatusSchema
} from "@shared/schema";
import { ZodError } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: number;
    typingStatus: Record<string, boolean>;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "chat-app-secret",
    })
  );

  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/login", (req, res, next) => {
    try {
      const payload = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message || "Authentication failed" });
        }
        req.logIn(user, async (err) => {
          if (err) {
            return next(err);
          }
          
          // Update user status
          await storage.setUserOnlineStatus(user.id, true);
          await storage.updateUserLastActive(user.id);
          
          return res.json({ id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.post("/api/logout", isAuthenticated, async (req, res) => {
    if (req.session.userId) {
      await storage.setUserOnlineStatus(req.session.userId, false);
    }
    
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({ 
        isAuthenticated: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          displayName: user.displayName, 
          avatar: user.avatar 
        } 
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // User routes
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const currentUserId = (req.user as any).id;
      
      // Filter out current user and map to safe user data
      const filteredUsers = users
        .filter(user => user.id !== currentUserId)
        .map(({ id, username, displayName, avatar, isOnline, lastActive }) => ({
          id, username, displayName, avatar, isOnline, lastActive
        }));
      
      res.json(filteredUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Message routes
  app.get("/api/messages/:contactId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const contactId = parseInt(req.params.contactId);
      
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      const messages = await storage.getMessages(currentUserId, contactId);
      
      // Update user last active
      await storage.updateUserLastActive(currentUserId);
      
      // Mark all messages from the contact as read
      const messagesToMark = messages
        .filter(msg => msg.senderId === contactId && !msg.isRead)
        .map(msg => msg.id);
      
      if (messagesToMark.length > 0) {
        await storage.markMessagesAsRead(messagesToMark);
      }
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const payload = insertMessageSchema.parse({
        ...req.body,
        senderId: currentUserId
      });
      
      const message = await storage.createMessage(payload);
      
      // Update user last active
      await storage.updateUserLastActive(currentUserId);
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/messages/read", isAuthenticated, async (req, res) => {
    try {
      const payload = updateMessageReadSchema.parse(req.body);
      await storage.markMessagesAsRead(payload.messageIds);
      
      // Update user last active
      await storage.updateUserLastActive((req.user as any).id);
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Typing status
  app.post("/api/typing", isAuthenticated, (req, res) => {
    try {
      const payload = typingStatusSchema.parse(req.body);
      
      if (!req.session.typingStatus) {
        req.session.typingStatus = {};
      }
      
      req.session.typingStatus[payload.receiverId.toString()] = payload.isTyping;
      res.json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update typing status" });
    }
  });

  app.get("/api/typing/:userId", isAuthenticated, (req, res) => {
    const contactId = parseInt(req.params.userId);
    const currentUserId = (req.user as any).id;
    
    if (isNaN(contactId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Check if the contact has typing status for current user
    try {
      // Poll to check if any user has typing status for current user
      const isTyping = false; // This would normally check other users' sessions
      
      res.json({ isTyping });
    } catch (error) {
      res.status(500).json({ message: "Failed to get typing status" });
    }
  });

  // Status ping to keep session alive and update last active
  app.post("/api/ping", isAuthenticated, async (req, res) => {
    const currentUserId = (req.user as any).id;
    await storage.updateUserLastActive(currentUserId);
    await storage.setUserOnlineStatus(currentUserId, true);
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
