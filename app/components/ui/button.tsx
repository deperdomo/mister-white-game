import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-ink shadow-[0_4px_0_0_var(--color-accent-deep)] hover:brightness-105 active:scale-100 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-accent-deep)]',
        destructive: 'bg-red-500/90 text-white hover:bg-red-500',
        outline:
          'border border-white/15 bg-transparent text-fg hover:bg-white/5 hover:border-white/25',
        secondary: 'border border-white/10 bg-panel text-fg hover:bg-elevated',
        ghost: 'text-fg hover:bg-white/5',
        link: 'text-accent underline-offset-4 hover:underline',
        success: 'bg-emerald-500/90 text-white hover:bg-emerald-500',
      },
      size: {
        default: 'h-11 px-5 text-[15px]',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-7 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
