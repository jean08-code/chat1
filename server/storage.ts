import { 
  users, 
  messages, 
  type User,
  type InsertUser, 
  type Message, 
  type InsertMessage,
  type UserSettingsPayload
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  setUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  updateUserLastActive(id: number): Promise<void>;
  updateUserSettings(id: number, settings: UserSettingsPayload): Promise<User>;
  
  // Message methods
  getMessages(senderId: number, receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(messageIds: number[]): Promise<void>;
  deleteMessage(messageId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private userIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Add default users
    this.createUser({
      username: "sarah",
      password: "password123",
      displayName: "Sarah Miller",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
    });
    
    this.createUser({
      username: "alex",
      password: "password123",
      displayName: "Alex Johnson",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
    });
    
    this.createUser({
      username: "emily",
      password: "password123",
      displayName: "Emily Chang",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
    });
    
    this.createUser({
      username: "michael",
      password: "password123",
      displayName: "Michael Rodriguez",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
    });
    
    this.createUser({
      username: "jessica",
      password: "password123",
      displayName: "Jessica Lee",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
    });
    
    this.createUser({
      username: "daniel",
      password: "password123",
      displayName: "Daniel Brown",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      lastActive: now, 
      isOnline: false,
      settings: {
        darkMode: false,
        notifications: true,
        sound: true,
        language: "en"
      }
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async setUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      this.users.set(id, { ...user, isOnline });
    }
  }

  async updateUserLastActive(id: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      this.users.set(id, { ...user, lastActive: new Date() });
    }
  }

  async updateUserSettings(id: number, newSettings: UserSettingsPayload): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Define default settings if none exist
    const currentSettings = user.settings || {
      darkMode: false,
      notifications: true,
      sound: true,
      language: "en"
    };
    
    // Merge the existing settings with the new settings
    const updatedSettings = {
      ...currentSettings,
      ...newSettings
    };
    
    const updatedUser = {
      ...user,
      settings: updatedSettings
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Message methods
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        (message) => 
          !message.isDeleted && (
            (message.senderId === senderId && message.receiverId === receiverId) || 
            (message.senderId === receiverId && message.receiverId === senderId)
          )
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      isRead: false,
      isDeleted: false
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessagesAsRead(messageIds: number[]): Promise<void> {
    for (const id of messageIds) {
      const message = this.messages.get(id);
      if (message) {
        this.messages.set(id, { ...message, isRead: true });
      }
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      this.messages.set(messageId, { ...message, isDeleted: true });
    }
  }
}

export const storage = new MemStorage();
