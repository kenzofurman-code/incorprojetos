import type { PropsWithChildren } from 'react';

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

export function CardHeader({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`border-b border-slate-100 p-5 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
