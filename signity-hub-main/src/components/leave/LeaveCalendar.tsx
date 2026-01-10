import * as React from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Calendar, Users, UserCheck, UserX } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCalendar, CalendarEvent } from "@/components/ui/event-calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { Leave, leaveService } from "@/services/leave.service";
import { useDataStore } from "@/stores/dataStore";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface LeaveCalendarProps {
  showTeamView?: boolean;
  teamMembers?: TeamMember[];
  onDateSelect?: (date: Date) => void;
  onLeaveClick?: (leave: Leave) => void;
  className?: string;
}

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  showTeamView = false,
  teamMembers = [],
  onDateSelect,
  onLeaveClick,
  className,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [leaves, setLeaves] = React.useState<Leave[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'my' | 'team'>('my');

  const { leaves: storeLeaves } = useDataStore();

  // Load leave data
  React.useEffect(() => {
    const loadLeaves = async () => {
      setLoading(true);
      try {
        if (viewMode === 'team' && showTeamView) {
          const result = await leaveService.getTeamLeaveRequests();
          if (result.success) {
            setLeaves(result.data);
          }
        } else {
          const result = await leaveService.getLeaveHistory();
          if (result.success) {
            setLeaves(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to load leaves:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeLeaves.length > 0 && viewMode === 'my') {
      setLeaves(storeLeaves);
    } else {
      loadLeaves();
    }
  }, [viewMode, showTeamView, storeLeaves]);

  // Convert leaves to calendar events
  const calendarEvents: CalendarEvent[] = React.useMemo(() => {
    const events: CalendarEvent[] = [];

    leaves.forEach(leave => {
      if (leave.status === 'APPROVED' || leave.status === 'PENDING') {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        
        // Create events for each day of the leave period
        const leaveDays = eachDayOfInterval({ start: startDate, end: endDate });
        
        leaveDays.forEach((date, index) => {
          const isFirstDay = index === 0;
          const isLastDay = index === leaveDays.length - 1;
          
          let title = leave.leaveType.name;
          if (viewMode === 'team') {
            // Add user name for team view (would need user info from API)
            title = `${leave.leaveType.name}`;
          }
          
          if (leaveDays.length > 1) {
            if (isFirstDay) title += " (Start)";
            else if (isLastDay) title += " (End)";
          }

          events.push({
            id: `${leave.id}-${date.getTime()}`,
            title,
            description: leave.reason,
            date,
            type: 'leave',
            status: leave.status === 'APPROVED' ? 'confirmed' : 'pending',
            color: leave.status === 'APPROVED' ? '#10b981' : '#f59e0b',
          });
        });
      }
    });

    return events;
  }, [leaves, viewMode]);

  // Get availability summary for selected date
  const getDateAvailability = (date: Date) => {
    const dateLeaves = leaves.filter(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      return date >= startDate && date <= endDate && 
             (leave.status === 'APPROVED' || leave.status === 'PENDING');
    });

    const totalMembers = showTeamView ? teamMembers.length : 1;
    const onLeave = dateLeaves.length;
    const available = totalMembers - onLeave;

    return { total: totalMembers, onLeave, available, leaves: dateLeaves };
  };

  const selectedDateAvailability = getDateAvailability(selectedDate);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    const leave = leaves.find(l => event.id.startsWith(l.id));
    if (leave) {
      onLeaveClick?.(leave);
    }
  };

  const eventTypes = {
    leave: { 
      label: "Leave", 
      color: "text-green-600", 
      bgColor: "bg-green-100" 
    },
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header Controls */}
        {showTeamView && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Leave Calendar</span>
                </CardTitle>
                <Select value={viewMode} onValueChange={(value: 'my' | 'team') => setViewMode(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="my">My Leaves</SelectItem>
                    <SelectItem value="team">Team Leaves</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Calendar */}
        <EventCalendar
          events={calendarEvents}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          eventTypes={eventTypes}
          loading={loading}
          showAddButton={false}
        />

        {/* Availability Summary */}
        {showTeamView && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Team Availability - {format(selectedDate, "MMMM d, yyyy")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">
                      {selectedDateAvailability.available}
                    </p>
                    <p className="text-sm text-green-700">Available</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <UserX className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">
                      {selectedDateAvailability.onLeave}
                    </p>
                    <p className="text-sm text-red-700">On Leave</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedDateAvailability.total}
                    </p>
                    <p className="text-sm text-blue-700">Total Team</p>
                  </div>
                </div>
              </div>

              {/* Leave Details for Selected Date */}
              {selectedDateAvailability.leaves.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Team Members on Leave:</h4>
                  <div className="space-y-2">
                    {selectedDateAvailability.leaves.map((leave) => (
                      <div
                        key={leave.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                        onClick={() => onLeaveClick?.(leave)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <div>
                            <p className="font-medium text-sm">
                              {leave.leaveType.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd")}
                            </p>
                          </div>
                        </div>
                        <Badge variant={leave.status === 'APPROVED' ? 'default' : 'secondary'}>
                          {leave.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateAvailability.leaves.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All team members are available on this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};