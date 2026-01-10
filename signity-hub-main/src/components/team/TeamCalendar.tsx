import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventCalendar, CalendarEvent } from "@/components/ui/event-calendar";
import { useToast } from "@/hooks/use-toast";
import { Team } from "@/services/team.service";
import { leaveService } from "@/services/leave.service";
import { worklogService } from "@/services/worklog.service";
import { format, startOfMonth, endOfMonth, addDays } from "date-fns";

interface TeamCalendarProps {
  team: Team;
}

interface TeamScheduleEvent extends CalendarEvent {
  memberId?: string;
  memberName?: string;
  category: 'leave' | 'meeting' | 'deadline' | 'availability' | 'other';
}

const eventTypeConfig = {
  leave: { label: "Leave", color: "#ef4444", bgColor: "bg-red-100" },
  meeting: { label: "Meeting", color: "#10b981", bgColor: "bg-green-100" },
  deadline: { label: "Deadline", color: "#f59e0b", bgColor: "bg-yellow-100" },
  availability: { label: "Available", color: "#3b82f6", bgColor: "bg-blue-100" },
  other: { label: "Work Log", color: "#8b5cf6", bgColor: "bg-purple-100" },
};

export function TeamCalendar({ team }: TeamCalendarProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TeamScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");

  useEffect(() => {
    fetchTeamSchedule();
  }, [team.id, selectedDate]);

  const fetchTeamSchedule = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range (current month)
      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      
      // Fetch team leaves, meetings, and work logs
      const [leavesResult, worklogsResult] = await Promise.all([
        leaveService.getTeamLeaves(team.id, startDate, endDate),
        worklogService.getTeamWorklogs(team.id, startDate, endDate)
      ]);

      const scheduleEvents: TeamScheduleEvent[] = [];

      // Process leaves
      if (leavesResult.data) {
        leavesResult.data.forEach((leave: any) => {
          const startLeaveDate = new Date(leave.startDate);
          const endLeaveDate = new Date(leave.endDate);
          
          // Create events for each day of leave
          let currentDate = startLeaveDate;
          while (currentDate <= endLeaveDate) {
            scheduleEvents.push({
              id: `leave-${leave.id}-${format(currentDate, 'yyyy-MM-dd')}`,
              title: `${leave.user.name} - ${leave.leaveType.name}`,
              description: leave.reason,
              date: new Date(currentDate),
              type: 'leave',
              category: 'leave',
              status: leave.status.toLowerCase(),
              memberId: leave.user.id,
              memberName: leave.user.name,
              color: eventTypeConfig.leave.color
            });
            currentDate = addDays(currentDate, 1);
          }
        });
      }

      // Process work logs
      if (worklogsResult.data) {
        worklogsResult.data.forEach((worklog: any) => {
          scheduleEvents.push({
            id: `worklog-${worklog.id}`,
            title: `${worklog.user.name} - Work Log`,
            description: worklog.description,
            date: new Date(worklog.date),
            startTime: worklog.startTime,
            endTime: worklog.endTime,
            type: 'other',
            category: 'other',
            status: worklog.isApproved ? 'confirmed' : 'pending',
            memberId: worklog.user.id,
            memberName: worklog.user.name,
            color: eventTypeConfig.other.color
          });
        });
      }

      // Add mock meetings and deadlines for demo
      const mockEvents: TeamScheduleEvent[] = [
        {
          id: 'meeting-1',
          title: 'Team Standup',
          description: 'Daily team standup meeting',
          date: new Date(),
          startTime: '09:00',
          endTime: '09:30',
          type: 'meeting',
          category: 'meeting',
          status: 'confirmed',
          color: eventTypeConfig.meeting.color
        },
        {
          id: 'deadline-1',
          title: 'Project Milestone',
          description: 'Complete feature development',
          date: addDays(new Date(), 3),
          type: 'deadline',
          category: 'deadline',
          status: 'confirmed',
          color: eventTypeConfig.deadline.color
        }
      ];

      setEvents([...scheduleEvents, ...mockEvents]);
    } catch (error: any) {
      console.error('Failed to fetch team schedule:', error);
      toast({
        variant: "destructive",
        title: "Failed to load team schedule",
        description: error.message || "Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTeamSchedule();
  };

  const handleExportCalendar = () => {
    // Mock export functionality
    toast({
      title: "Calendar exported",
      description: "Team calendar has been exported successfully.",
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesView = viewFilter === "all" || event.category === viewFilter;
    const matchesMember = memberFilter === "all" || event.memberId === memberFilter;
    return matchesView && matchesMember;
  });

  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return filteredEvents
      .filter(event => event.date >= today && event.date <= nextWeek)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };

  const getTeamAvailability = () => {
    const today = new Date();
    const totalMembers = team._count.members;
    const onLeaveToday = events.filter(event => 
      event.category === 'leave' && 
      format(event.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    ).length;
    
    return {
      available: totalMembers - onLeaveToday,
      onLeave: onLeaveToday,
      total: totalMembers
    };
  };

  const availability = getTeamAvailability();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Team Calendar</h3>
          <p className="text-sm text-muted-foreground">
            View team schedules, availability, and upcoming events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCalendar} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={viewFilter} onValueChange={setViewFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="leave">Leave</SelectItem>
            <SelectItem value="meeting">Meetings</SelectItem>
            <SelectItem value="deadline">Deadlines</SelectItem>
            <SelectItem value="other">Work Logs</SelectItem>
          </SelectContent>
        </Select>

        <Select value={memberFilter} onValueChange={setMemberFilter}>
          <SelectTrigger className="w-[180px]">
            <Users className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Team Member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {team.members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <EventCalendar
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            eventTypes={eventTypeConfig}
            loading={isLoading}
            showAddButton={true}
            onAddEvent={(date) => {
              toast({
                title: "Add Event",
                description: `Add event for ${format(date, 'MMM d, yyyy')}`,
              });
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Team Availability */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {availability.available}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">On Leave</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {availability.onLeave}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Members</span>
                  <Badge variant="outline">
                    {availability.total}
                  </Badge>
                </div>
                
                {/* Availability Bar */}
                <div className="mt-4">
                  <div className="flex text-xs text-muted-foreground mb-1">
                    <span>Availability Rate</span>
                    <span className="ml-auto">
                      {Math.round((availability.available / availability.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(availability.available / availability.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div 
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(event.date, 'MMM d')}
                          {event.startTime && ` at ${event.startTime}`}
                        </p>
                        {event.memberName && (
                          <p className="text-xs text-muted-foreground">
                            {event.memberName}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming events
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Meetings</span>
                  <Badge variant="outline">
                    {filteredEvents.filter(e => e.category === 'meeting').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Leave Days</span>
                  <Badge variant="outline">
                    {filteredEvents.filter(e => e.category === 'leave').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deadlines</span>
                  <Badge variant="outline">
                    {filteredEvents.filter(e => e.category === 'deadline').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}