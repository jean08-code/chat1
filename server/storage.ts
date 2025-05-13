import { 
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

// Import the database storage implementation to use in our application
import { databaseStorage } from "./dbStorage";

// Export the storage instance
export const storage: IStorage = databaseStorage;
