import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center whitespace-nowrap text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-mono border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
          {
            "bg-white text-black hover:bg-gray-100": variant === "default",
            "bg-transparent text-black hover:bg-gray-100":
              variant === "outline",
            "border-transparent shadow-none hover:bg-gray-100 active:translate-x-0 active:translate-y-0":
              variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600": variant === "destructive",
            "h-10 px-4 py-2": size === "default",
            "h-9 px-3": size === "sm",
            "h-10 w-10": size === "icon",
          },
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
