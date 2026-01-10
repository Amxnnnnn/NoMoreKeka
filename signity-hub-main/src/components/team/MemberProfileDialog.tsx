import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Briefcase,
  Clock,
  Target,
  Award,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Team, TeamMember } from "@/services/team.service";
import { format } from "date-fns";

interface MemberProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  team: Team;
}

interface MemberProfile {
  personalInfo: {
    phone?: string;
    location?: string;
    timezone?: string;
    startDate: string;
  };
  workInfo: {
    position: string;
    department: string;
    manager?: string;
    workHours: string;
  };
  performance: {
    tasksCompleted: number;
    hoursWorked: number;
    projectsActive: number;
    rating: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'task' | 'project' | 'leave' | 'meeting';
    title: string;
    date: Date;
    status: string;
  }>;
}

export function MemberProfileDialog({ open, onOpenChange, member, team }: MemberProfileDialogProps) {
  // Mock profile data - in real implementation, fetch from API
  const [profile] = useState<MemberProfile>({
    personalInfo: {
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      timezone: 'PST (UTC-8)',
      startDate: member.joinedAt
    },
    workInfo: {
      position: 'Senior Developer',
      department: 'Engineering',
      manager: 'John Manager',
      workHours: '9:00 AM - 5:00 PM'
    },
    performance: {
      tasksCompleted: 45,
      hoursWorked: 160,
      projectsActive: 3,
      rating: 4.5
    },
    recentActivity: [
      {
        id: '1',
        type: 'task',
        title: 'Completed API integration',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        id: '2',
        type: 'project',
        title: 'Started new feature development',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'in_progress'
      },
      {
        id: '3',
        type: 'meeting',
        title: 'Attended team standup',
        date: new Date(Date.now() - 25 * 60 * 60 * 1000),
        status: 'completed'
      }
    ]
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'HR':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'MANAGER':
        return <Target className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Target className="w-4 h-4 text-blue-500" />;
      case 'project':
        return <Briefcase className="w-4 h-4 text-green-500" />;
      case 'meeting':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'leave':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Profile</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
              <AvatarFallback className="text-lg">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <Badge variant="outline" className="gap-1">
                  {getRoleIcon(member.role)}
                  {member.role}
                </Badge>
                <Badge variant={member.isActive ? "default" : "secondary"}>
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-2">{profile.workInfo.position}</p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {format(new Date(member.joinedAt), 'MMM yyyy')}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.personalInfo.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.personalInfo.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.personalInfo.timezone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Started {format(new Date(profile.personalInfo.startDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Work Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Work Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.workInfo.position}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.workInfo.department}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Reports to {profile.workInfo.manager}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.workInfo.workHours}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Team Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Team Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">{team.description}</p>
                    </div>
                    <Badge variant="outline">
                      {team._count.members} members
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {profile.performance.tasksCompleted}
                    </div>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {profile.performance.hoursWorked}
                    </div>
                    <p className="text-sm text-muted-foreground">Hours Worked</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {profile.performance.projectsActive}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {profile.performance.rating}
                    </div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className="flex items-center space-x-3 p-3 rounded-lg border"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(activity.date, 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}