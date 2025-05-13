import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  inline?: boolean;
  className?: string;
}

export default function TypingIndicator({ inline = false, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "typing-indicator flex items-center",
        inline && "inline-flex",
        className
      )}
    >
      <span className="h-[7px] w-[7px] bg-gray-500 rounded-full mx-[1px] animate-bounce" style={{ animationDelay: "0s" }}></span>
      <span className="h-[7px] w-[7px] bg-gray-500 rounded-full mx-[1px] animate-bounce" style={{ animationDelay: "0.2s" }}></span>
      <span className="h-[7px] w-[7px] bg-gray-500 rounded-full mx-[1px] animate-bounce" style={{ animationDelay: "0.4s" }}></span>
    </div>
  );
}
