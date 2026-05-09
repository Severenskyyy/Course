import { cn } from '../../utils/cn';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: 'indigo' | 'purple' | 'emerald' | 'amber' | 'red' | 'none';
}

export function Card({ children, className, onClick, hover = false, glow = 'none' }: CardProps) {
  const glowStyles = {
    indigo: 'hover:shadow-indigo-500/20',
    purple: 'hover:shadow-purple-500/20',
    emerald: 'hover:shadow-emerald-500/20',
    amber: 'hover:shadow-amber-500/20',
    red: 'hover:shadow-red-500/20',
    none: '',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6',
        'transition-all duration-300 ease-out',
        hover && 'cursor-pointer hover:bg-slate-800/70 hover:border-slate-600/50 hover:scale-[1.02] hover:shadow-xl',
        glowStyles[glow],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('text-slate-300', className)}>
      {children}
    </div>
  );
}
