import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-card text-primary rounded-[2rem] border border-border shadow-card hover:shadow-card-hover transition-all duration-200 p-8 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-bold text-primary tracking-tight ${className}`}>
      {children}
    </h3>
  );
}
