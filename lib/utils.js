import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merges Tailwind classes; shadcn and 21st.dev components import this as `cn`.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
