import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export function Toast({ type = 'info', title, message, onClose, duration = 6000 }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    danger: {
      bg: 'bg-red-600',
      border: 'border-red-700',
      icon: <AlertCircle className="w-6 h-6" />,
      text: 'text-white',
      bgLight: 'bg-red-500/10',
    },
    warning: {
      bg: 'bg-amber-600',
      border: 'border-amber-700',
      icon: <AlertTriangle className="w-6 h-6" />,
      text: 'text-white',
      bgLight: 'bg-amber-500/10',
    },
    success: {
      bg: 'bg-emerald-600',
      border: 'border-emerald-700',
      icon: <CheckCircle2 className="w-6 h-6" />,
      text: 'text-white',
      bgLight: 'bg-emerald-500/10',
    },
    info: {
      bg: 'bg-blue-600',
      border: 'border-blue-700',
      icon: <Info className="w-6 h-6" />,
      text: 'text-white',
      bgLight: 'bg-blue-500/10',
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ${
        isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`${style.bg} ${style.border} border-l-4 rounded-lg shadow-2xl overflow-hidden max-w-sm`}
      >
        <div className="p-4 flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5 text-white">
            {style.icon}
          </div>
          <div className="flex-1">
            {title && <div className="font-bold text-white text-sm mb-1">{title}</div>}
            <div className="text-white/90 text-sm leading-relaxed">{message}</div>
          </div>
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Toast container for managing multiple toasts
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
      <div className="pointer-events-auto p-6 space-y-3 flex flex-col items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration || 6000}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
