import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface StatisticItem {
  id: string;
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
    period?: string;
  };
  icon?: React.ReactNode;
  description?: string;
  color?: "default" | "success" | "warning" | "destructive";
}

export interface StatisticsProps {
  items: StatisticItem[];
  className?: string;
  variant?: "default" | "compact" | "detailed";
  columns?: 1 | 2 | 3 | 4;
}

const Statistics = React.forwardRef<HTMLDivElement, StatisticsProps>(
  ({ items, className, variant = "default", columns = 4 }, ref) => {
    const getGridCols = () => {
      switch (columns) {
        case 1:
          return "grid-cols-1";
        case 2:
          return "grid-cols-1 md:grid-cols-2";
        case 3:
          return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
        case 4:
        default:
          return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      }
    };

    const getChangeIcon = (type: "increase" | "decrease" | "neutral") => {
      switch (type) {
        case "increase":
          return <TrendingUp className="h-3 w-3" />;
        case "decrease":
          return <TrendingDown className="h-3 w-3" />;
        case "neutral":
        default:
          return <Minus className="h-3 w-3" />;
      }
    };

    const getChangeColor = (type: "increase" | "decrease" | "neutral") => {
      switch (type) {
        case "increase":
          return "text-success-foreground bg-success/10 border-success/20";
        case "decrease":
          return "text-destructive-foreground bg-destructive/10 border-destructive/20";
        case "neutral":
        default:
          return "text-muted-foreground bg-muted border-muted";
      }
    };

    const getCardColor = (color?: string) => {
      switch (color) {
        case "success":
          return "border-success/20 bg-success/5";
        case "warning":
          return "border-warning/20 bg-warning/5";
        case "destructive":
          return "border-destructive/20 bg-destructive/5";
        default:
          return "";
      }
    };

    if (variant === "compact") {
      return (
        <div ref={ref} className={cn("space-y-2", className)}>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {item.icon && (
                  <div className="p-2 rounded-md bg-muted">
                    {item.icon}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{item.value}</p>
                {item.change && (
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border",
                    getChangeColor(item.change.type)
                  )}>
                    {getChangeIcon(item.change.type)}
                    {item.change.value}%
                    {item.change.period && (
                      <span className="ml-1">vs {item.change.period}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(`grid gap-4 ${getGridCols()}`, className)}>
        {items.map((item) => (
          <Card key={item.id} className={cn(getCardColor(item.color))}>
            <CardHeader className={cn(
              "flex flex-row items-center justify-between space-y-0",
              variant === "detailed" ? "pb-2" : "pb-3"
            )}>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              {item.icon && (
                <div className="p-1">
                  {item.icon}
                </div>
              )}
            </CardHeader>
            <CardContent className={variant === "detailed" ? "pt-0" : ""}>
              <div className="text-2xl font-bold mb-2">{item.value}</div>
              
              {item.change && (
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      getChangeColor(item.change.type)
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {getChangeIcon(item.change.type)}
                      {item.change.value > 0 ? '+' : ''}{item.change.value}%
                    </span>
                  </Badge>
                  {item.change.period && (
                    <span className="text-xs text-muted-foreground">
                      vs {item.change.period}
                    </span>
                  )}
                </div>
              )}
              
              {variant === "detailed" && item.description && (
                <p className="text-xs text-muted-foreground mt-2">
                  {item.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
);
Statistics.displayName = "Statistics";

export { Statistics };