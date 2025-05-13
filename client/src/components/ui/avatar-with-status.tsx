import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarWithStatusProps {
  src: string;
  alt: string;
  status: "online" | "offline" | "typing";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarWithStatus({
  src,
  alt,
  status,
  size = "md",
  className,
}: AvatarWithStatusProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const statusSizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    typing: "bg-amber-500",
  };

  const initials = alt
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "absolute bottom-0 right-0 block border-2 border-white rounded-full",
          statusSizeClasses[size],
          statusColors[status],
          "transition-colors duration-300"
        )}
      />
    </div>
  );
}
