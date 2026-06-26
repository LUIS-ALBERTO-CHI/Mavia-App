import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95',
  {
    variants: {
      variant: {
        default:     'bg-primary text-on-primary shadow-sm hover:opacity-90',
        destructive: 'bg-error text-on-error shadow-sm hover:opacity-90',
        outline:     'border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface',
        secondary:   'bg-secondary-container text-on-secondary-container hover:opacity-90',
        ghost:       'hover:bg-surface-container text-on-surface-variant hover:text-on-surface',
        link:        'text-primary underline-offset-4 hover:underline',
        primary:     'bg-primary text-on-primary shadow-sm hover:opacity-90',
        soft:        'bg-primary-container text-on-primary-container hover:opacity-90',
        sage:        'bg-secondary text-on-secondary shadow-sm hover:opacity-90',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-12 px-8 text-base',
        xl:      'h-14 px-10 text-base',
        icon:    'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
