import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#11adc4] via-[#10a1b7] to-[#0e92a6] text-white font-semibold shadow-md shadow-[#11adc4]/25 hover:shadow-lg hover:shadow-[#11adc4]/35 hover:brightness-105 active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 hover:brightness-105 active:scale-[0.98]",
        outline:
          "border-2 border-[#11adc4]/40 bg-card text-[#0f5766] dark:text-[#11adc4] font-semibold hover:bg-[#11adc4]/15 hover:border-[#11adc4] shadow-xs active:scale-[0.98]",
        secondary:
          "bg-gradient-to-r from-[#0f5766] to-[#093d4a] text-white font-semibold shadow-md shadow-[#0f5766]/25 hover:shadow-lg hover:shadow-[#0f5766]/35 hover:brightness-110 active:scale-[0.98]",
        ghost:
          "text-[#0f5766] dark:text-[#11adc4] hover:bg-[#11adc4]/15 hover:text-[#0c7484] font-medium",
        link: "text-[#11adc4] underline-offset-4 hover:underline font-semibold",
        accent:
          "bg-gradient-to-r from-teal-400 to-[#11adc4] text-white font-semibold shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35 hover:brightness-105 active:scale-[0.98]",
        success:
          "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 hover:brightness-105 active:scale-[0.98]",
        info:
          "bg-gradient-to-r from-[#11adc4] to-[#0f5766] text-white font-semibold shadow-md shadow-[#11adc4]/25 hover:shadow-lg hover:shadow-[#11adc4]/35 hover:brightness-105 active:scale-[0.98]",
        warning:
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/35 hover:brightness-105 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
