import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ className, value, color = 'primary', ...props }, ref) => {
  const indicatorColor = {
    primary:   'bg-primary',
    secondary: 'bg-secondary',
    tertiary:  'bg-tertiary',
    error:     'bg-error',
  }[color] || 'bg-primary';

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-surface-container-high',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full rounded-full transition-all duration-700 ease-out', indicatorColor)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
