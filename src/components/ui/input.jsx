import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm text-on-surface ring-offset-background',
      'placeholder:text-outline',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-all duration-150',
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[100px] w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface',
      'placeholder:text-outline',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'resize-none transition-all duration-150',
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Input, Textarea };
