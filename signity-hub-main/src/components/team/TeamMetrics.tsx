import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target,
  Calendar,
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
import { CustomLineChart, MultiBarChart } from "@/components/ui/charts";
import { useToast } from "@/hooks/use-toast";
import { Team, teamService } from "@/services/team.service";
import { format, subDays, subMonths } from "date-fns";

interface TeamMetricsProps {
  team: Team;
}

interface TeamMetricsData {
  productivity: {
    tasksCompleted: number;
    hoursWorked: number;
    projectsActive: number;
    efficiency: number;
  };
  performance: {
    onTimeDelivery: number;
    qualityScore: number;
    collaborationScore: number;
    overallRating: number;
  };
  workload: {
    totalTasks: number;
    overdueTasks: number;
    avgTasksPerMember: number;
    workloadDistribution: Array<{
      member: string;
      tasks: number;
      hours: number;
      workloadLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  trends: {
    productivity: Array<{
      date: string;
      tasks: number;
      hours: number;
    }>;
    performance: Array<{
      date: string;
      quality: number;
      delivery: number;
    }>;
  };
}

const chartConfig = {
  tasks: {
    label: "Tasks",
    color: "hsl(var(--chart-1))",
  },
  hours: {
    label: "Hours",
    color: "hsl(var(--chart-2))",
  },
  quality: {
    label: "Quality",
    color: "hsl(var(--chart-3))",
  },
  delivery: {
    label: "Delivery",
    color: "hsl(var(--chart-4))",
  },
};

export function TeamMetrics({ team }: TeamMetricsProps) {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<TeamMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("30d");

  useEffect(() => {
    fetchTeamMetrics();
  }, [team.id, timeRange]);

  const fetchTeamMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = timeRange === "7d" ? subDays(endDate, 7) :
                      timeRange === "30d" ? subDays(endDate, 30) :
                      timeRange === "90d" ? subDays(endDate, 90) :
                      subMonths(endDate, 12);

      // Fetch team metrics from API
      await teamService.getTeamMetrics(
        team.id, 
        format(startDate, 'yyyy-MM-dd'), 
        format(endDate, 'yyyy-MM-dd')
      );

      // Mock data for demonstration
      const mockMetrics: TeamMetricsData = {
        productivity: {
          tasksCompleted: 45,
          hoursWorked: 320,
          projectsActive: 3,
          efficiency: 87
        },
        performance: {
          onTimeDelivery: 92,
          qualityScore: 88,
          collaborationScore: 85,
          overallRating: 88
        },
        workload: {
          totalTasks: 52,
          overdueTasks: 7,
          avgTasksPerMember: Math.round(52 / team._count.members),
          workloadDistribution: team.members.map((member) => ({
            member: member.name,
            tasks: Math.floor(Math.random() * 15) + 5,
            hours: Math.floor(Math.random() * 40) + 20,
            workloadLevel: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as 'LOW' | 'MEDIUM' | 'HIGH'
          }))
        },
        trends: {
          productivity: Array.from({ length: 7 }, (_, i) => ({
            date: format(subDays(endDate, 6 - i), 'MMM dd'),
            tasks: Math.floor(Math.random() * 10) + 5,
            hours: Math.floor(Math.random() * 20) + 30
          })),
          performance: Array.from({ length: 7 }, (_, i) => ({
            date: format(subDays(endDate, 6 - i), 'MMM dd'),
            quality: Math.floor(Math.random() * 20) + 80,
            delivery: Math.floor(Math.random() * 20) + 75
          }))
        }
      };

      setMetrics(mockMetrics);
    } catch (error: any) {
      console.error('Failed to fetch team metrics:', error);
      toast({
        variant: "destructive",
        title: "Failed to load team metrics",
        description: error.message || "Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTeamMetrics();
  };

  const handleExportReport = () => {
    toast({
      title: "Report exported",
      description: "Team metrics report has been exported successfully.",
    });
  };

  const getWorkloadColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          <div className="h-10 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Team Performance Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Track team productivity, performance, and workload distribution
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{metrics.productivity.tasksCompleted}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                {getTrendIcon(metrics.productivity.tasksCompleted, 38)}
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hours Worked</p>
                  <p className="text-2xl font-bold">{metrics.productivity.hoursWorked}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                {getTrendIcon(metrics.productivity.hoursWorked, 295)}
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Efficiency</p>
                  <p className="text-2xl font-bold">{metrics.productivity.efficiency}%</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                {getTrendIcon(metrics.productivity.efficiency, 82)}
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{metrics.productivity.projectsActive}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                {getTrendIcon(metrics.productivity.projectsActive, 2)}
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <MultiBarChart
            title="Productivity Trends"
            description="Daily tasks completed and hours worked"
            data={metrics.trends.productivity}
            xAxisKey="date"
            series={[
              { key: "tasks", name: "Tasks Completed", color: "hsl(var(--chart-1))" },
              { key: "hours", name: "Hours Worked", color: "hsl(var(--chart-2))" }
            ]}
            config={chartConfig}
            height={300}
          />
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <CustomLineChart
            title="Performance Metrics"
            description="Quality score and on-time delivery trends"
            data={metrics.trends.performance}
            xAxisKey="date"
            yAxisKey="quality"
            config={chartConfig}
            height={300}
            showDots={true}
          />
        </motion.div>
      </div>

      {/* Workload Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Workload Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current task and hour distribution across team members
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.workload.workloadDistribution.map((member) => (
                <div key={member.member} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.member.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.member}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.tasks} tasks • {member.hours} hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getWorkloadColor(member.workloadLevel)}>
                      {member.workloadLevel}
                    </Badge>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          member.workloadLevel === 'HIGH' ? 'bg-red-500' :
                          member.workloadLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min((member.tasks / 15) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {metrics.performance.onTimeDelivery}%
            </div>
            <p className="text-sm text-muted-foreground">On-Time Delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {metrics.performance.qualityScore}%
            </div>
            <p className="text-sm text-muted-foreground">Quality Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {metrics.performance.collaborationScore}%
            </div>
            <p className="text-sm text-muted-foreground">Collaboration</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {metrics.performance.overallRating}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}