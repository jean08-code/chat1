import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageDate(date: Date | string): string {
  const messageDate = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(messageDate)) {
    return format(messageDate, "h:mm a");
  } else if (isYesterday(messageDate)) {
    return "Yesterday";
  } else {
    return format(messageDate, "MMM d");
  }
}

export function formatMessageTime(date: Date | string): string {
  const messageDate = typeof date === "string" ? new Date(date) : date;
  return format(messageDate, "h:mm a");
}

export function formatLastActive(date: Date | string): string {
  const lastActiveDate = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(lastActiveDate, { addSuffix: true });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
