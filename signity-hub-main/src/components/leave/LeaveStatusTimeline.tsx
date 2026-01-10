import * as React from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, AlertCircle, User, Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Leave } from "@/services/leave.service";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
  icon: React.ReactNode;
  user?: {
    name: string;
    avatar?: string;
  };
  details?: string;
}

interface LeaveStatusTimelineProps {
  leave: Leave;
  className?: string;
}

export const LeaveStatusTimeline: React.FC<LeaveStatusTimelineProps> = ({
  leave,
  className,
}) => {
  const generateTimelineEvents = (leave: Leave): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Application submitted
    events.push({
      id: 'submitted',
      title: 'Application Submitted',
      description: 'Leave application was submitted for review',
      timestamp: new Date(leave.appliedAt),
      status: 'completed',
      icon: <Calendar className="h-4 w-4" />,
      details: `Applied for ${leave.days} days of ${leave.leaveType.name}`,
    });

    // Under review (if pending)
    if (leave.status === 'PENDING') {
      events.push({
        id: 'review',
        title: 'Under Review',
        description: 'Application is being reviewed by your manager',
        timestamp: new Date(leave.appliedAt),
        status: 'current',
        icon: <Clock className="h-4 w-4" />,
        details: 'Waiting for manager approval',
      });
    }

    // Approved/Rejected/Cancelled
    if (leave.respondedAt) {
      const statusConfig = {
        APPROVED: {
          title: 'Application Approved',
          description: 'Your leave application has been approved',
          icon: <CheckCircle className="h-4 w-4" />,
          status: 'completed' as const,
        },
        REJECTED: {
          title: 'Application Rejected',
          description: 'Your leave application has been rejected',
          icon: <XCircle className="h-4 w-4" />,
          status: 'cancelled' as const,
        },
        CANCELLED: {
          title: 'Application Cancelled',
          description: 'Leave application was cancelled',
          icon: <AlertCircle className="h-4 w-4" />,
          status: 'cancelled' as const,
        },
      };

      const config = statusConfig[leave.status as keyof typeof statusConfig];
      if (config) {
        events.push({
          id: 'decision',
          title: config.title,
          description: config.description,
          timestamp: new Date(leave.respondedAt),
          status: config.status,
          icon: config.icon,
          user: leave.approver ? {
            name: leave.approver.name,
          } : undefined,
          details: leave.comments || undefined,
        });
      }
    }

    // Leave period (if approved and not started yet)
    if (leave.status === 'APPROVED') {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const now = new Date();

      if (startDate > now) {
        events.push({
          id: 'upcoming',
          title: 'Leave Period Starts',
          description: 'Your approved leave period will begin',
          timestamp: startDate,
          status: 'pending',
          icon: <Calendar className="h-4 w-4" />,
          details: `Leave period: ${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`,
        });
      } else if (startDate <= now && endDate >= now) {
        events.push({
          id: 'active',
          title: 'Leave Period Active',
          description: 'You are currently on leave',
          timestamp: startDate,
          status: 'current',
          icon: <Calendar className="h-4 w-4" />,
          details: `Leave ends on ${format(endDate, 'MMM dd, yyyy')}`,
        });
      } else {
        events.push({
          id: 'completed',
          title: 'Leave Period Completed',
          description: 'Your leave period has ended',
          timestamp: endDate,
          status: 'completed',
          icon: <CheckCircle className="h-4 w-4" />,
          details: `Leave period: ${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`,
        });
      }
    }

    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const events = generateTimelineEvents(leave);

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'current':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'pending':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'cancelled':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getConnectorColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-200';
      case 'current':
        return 'bg-blue-200';
      case 'pending':
        return 'bg-gray-200';
      case 'cancelled':
        return 'bg-red-200';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Leave Status Timeline</span>
          <Badge variant={leave.status === 'APPROVED' ? 'default' : 
                         leave.status === 'PENDING' ? 'secondary' : 
                         'destructive'}>
            {leave.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex items-start space-x-4 pb-8 last:pb-0">
              {/* Connector Line */}
              {index < events.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-6 top-12 w-0.5 h-full -ml-px",
                    getConnectorColor(event.status)
                  )}
                />
              )}

              {/* Event Icon */}
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full border-2 relative z-10",
                getStatusColor(event.status)
              )}>
                {event.icon}
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {event.title}
                  </h4>
                  <time className="text-xs text-muted-foreground">
                    {format(event.timestamp, "MMM dd, yyyy 'at' h:mm a")}
                  </time>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>

                {event.user && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={event.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {event.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      by {event.user.name}
                    </span>
                  </div>
                )}

                {event.details && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    {event.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};