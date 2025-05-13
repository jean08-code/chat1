import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadReceiptProps {
  isRead: boolean;
  className?: string;
}

export default function ReadReceipt({ isRead, className }: ReadReceiptProps) {
  return (
    <div className={cn("transition-colors duration-300", className)}>
      <Check className={cn("h-4 w-4", isRead ? "text-primary" : "text-gray-400")} />
    </div>
  );
}
