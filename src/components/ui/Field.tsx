import type { InputHTMLAttributes, PropsWithChildren, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Field({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-950/10 transition focus:border-slate-400 focus:ring-4" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-950/10 transition focus:border-slate-400 focus:ring-4" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-950/10 transition focus:border-slate-400 focus:ring-4" {...props} />;
}
