import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-5 w-5 shrink-0 rounded-md border-2 border-outline-variant',
      'ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-secondary data-[state=checked]:border-secondary',
      'transition-all duration-150',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
