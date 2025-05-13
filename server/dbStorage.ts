import { 
  users, 
  messages, 
  type User,
  type InsertUser, 
  type Message, 
  type InsertMessage,
  type UserSettingsPayload
} from "@shared/schema";
import { db } from "./db";
import { IStorage } from "./storage";
import { eq, or, and, desc, asc } from "drizzle-orm";

class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isOnline: false,
        settings: {
          darkMode: false,
          notifications: true,
          sound: true,
          language: "en"
        }
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async setUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isOnline })
      .where(eq(users.id, id));
  }

  async updateUserLastActive(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, id));
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
    
    const [updatedUser] = await db
      .update(users)
      .set({ settings: updatedSettings })
      .where(eq(users.id, id))
      .returning();
      
    return updatedUser;
  }

  // Message methods
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            and(
              eq(messages.senderId, senderId),
              eq(messages.receiverId, receiverId)
            ),
            and(
              eq(messages.senderId, receiverId),
              eq(messages.receiverId, senderId)
            )
          ),
          eq(messages.isDeleted, false)
        )
      )
      .orderBy(asc(messages.timestamp));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        isRead: false,
        isDeleted: false
      })
      .returning();
    return message;
  }

  async markMessagesAsRead(messageIds: number[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        or(...messageIds.map(id => eq(messages.id, id)))
      );
  }
  
  async deleteMessage(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, messageId));
  }
}

// Create and export an instance of DatabaseStorage
export const databaseStorage = new DatabaseStorage();