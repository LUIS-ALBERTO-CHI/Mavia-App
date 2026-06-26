import * as React from 'react';
import { cn } from '../../lib/utils';
import { cva } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-primary text-on-primary',
        primary:     'bg-primary-container text-on-primary-container',
        secondary:   'bg-secondary-container text-on-secondary-container',
        tertiary:    'bg-tertiary-container text-on-tertiary-container',
        outline:     'border border-outline-variant text-on-surface-variant bg-transparent',
        destructive: 'bg-error-container text-on-error-container',
        success:     'bg-secondary-container text-on-secondary-container',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
);

const Badge = React.forwardRef(({ className, variant, dot, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props}>
    {dot && (
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: 'currentColor', opacity: 0.7 }}
      />
    )}
    {props.children}
  </span>
));
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
