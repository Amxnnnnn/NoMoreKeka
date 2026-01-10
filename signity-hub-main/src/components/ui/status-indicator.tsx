import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusIndicatorVariants = cva(
  "inline-flex items-center gap-2",
  {
    variants: {
      variant: {
        dot: "text-sm font-medium",
        badge: "px-2 py-1 rounded-full text-xs font-medium",
        pill: "px-3 py-1 rounded-full text-sm font-medium",
      },
      status: {
        active: "text-success-foreground",
        inactive: "text-muted-foreground",
        pending: "text-warning-foreground",
        approved: "text-success-foreground",
        rejected: "text-destructive-foreground",
        online: "text-success-foreground",
        offline: "text-muted-foreground",
        away: "text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "dot",
      status: "active",
    },
  }
);

const dotVariants = cva(
  "w-2 h-2 rounded-full",
  {
    variants: {
      status: {
        active: "bg-success animate-pulse",
        inactive: "bg-muted-foreground",
        pending: "bg-warning animate-pulse",
        approved: "bg-success",
        rejected: "bg-destructive",
        online: "bg-success animate-pulse",
        offline: "bg-muted-foreground",
        away: "bg-warning animate-pulse",
      },
    },
    defaultVariants: {
      status: "active",
    },
  }
);

const badgeVariants = cva(
  "border",
  {
    variants: {
      status: {
        active: "bg-success/10 text-success-foreground border-success/20",
        inactive: "bg-muted text-muted-foreground border-muted",
        pending: "bg-warning/10 text-warning-foreground border-warning/20",
        approved: "bg-success/10 text-success-foreground border-success/20",
        rejected: "bg-destructive/10 text-destructive-foreground border-destructive/20",
        online: "bg-success/10 text-success-foreground border-success/20",
        offline: "bg-muted text-muted-foreground border-muted",
        away: "bg-warning/10 text-warning-foreground border-warning/20",
      },
    },
    defaultVariants: {
      status: "active",
    },
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, variant, status, label, children, ...props }, ref) => {
    const getStatusLabel = (status: string) => {
      const labels = {
        active: "Active",
        inactive: "Inactive",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        online: "Online",
        offline: "Offline",
        away: "Away",
      };
      return labels[status as keyof typeof labels] || status;
    };

    const displayLabel = label || getStatusLabel(status || "active");

    return (
      <div
        ref={ref}
        className={cn(
          statusIndicatorVariants({ variant, status }),
          variant === "badge" && badgeVariants({ status }),
          variant === "pill" && badgeVariants({ status }),
          className
        )}
        {...props}
      >
        {variant === "dot" && (
          <div className={cn(dotVariants({ status }))} />
        )}
        <span>{displayLabel}</span>
        {children}
      </div>
    );
  }
);
StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator, statusIndicatorVariants };