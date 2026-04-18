import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nb-blue/50 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:     "bg-nb-blue text-white border-[3px] border-black shadow-nb hover:shadow-nb-md active:shadow-nb-sm active:translate-x-[2px] active:translate-y-[2px]",
        secondary:   "bg-nb-yellow text-black border-[3px] border-black shadow-nb hover:shadow-nb-md active:shadow-nb-sm active:translate-x-[2px] active:translate-y-[2px]",
        success:     "bg-nb-green text-black border-[3px] border-black shadow-nb hover:shadow-nb-md active:shadow-nb-sm active:translate-x-[2px] active:translate-y-[2px]",
        destructive: "bg-nb-coral text-white border-[3px] border-black shadow-nb hover:shadow-nb-md active:shadow-nb-sm active:translate-x-[2px] active:translate-y-[2px]",
        outline:     "bg-white text-black border-[3px] border-black shadow-nb hover:shadow-nb-md active:shadow-nb-sm active:translate-x-[2px] active:translate-y-[2px]",
        ghost:       "bg-transparent text-black border-[2px] border-transparent hover:border-black hover:bg-white hover:shadow-nb-sm active:translate-x-[1px] active:translate-y-[1px]",
        link:        "text-nb-blue underline-offset-4 hover:underline p-0 border-none shadow-none",
        purple:      "bg-nb-purple text-black border-[3px] border-black shadow-nb hover:shadow-nb-md active:shadow-nb-sm active:translate-x-[2px] active:translate-y-[2px]",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm:      "h-7 rounded-lg px-3 text-xs",
        lg:      "h-12 rounded-2xl px-7 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
