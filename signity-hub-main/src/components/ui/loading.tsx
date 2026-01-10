import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const loadingVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "flex-col gap-2",
        inline: "flex-row gap-2",
        overlay: "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
        card: "p-8 rounded-lg border bg-card",
      },
      size: {
        sm: "min-h-[100px]",
        default: "min-h-[200px]",
        lg: "min-h-[300px]",
        full: "min-h-screen",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string;
  spinnerSize?: "sm" | "default" | "lg" | "xl";
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant, size, text = "Loading...", spinnerSize, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(loadingVariants({ variant, size }), className)}
        {...props}
      >
        <Spinner size={spinnerSize} />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }
);
Loading.displayName = "Loading";

export { Loading, loadingVariants };