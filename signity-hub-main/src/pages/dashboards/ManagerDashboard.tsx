import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FolderOpen, Target, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ManagerStats {
  teamMembers: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Mock data for now - will be replaced with real API calls
        setStats({
          teamMembers: 8,
          activeProjects: 3,
          completedTasks: 24,
          pendingTasks: 12,
        });
      } catch (error: any) {
        console.error('Failed to fetch manager stats:', error);
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
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground">
            Team management, project oversight, and performance tracking
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Team Members"
            value={stats?.teamMembers || 0}
            change={0}
            icon={Users}
            delay={0}
          />
          <StatCard
            title="Active Projects"
            value={stats?.activeProjects || 0}
            change={15.3}
            icon={FolderOpen}
            delay={0.1}
          />
          <StatCard
            title="Completed Tasks"
            value={stats?.completedTasks || 0}
            change={8.2}
            icon={CheckCircle}
            delay={0.2}
          />
          <StatCard
            title="Pending Tasks"
            value={stats?.pendingTasks || 0}
            change={-5.1}
            icon={Clock}
            delay={0.3}
          />
        </div>

        {/* Manager Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Project Management
                </CardTitle>
                <CardDescription>
                  Create and manage projects, assign tasks, and track progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  View All Projects
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Target className="w-4 h-4 mr-2" />
                  Create New Project
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
                  <Users className="w-5 h-5" />
                  Team Management
                </CardTitle>
                <CardDescription>
                  Manage team members and track performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => navigate("/members")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Team Members
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Performance Reports
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Overview of your current project portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock project data */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Website Redesign</h4>
                    <p className="text-sm text-muted-foreground">UI/UX improvements and modernization</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="default">In Progress</Badge>
                    <span className="text-sm text-muted-foreground">75% complete</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Mobile App Development</h4>
                    <p className="text-sm text-muted-foreground">Cross-platform mobile application</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">Planning</Badge>
                    <span className="text-sm text-muted-foreground">15% complete</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">API Integration</h4>
                    <p className="text-sm text-muted-foreground">Third-party service integrations</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">Completed</Badge>
                    <span className="text-sm text-muted-foreground">100% complete</span>
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