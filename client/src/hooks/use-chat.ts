import { useState, useEffect, useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message, User } from "@shared/schema";

interface UseChatOptions {
  currentUser: User | null;
  selectedContact: User | null;
}

export function useChat({ currentUser, selectedContact }: UseChatOptions) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Update typing status
  const { mutate: updateTypingStatus } = useMutation({
    mutationFn: async (isTyping: boolean) => {
      if (!selectedContact || !currentUser) return;
      
      return await apiRequest("POST", "/api/typing", {
        receiverId: selectedContact.id,
        isTyping,
      });
    },
  });

  // Mark messages as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (messageIds: number[]) => {
      return await apiRequest("POST", "/api/messages/read", { messageIds });
    },
    onSuccess: () => {
      if (selectedContact) {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedContact.id}`] });
      }
    },
  });

  // Send message
  const { mutate: sendMessage } = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedContact || !currentUser) throw new Error("No contact selected");
      
      // Clear typing indicator when sending message
      if (isTyping) {
        setIsTyping(false);
        updateTypingStatus(false);
      }
      
      return await apiRequest("POST", "/api/messages", {
        receiverId: selectedContact.id,
        content,
      });
    },
    onSuccess: () => {
      if (selectedContact) {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedContact.id}`] });
      }
    },
  });

  // Handle typing status
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to clear typing status after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
    
    setTypingTimeout(timeout);
  }, [isTyping, typingTimeout, updateTypingStatus]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Clear typing status when component unmounts
      if (isTyping) {
        updateTypingStatus(false);
      }
    };
  }, [typingTimeout, isTyping, updateTypingStatus]);

  // Mark messages as read when contact changes
  useEffect(() => {
    if (selectedContact && currentUser) {
      const messages = queryClient.getQueryData<Message[]>([`/api/messages/${selectedContact.id}`]);
      
      if (messages) {
        const unreadMessages = messages
          .filter(msg => msg.senderId === selectedContact.id && !msg.isRead)
          .map(msg => msg.id);
        
        if (unreadMessages.length > 0) {
          markAsRead(unreadMessages);
        }
      }
    }
  }, [selectedContact, currentUser, markAsRead, queryClient]);

  return {
    sendMessage,
    handleTyping,
    isTyping,
    markAsRead,
  };
}
