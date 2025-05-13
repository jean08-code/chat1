import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar").notNull(),
  lastActive: timestamp("last_active").notNull().defaultNow(),
  isOnline: boolean("is_online").notNull().default(false),
  settings: jsonb("settings").default({
    darkMode: false,
    notifications: true,
    sound: true,
    language: "en",
  }),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatar: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Other schema types for API requests
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginPayload = z.infer<typeof loginSchema>;

export const updateMessageReadSchema = z.object({
  messageIds: z.array(z.number()),
});

export type UpdateMessageReadPayload = z.infer<typeof updateMessageReadSchema>;

export const deleteMessageSchema = z.object({
  messageId: z.number(),
});

export type DeleteMessagePayload = z.infer<typeof deleteMessageSchema>;

export const typingStatusSchema = z.object({
  receiverId: z.number(),
  isTyping: z.boolean(),
});

export type TypingStatusPayload = z.infer<typeof typingStatusSchema>;

export const userSettingsSchema = z.object({
  darkMode: z.boolean().optional(),
  notifications: z.boolean().optional(),
  sound: z.boolean().optional(),
  language: z.string().optional(),
});

export type UserSettingsPayload = z.infer<typeof userSettingsSchema>;
