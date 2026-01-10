import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { DayPicker, DayProps } from "react-day-picker";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type?: "leave" | "meeting" | "deadline" | "holiday" | "other";
  status?: "confirmed" | "pending" | "cancelled";
  color?: string;
  attendees?: string[];
}

export interface EventCalendarProps {
  events?: CalendarEvent[];
  selectedDate?: Date;
  onDateSelect?: (date: Date | undefined) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  className?: string;
  showAddButton?: boolean;
  showEventList?: boolean;
  eventTypes?: Record<string, { label: string; color: string; bgColor: string }>;
  view?: "month" | "week";
  loading?: boolean;
}

const defaultEventTypes = {
  leave: { label: "Leave", color: "text-blue-600", bgColor: "bg-blue-100" },
  meeting: { label: "Meeting", color: "text-green-600", bgColor: "bg-green-100" },
  deadline: { label: "Deadline", color: "text-red-600", bgColor: "bg-red-100" },
  holiday: { label: "Holiday", color: "text-purple-600", bgColor: "bg-purple-100" },
  other: { label: "Other", color: "text-gray-600", bgColor: "bg-gray-100" },
};

export const EventCalendar = React.forwardRef<HTMLDivElement, EventCalendarProps>(
  ({
    events = [],
    selectedDate,
    onDateSelect,
    onEventClick,
    onAddEvent,
    className,
    showAddButton = true,
    showEventList = true,
    eventTypes = defaultEventTypes,
    view = "month",
    loading = false,
  }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date());
    const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);

    const getEventsForDate = (date: Date) => {
      return events.filter(event => isSameDay(event.date, date));
    };

    const getEventTypeConfig = (type: string) => {
      return eventTypes[type] || eventTypes.other;
    };

    const CustomDay = ({ date, displayMonth, ...props }: DayProps) => {
      const dayEvents = getEventsForDate(date);
      const hasEvents = dayEvents.length > 0;
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const isHovered = hoveredDate && isSameDay(date, hoveredDate);

      // Remove displayMonth from props to avoid passing it to DOM
      const { displayMonth: _, ...buttonProps } = props;

      return (
        <div className="relative">
          <button
            {...buttonProps}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 relative",
              isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              hasEvents && !isSelected && "bg-accent text-accent-foreground",
              isHovered && "bg-muted",
              "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onDateSelect?.(date)}
            onMouseEnter={() => setHoveredDate(date)}
            onMouseLeave={() => setHoveredDate(null)}
          >
            {format(date, "d")}
            {hasEvents && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                {dayEvents.slice(0, 3).map((event, index) => {
                  const typeConfig = getEventTypeConfig(event.type || "other");
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        typeConfig.bgColor.replace("bg-", "bg-opacity-80 bg-")
                      )}
                      style={{ backgroundColor: event.color }}
                    />
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="w-1 h-1 rounded-full bg-gray-400" />
                )}
              </div>
            )}
          </button>
          
          {/* Event Tooltip */}
          {isHovered && hasEvents && (
            <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-1">
              <div className="bg-popover text-popover-foreground p-2 rounded-md shadow-md border min-w-[200px]">
                <div className="text-sm font-medium mb-1">
                  {format(date, "MMM d, yyyy")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const typeConfig = getEventTypeConfig(event.type || "other");
                    return (
                      <div key={event.id} className="flex items-center space-x-2 text-xs">
                        <div
                          className={cn("w-2 h-2 rounded-full", typeConfig.bgColor)}
                          style={{ backgroundColor: event.color }}
                        />
                        <span className="truncate">{event.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    if (loading) {
      return (
        <Card className={className} ref={ref}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Calendar</span>
              </CardTitle>
              {showAddButton && selectedDate && onAddEvent && (
                <Button
                  size="sm"
                  onClick={() => onAddEvent(selectedDate)}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Event</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              showOutsideDays={true}
              className="p-0"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal",
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                Day: CustomDay,
              }}
            />
          </CardContent>
        </Card>

        {/* Event List */}
        {showEventList && selectedDate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Events for {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => {
                      const typeConfig = getEventTypeConfig(event.type || "other");
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                            onEventClick && "hover:bg-accent"
                          )}
                          onClick={() => onEventClick?.(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <div
                                  className={cn("w-3 h-3 rounded-full", typeConfig.bgColor)}
                                  style={{ backgroundColor: event.color }}
                                />
                                <h4 className="font-medium">{event.title}</h4>
                                <Badge variant="outline" className={typeConfig.color}>
                                  {typeConfig.label}
                                </Badge>
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {event.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                {event.startTime && event.endTime && (
                                  <span>{event.startTime} - {event.endTime}</span>
                                )}
                                {event.status && (
                                  <Badge
                                    variant={
                                      event.status === "confirmed" ? "default" :
                                      event.status === "pending" ? "secondary" : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {event.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events scheduled for this date</p>
                  {showAddButton && onAddEvent && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => onAddEvent(selectedDate)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Event Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(eventTypes).map(([type, config]) => (
                <div key={type} className="flex items-center space-x-2">
                  <div className={cn("w-3 h-3 rounded-full", config.bgColor)} />
                  <span className="text-sm">{config.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
EventCalendar.displayName = "EventCalendar";