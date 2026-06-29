import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ children, className = '', variant = 'primary', ...props }: PropsWithChildren<ButtonProps>) {
  const variants: Record<Variant, string> = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800 border-slate-950',
    secondary: 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border-transparent',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-600',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
