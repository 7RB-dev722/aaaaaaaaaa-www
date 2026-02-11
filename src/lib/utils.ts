import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Retries a promise-returning function multiple times with a delay.
 * Useful for handling transient network errors or cold starts.
 */
export async function retry<T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 1000, 
  backoff = 1.5
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with decremented count and increased delay (exponential backoff)
    return retry(fn, retries - 1, delay * backoff, backoff);
  }
}
