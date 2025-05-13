import { format } from "date-fns";
import { Message, User } from "@shared/schema";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import ReadReceipt from "@/components/ReadReceipt";
import MessageOptions from "@/components/MessageOptions";

interface MessageGroupProps {
  messages: Message[];
  isOutgoing: boolean;
  sender: User | null;
  contactId?: number;
}

export default function MessageGroup({ messages, isOutgoing, sender, contactId = 0 }: MessageGroupProps) {
  if (!sender || messages.length === 0) return null;

  // Format the message timestamp
  const formatMessageTime = (timestamp: Date | string): string => {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return format(date, "h:mm a");
  };

  // Get the time of the last message for display
  const lastMessageTime = formatMessageTime(messages[messages.length - 1].timestamp);
  
  // Check if the last message has been read (for outgoing messages)
  const isLastMessageRead = isOutgoing && messages[messages.length - 1].isRead;

  return (
    <div className={`flex mb-4 ${isOutgoing ? "justify-end" : ""}`}>
      {!isOutgoing && (
        <div className="flex-shrink-0 mr-2">
          <AvatarWithStatus
            src={sender.avatar}
            alt={sender.displayName}
            status={sender.isOnline ? "online" : "offline"}
            size="sm"
          />
        </div>
      )}
      <div className={`max-w-[75%] ${isOutgoing ? "" : ""}`}>
        {messages.map((message, index) => {
          const isFirst = index === 0;
          const isLast = index === messages.length - 1;
          
          return (
            <div
              key={message.id}
              className={`
                ${isOutgoing ? "bg-primary text-white" : "bg-white text-gray-800"}
                rounded-lg
                ${isOutgoing && isFirst ? "rounded-tr-none" : ""}
                ${!isOutgoing && isFirst ? "rounded-tl-none" : ""}
                px-4 py-2 shadow-sm
                ${isLast ? "" : "mb-1"}
                animate-in fade-in-0 slide-in-from-bottom-5
                relative group
              `}
            >
              <p>{message.content}</p>
              <MessageOptions 
                messageId={message.id} 
                contactId={contactId} 
                isOutgoing={isOutgoing} 
              />
            </div>
          );
        })}
        
        <div className={`flex ${isOutgoing ? "justify-end" : ""} items-center mt-1`}>
          <div className="text-xs text-gray-500 mr-1">{lastMessageTime}</div>
          {isOutgoing && <ReadReceipt isRead={isLastMessageRead} />}
        </div>
      </div>
    </div>
  );
}
