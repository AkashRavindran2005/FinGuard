import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export function Alert({ type = 'info', children, className = '' }) {
  const styles = {
    danger: 'bg-red-500/10 text-red-600 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };

  const icons = {
    danger: <AlertCircle className="w-5 h-5 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 shrink-0" />,
    info: <Info className="w-5 h-5 shrink-0" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm font-medium ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1 mt-0.5">{children}</div>
    </div>
  );
}
