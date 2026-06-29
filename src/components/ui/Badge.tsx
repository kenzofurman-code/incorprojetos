import type { PropsWithChildren } from 'react';

export function Badge({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}
