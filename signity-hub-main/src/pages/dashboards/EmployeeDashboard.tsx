import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Calendar, User, Target, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";

interface EmployeeStats {
  assignedTasks: number;
  completedTasks: number;
  hoursWorked: number;
  projectsInvolved: number;
}

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Mock data for now - will be replaced with real API calls
        setStats({
          assignedTasks: 15,
          completedTasks: 12,
          hoursWorked: 160,
          projectsInvolved: 2,
        });
      } catch (error: any) {
        console.error('Failed to fetch employee stats:', error);
        toast({
          variant: "destructive",
          title: "Failed to load dashboard",
          description: "Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Your personal workspace and task management center
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Assigned Tasks"
            value={stats?.assignedTasks || 0}
            icon={Target}
            delay={0}
          />
          <StatCard
            title="Completed Tasks"
            value={stats?.completedTasks || 0}
            trend={{
              value: 12.5,
              isPositive: true
            }}
            icon={CheckCircle}
            delay={0.1}
          />
          <StatCard
            title="Hours This Month"
            value={stats?.hoursWorked || 0}
            trend={{
              value: 5.2,
              isPositive: true
            }}
            icon={Clock}
            delay={0.2}
          />
          <StatCard
            title="Active Projects"
            value={stats?.projectsInvolved || 0}
            icon={TrendingUp}
            delay={0.3}
          />
        </div>

        {/* Employee Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  My Tasks
                </CardTitle>
                <CardDescription>
                  View and manage your assigned tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Target className="w-4 h-4 mr-2" />
                  View All Tasks
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Time Tracking
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal
                </CardTitle>
                <CardDescription>
                  Manage your profile and personal settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <User className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Leave
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                Your latest task assignments and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock task data */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Implement user authentication</h4>
                    <p className="text-sm text-muted-foreground">Website Redesign Project</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="default">In Progress</Badge>
                    <span className="text-sm text-muted-foreground">Due: Dec 25</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Code review for API endpoints</h4>
                    <p className="text-sm text-muted-foreground">API Integration Project</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">Completed</Badge>
                    <span className="text-sm text-muted-foreground">Completed: Dec 22</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Database optimization</h4>
                    <p className="text-sm text-muted-foreground">Performance Improvement</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">Todo</Badge>
                    <span className="text-sm text-muted-foreground">Due: Dec 28</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}