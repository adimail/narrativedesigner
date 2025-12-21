import * as React from "react";
import { cn } from "../../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full items-center justify-between border-2 border-black bg-white px-3 py-2 text-sm font-mono ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]",
            className,
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute right-3 top-3 pointer-events-none">
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
