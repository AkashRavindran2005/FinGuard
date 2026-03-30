import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Zap } from 'lucide-react';

export function Alert({ type = 'info', children, className = '', dismissible = false, onDismiss = null }) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const styles = {
    danger: {
      container: 'bg-red-50/80 border-red-300 border-l-4 border-l-red-600',
      text: 'text-red-700',
      icon: 'text-red-600',
      badge: 'bg-red-100/60 text-red-700',
    },
    warning: {
      container: 'bg-amber-50/80 border-amber-300 border-l-4 border-l-amber-600',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      badge: 'bg-amber-100/60 text-amber-700',
    },
    success: {
      container: 'bg-emerald-50/80 border-emerald-300 border-l-4 border-l-emerald-600',
      text: 'text-emerald-700',
      icon: 'text-emerald-600',
      badge: 'bg-emerald-100/60 text-emerald-700',
    },
    info: {
      container: 'bg-sky-50/80 border-sky-300 border-l-4 border-l-sky-600',
      text: 'text-sky-700',
      icon: 'text-sky-600',
      badge: 'bg-sky-100/60 text-sky-700',
    },
  };

  const icons = {
    danger: <AlertCircle className="w-5 h-5 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 shrink-0" />,
    info: <Info className="w-5 h-5 shrink-0" />,
  };

  const badgeLabels = {
    danger: '⚠️ Critical',
    warning: '⚠️ Warning',
    success: '✓ Success',
    info: 'ℹ️ Info',
  };

  const style = styles[type];

  return (
    <div className={`flex items-start gap-4 p-5 rounded-xl backdrop-blur-sm ${style.container} ${className}`}>
      <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
        {icons[type]}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${style.badge}`}>
            {badgeLabels[type]}
          </span>
        </div>
        <div className={`${style.text} text-sm font-medium leading-relaxed`}>
          {children}
        </div>
      </div>
      {dismissible && (
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
