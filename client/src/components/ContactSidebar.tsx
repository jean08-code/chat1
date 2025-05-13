import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import TypingIndicator from "@/components/TypingIndicator";
import { User, Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import SettingsDialog from "@/components/SettingsDialog";

interface ContactSidebarProps {
  currentUser: User | null;
  selectedContactId: number | null;
  onContactSelect: (contactId: number) => void;
  chatMessages: Record<number, Message[]>;
  className?: string;
  onLogout: () => void;
}

export default function ContactSidebar({
  currentUser,
  selectedContactId,
  onContactSelect,
  chatMessages,
  className,
  onLogout,
}: ContactSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contacts = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get online contacts
  const onlineContacts = contacts.filter((contact) => contact.isOnline);

  // Filter contacts by search term
  const filteredContacts = contacts.filter((contact) =>
    contact.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get last message between users
  const getLastMessage = (contactId: number): Message | null => {
    const messages = chatMessages[contactId] || [];
    return messages.length > 0 ? messages[messages.length - 1] : null;
  };

  // Helper to get unread message count for a contact
  const getUnreadCount = (contactId: number): number => {
    if (!currentUser) return 0;
    
    const messages = chatMessages[contactId] || [];
    return messages.filter(
      (msg) => msg.senderId === contactId && !msg.isRead
    ).length;
  };

  // Format the last message timestamp
  const formatMessageTime = (timestamp: Date | string): string => {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  return (
    <div className={cn("flex flex-col bg-white border-r border-gray-200 h-full", className)}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Messages</h1>
          <Button variant="ghost" size="icon">
            <Plus className="h-5 w-5 text-primary" />
          </Button>
        </div>
        <div className="mt-4 relative">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
          <Input
            type="text"
            placeholder="Search contacts..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Active contacts */}
        {onlineContacts.length > 0 && (
          <div className="py-2">
            <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Now
            </h2>
            <div className="mt-2 flex px-4 space-x-3 overflow-x-auto pb-2">
              {onlineContacts.map((contact) => (
                <div key={contact.id} className="flex flex-col items-center">
                  <AvatarWithStatus
                    src={contact.avatar}
                    alt={contact.displayName}
                    status="online"
                    size="lg"
                    className="border-2 border-white"
                  />
                  <span className="text-xs mt-1 text-gray-700">
                    {contact.displayName.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All contacts */}
        <div className="py-2">
          <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            All Messages
          </h2>
          {filteredContacts.map((contact) => {
            const lastMessage = getLastMessage(contact.id);
            const unreadCount = getUnreadCount(contact.id);
            const isTyping = false; // This would be set based on real typing status

            return (
              <div
                key={contact.id}
                className={cn(
                  "px-4 py-3 flex items-center hover:bg-gray-50 cursor-pointer",
                  selectedContactId === contact.id && "bg-blue-50 border-l-4 border-primary"
                )}
                onClick={() => onContactSelect(contact.id)}
              >
                <AvatarWithStatus
                  src={contact.avatar}
                  alt={contact.displayName}
                  status={contact.isOnline ? "online" : "offline"}
                  size="md"
                />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {contact.displayName}
                    </h3>
                    {lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    {isTyping ? (
                      <TypingIndicator inline />
                    ) : (
                      <p className="text-sm text-gray-600 truncate max-w-[180px]">
                        {lastMessage?.content || "No messages yet"}
                      </p>
                    )}
                    {unreadCount > 0 && (
                      <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* User profile */}
      {currentUser && (
        <div className="border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <AvatarWithStatus
              src={currentUser.avatar}
              alt={currentUser.displayName}
              status="online"
              size="md"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {currentUser.displayName}
              </p>
              <p className="text-xs text-green-500">Active</p>
            </div>
          </div>
          <div className="flex items-center">
            <SettingsDialog />
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-gray-500 hover:text-gray-700"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
