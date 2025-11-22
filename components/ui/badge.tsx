import { clsx } from 'clsx';
import { ReactNode } from 'react';

type BadgeProps = {
  variant?: 'default' | 'warning' | 'success' | 'danger';
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-primary-100 text-primary-700',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-rose-100 text-rose-700'
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
