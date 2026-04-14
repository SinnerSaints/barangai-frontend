import { API_BASE_URL } from "@/lib/auth";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"


/**
 * Helper to construct a full image URL from a relative path or return a full URL/blob URL as is.
 * @param path The image path (can be relative, absolute, or blob URL).
 * @returns A full, absolute URL for the image, or null if the path is null/undefined.
 */
export const getFullImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  // If it's already a full URL (http/https) or a blob URL, return as is
  if (path.startsWith("blob:") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // For relative paths, prepend the API base URL
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${path}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}