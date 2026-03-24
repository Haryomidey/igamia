import React from 'react';

export function StreamIconButton({
  title,
  onClick,
  children,
  label,
  active = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  label?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-3 backdrop-blur-md transition-colors disabled:opacity-50 ${
        danger
          ? 'border-red-500/30 bg-red-600 text-white'
          : active
            ? 'border-brand-accent/30 bg-brand-accent/20 text-brand-accent'
            : 'border-white/10 bg-black/30 text-white hover:bg-black/45'
      } ${label ? 'min-w-[5.5rem]' : 'w-11'}`}
    >
      {children}
      {label && <span className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</span>}
    </button>
  );
}
