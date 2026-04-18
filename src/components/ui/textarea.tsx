import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-xl border-[2px] border-black bg-white px-3 py-2.5 text-sm font-semibold text-black placeholder:text-ink-faint placeholder:font-normal",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nb-blue/40 focus-visible:border-nb-blue",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all resize-none shadow-nb-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
