import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Button } from "@/components/ui/button";
import { Phone, Video, MoreVertical, ChevronLeft } from "lucide-react";
import MessageGroup from "@/components/MessageGroup";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import { Message, User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ChatAreaProps {
  currentUser: User | null;
  selectedContact: User | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isContactTyping?: boolean;
  onShowSidebar: () => void;
  className?: string;
}

export default function ChatArea({
  currentUser,
  selectedContact,
  messages,
  onSendMessage,
  isContactTyping = false,
  onShowSidebar,
  className,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark messages as read mutation
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (messageIds: number[]) => {
      await apiRequest("POST", "/api/messages/read", { messageIds });
    },
    onSuccess: () => {
      if (selectedContact) {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedContact.id}`] });
      }
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Mark unread messages from contact as read
    if (selectedContact && currentUser) {
      const unreadMessages = messages
        .filter(msg => msg.senderId === selectedContact.id && !msg.isRead)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }
    }
  }, [messages, selectedContact, currentUser, markAsRead]);

  // Group messages by date
  const groupedMessages: Record<string, Message[]> = {};
  messages.forEach(message => {
    const date = new Date(message.timestamp);
    const dateStr = format(date, "yyyy-MM-dd");
    
    if (!groupedMessages[dateStr]) {
      groupedMessages[dateStr] = [];
    }
    
    groupedMessages[dateStr].push(message);
  });

  // Format date for display
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  // Group consecutive messages from the same sender
  const groupConsecutiveMessages = (messages: Message[]) => {
    const groups: Message[][] = [];
    let currentGroup: Message[] = [];
    
    messages.forEach((message, index) => {
      // Start a new group if this is the first message or if the sender changed
      if (index === 0 || message.senderId !== messages[index - 1].senderId) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [message];
      } else {
        // Same sender, add to current group
        currentGroup.push(message);
      }
    });
    
    // Add the last group if not empty
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat header */}
      {selectedContact ? (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 lg:hidden"
              onClick={onShowSidebar}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <AvatarWithStatus
              src={selectedContact.avatar}
              alt={selectedContact.displayName}
              status={selectedContact.isOnline ? "online" : "offline"}
            />
            <div className="ml-3">
              <h2 className="text-sm font-medium text-gray-900">
                {selectedContact.displayName}
              </h2>
              <div className={`text-xs ${selectedContact.isOnline ? "text-green-500" : "text-gray-500"}`}>
                {selectedContact.isOnline ? "Online" : "Offline"}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden"
            onClick={onShowSidebar}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-medium text-gray-900">Select a contact to start chatting</h2>
        </div>
      )}

      {/* Chat messages */}
      {selectedContact ? (
        <>
          <ScrollArea className="flex-1 p-4 bg-gray-100">
            {Object.keys(groupedMessages).map(dateStr => {
              const messagesForDate = groupedMessages[dateStr];
              const messageGroups = groupConsecutiveMessages(messagesForDate);
              
              return (
                <div key={dateStr}>
                  {/* Date separator */}
                  <div className="flex justify-center mb-4">
                    <div className="text-xs px-3 py-1 bg-gray-200 text-gray-500 rounded-full">
                      {formatDateHeader(dateStr)}
                    </div>
                  </div>
                  
                  {/* Message groups */}
                  {messageGroups.map((group, groupIndex) => (
                    <MessageGroup
                      key={groupIndex}
                      messages={group}
                      isOutgoing={group[0].senderId === currentUser?.id}
                      sender={group[0].senderId === currentUser?.id ? currentUser : selectedContact}
                      contactId={selectedContact.id}
                    />
                  ))}
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isContactTyping && selectedContact && (
              <div className="flex mb-4">
                <div className="flex-shrink-0 mr-2">
                  <AvatarWithStatus
                    src={selectedContact.avatar}
                    alt={selectedContact.displayName}
                    status="typing"
                    size="sm"
                  />
                </div>
                <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm inline-block">
                  <TypingIndicator />
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={scrollRef} />
          </ScrollArea>

          {/* Message input */}
          <ChatInput onSendMessage={onSendMessage} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center p-6 max-w-md">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to Chat App</h3>
            <p className="text-gray-600">
              Select a contact from the sidebar to start a conversation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
