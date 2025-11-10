// Simple utility function to combine class names without external dependencies
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs
    .filter(Boolean)
    .join(' ')
    .trim();
}
