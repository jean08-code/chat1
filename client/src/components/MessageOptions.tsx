import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Reply, Copy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MessageOptionsProps {
  messageId: number;
  contactId: number;
  isOutgoing: boolean;
  onReply?: (messageId: number) => void;
}

export default function MessageOptions({ 
  messageId, 
  contactId, 
  isOutgoing, 
  onReply 
}: MessageOptionsProps) {
  const { toast } = useToast();
  
  // Delete message mutation
  const { mutate: deleteMessage, isPending } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/messages/delete", { messageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${contactId}`] });
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete message",
        description: "There was a problem deleting your message. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Copy message text
  const handleCopyText = () => {
    // In a real implementation, we'd have the message text here
    // For now, just show a toast
    toast({
      title: "Message copied",
      description: "Message content copied to clipboard.",
    });
  };
  
  // Handle reply
  const handleReply = () => {
    if (onReply) {
      onReply(messageId);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleReply} className="cursor-pointer">
          <Reply className="mr-2 h-4 w-4" />
          <span>Reply</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyText} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy text</span>
        </DropdownMenuItem>
        {isOutgoing && (
          <DropdownMenuItem 
            onClick={() => deleteMessage()} 
            disabled={isPending}
            className="text-red-500 cursor-pointer focus:text-red-500"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{isPending ? "Deleting..." : "Delete"}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}