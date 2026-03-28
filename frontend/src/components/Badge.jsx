import React from 'react';

export function Badge({ type = 'info', children, className = '' }) {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-500',
    info: 'bg-sky-500/10 text-sky-400',
    accent: 'bg-blue-500/10 text-blue-400',
    neutral: 'bg-zinc-500/10 text-muted',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[type]} ${className}`}>
      {children}
    </span>
  );
}
