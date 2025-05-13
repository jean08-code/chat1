import { useState, useRef, useEffect } from "react";
import { Paperclip, Smile, Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when component mounts
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 mr-2">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 mr-2">
          <Smile className="h-5 w-5" />
        </Button>
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="w-full border-gray-300 rounded-full py-2 pl-4 pr-10 focus:ring-primary focus:border-primary"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleSendMessage}
          className="ml-2 bg-primary hover:bg-primary/90 text-white rounded-full p-2 transition-colors"
          size="icon"
          disabled={!message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
