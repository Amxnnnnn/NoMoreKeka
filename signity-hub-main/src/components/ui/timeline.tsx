import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: "completed" | "current" | "upcoming" | "cancelled";
  icon?: React.ReactNode;
  content?: React.ReactNode;
  user?: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  metadata?: Record<string, any>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive";
  }>;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  variant?: "default" | "compact" | "detailed";
  showTime?: boolean;
  orientation?: "vertical" | "horizontal";
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: number;
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ 
    items, 
    className, 
    variant = "default", 
    showTime = true, 
    orientation = "vertical",
    title,
    loading = false,
    emptyMessage = "No timeline items to display",
    maxHeight,
  }, ref) => {
    const formatTime = (timestamp: Date | string) => {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return date.toLocaleString();
    };

    const getStatusColor = (status?: string) => {
      switch (status) {
        case "completed":
          return "bg-green-500 border-green-500";
        case "current":
          return "bg-primary border-primary animate-pulse";
        case "upcoming":
          return "bg-muted border-muted-foreground";
        case "cancelled":
          return "bg-red-500 border-red-500";
        default:
          return "bg-primary border-primary";
      }
    };

    const getStatusBadgeVariant = (status?: string) => {
      switch (status) {
        case "completed":
          return "default" as const;
        case "current":
          return "default" as const;
        case "upcoming":
          return "secondary" as const;
        case "cancelled":
          return "destructive" as const;
        default:
          return "default" as const;
      }
    };

    if (loading) {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (items.length === 0) {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>{emptyMessage}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (orientation === "horizontal") {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <ScrollArea className="w-full">
              <div className="flex space-x-4 pb-4 min-w-max">
                {items.map((item, index) => (
                  <div key={item.id} className="flex flex-col items-center min-w-[200px]">
                    {/* Timeline dot */}
                    <div className="flex items-center">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          getStatusColor(item.status)
                        )}
                      >
                        {item.icon && <div className="w-2 h-2">{item.icon}</div>}
                      </div>
                      {index < items.length - 1 && (
                        <div className="w-16 h-0.5 bg-border ml-2" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="mt-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.status && (
                          <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                      )}
                      {showTime && (
                        <time className="text-xs text-muted-foreground">
                          {formatTime(item.timestamp)}
                        </time>
                      )}
                      {item.content && (
                        <div className="mt-2">{item.content}</div>
                      )}
                      {item.actions && item.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 justify-center">
                          {item.actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              size="sm"
                              variant={action.variant || "outline"}
                              onClick={action.onClick}
                              className="text-xs"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      );
    }

    const TimelineContent = () => (
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="relative flex items-start">
              {/* Timeline dot */}
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-background",
                  getStatusColor(item.status)
                )}
              >
                {item.icon || (
                  <div className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>
              
              {/* Content */}
              <div className={cn("ml-6 flex-1", variant === "compact" ? "pb-4" : "pb-6")}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{item.title}</h4>
                      {item.status && (
                        <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    
                    {item.user && (
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={item.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {item.user.initials || item.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{item.user.name}</span>
                      </div>
                    )}
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    )}
                    
                    {item.content && (
                      <div className="mt-2">{item.content}</div>
                    )}
                    
                    {item.actions && item.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            size="sm"
                            variant={action.variant || "outline"}
                            onClick={action.onClick}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {showTime && (
                    <time className="text-sm text-muted-foreground ml-4 flex-shrink-0">
                      {formatTime(item.timestamp)}
                    </time>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if (title) {
      return (
        <Card className={className} ref={ref}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            {maxHeight ? (
              <ScrollArea className="w-full" style={{ height: maxHeight }}>
                <TimelineContent />
              </ScrollArea>
            ) : (
              <TimelineContent />
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div ref={ref} className={cn("relative", className)}>
        {maxHeight ? (
          <ScrollArea className="w-full" style={{ height: maxHeight }}>
            <TimelineContent />
          </ScrollArea>
        ) : (
          <TimelineContent />
        )}
      </div>
    );
  }
);
Timeline.displayName = "Timeline";

export { Timeline };