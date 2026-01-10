import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Enhanced Progress Component
export interface EnhancedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  max?: number;
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "destructive";
  size?: "sm" | "default" | "lg";
  animated?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  EnhancedProgressProps
>(({ 
  className, 
  value = 0, 
  max = 100,
  showValue = false,
  showPercentage = true,
  label,
  description,
  variant = "default",
  size = "default",
  animated = false,
  ...props 
}, ref) => {
  const percentage = Math.round((value / max) * 100);
  
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "destructive":
        return "bg-red-500";
      default:
        return "bg-primary";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "h-2";
      case "lg":
        return "h-6";
      default:
        return "h-4";
    }
  };

  return (
    <div className="space-y-2">
      {(label || showValue || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <div className="flex items-center space-x-2">
            {showValue && (
              <span className="text-muted-foreground">
                {value}/{max}
              </span>
            )}
            {showPercentage && (
              <span className="font-medium">{percentage}%</span>
            )}
          </div>
        </div>
      )}
      
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          getSizeStyles(),
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all",
            getVariantStyles(),
            animated && "animate-pulse"
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
});
Progress.displayName = "Progress";

// Circular Progress Component
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  showPercentage?: boolean;
  variant?: "default" | "success" | "warning" | "destructive";
  children?: React.ReactNode;
}

export const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({
    value,
    max = 100,
    size = 120,
    strokeWidth = 8,
    className,
    showValue = false,
    showPercentage = true,
    variant = "default",
    children,
  }, ref) => {
    const percentage = Math.round((value / max) * 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getVariantColor = () => {
      switch (variant) {
        case "success":
          return "stroke-green-500";
        case "warning":
          return "stroke-yellow-500";
        case "destructive":
          return "stroke-red-500";
        default:
          return "stroke-primary";
      }
    };

    return (
      <div ref={ref} className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted stroke-current opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn("transition-all duration-300 ease-in-out", getVariantColor())}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (
            <div className="text-center">
              {showPercentage && (
                <div className="text-2xl font-bold">{percentage}%</div>
              )}
              {showValue && (
                <div className="text-sm text-muted-foreground">
                  {value}/{max}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

// Multi-step Progress Component
export interface Step {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "upcoming" | "error";
}

export interface MultiStepProgressProps {
  steps: Step[];
  className?: string;
  orientation?: "horizontal" | "vertical";
  showDescriptions?: boolean;
}

export const MultiStepProgress = React.forwardRef<HTMLDivElement, MultiStepProgressProps>(
  ({
    steps,
    className,
    orientation = "horizontal",
    showDescriptions = true,
  }, ref) => {
    const getStepIcon = (status: Step["status"]) => {
      switch (status) {
        case "completed":
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case "current":
          return <Clock className="h-5 w-5 text-primary" />;
        case "error":
          return <AlertCircle className="h-5 w-5 text-red-500" />;
        default:
          return <Circle className="h-5 w-5 text-muted-foreground" />;
      }
    };

    const getStepStyles = (status: Step["status"]) => {
      switch (status) {
        case "completed":
          return "border-green-500 bg-green-50 text-green-700";
        case "current":
          return "border-primary bg-primary/10 text-primary";
        case "error":
          return "border-red-500 bg-red-50 text-red-700";
        default:
          return "border-muted-foreground bg-muted text-muted-foreground";
      }
    };

    if (orientation === "vertical") {
      return (
        <div ref={ref} className={cn("space-y-4", className)}>
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2",
                    getStepStyles(step.status)
                  )}
                >
                  {getStepIcon(step.status)}
                </div>
                {index < steps.length - 1 && (
                  <div className="mt-2 h-8 w-0.5 bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{step.title}</h4>
                {showDescriptions && step.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("flex items-center justify-between", className)}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 mb-2",
                  getStepStyles(step.status)
                )}
              >
                {getStepIcon(step.status)}
              </div>
              <div className="max-w-[120px]">
                <h4 className="font-medium text-sm">{step.title}</h4>
                {showDescriptions && step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-muted mx-4" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
);
MultiStepProgress.displayName = "MultiStepProgress";

// Progress Card Component
export interface ProgressCardProps {
  title: string;
  description?: string;
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "destructive";
  showPercentage?: boolean;
  showValue?: boolean;
  className?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const ProgressCard = React.forwardRef<HTMLDivElement, ProgressCardProps>(
  ({
    title,
    description,
    value,
    max = 100,
    variant = "default",
    showPercentage = true,
    showValue = false,
    className,
    icon,
    actions,
  }, ref) => {
    const percentage = Math.round((value / max) * 100);

    return (
      <Card ref={ref} className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {icon && <div className="text-muted-foreground">{icon}</div>}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {actions}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{percentage}%</span>
              {showValue && (
                <Badge variant="outline">
                  {value} / {max}
                </Badge>
              )}
            </div>
            <Progress
              value={value}
              max={max}
              variant={variant}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    );
  }
);
ProgressCard.displayName = "ProgressCard";

export { Progress };