import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  // Amount is in cents, so convert to dollars
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + " years ago";
  
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + " months ago";
  
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + " days ago";
  
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  
  return Math.floor(seconds) + " seconds ago";
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    SUBMITTED: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    DISPUTED: 'bg-red-500',
    REVISION_REQUESTED: 'bg-orange-500',
    PENDING_REVIEW: 'bg-gray-500',
    IN_MEDIATION: 'bg-yellow-500',
    IN_ARBITRATION: 'bg-orange-500',
    RESOLVED: 'bg-green-500',
    COMPLETED: 'bg-green-500',
    ACTIVE: 'bg-blue-500',
    CANCELLED: 'bg-red-500',
  };

  return statusColors[status] || 'bg-gray-500';
}