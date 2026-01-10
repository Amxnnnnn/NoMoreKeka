import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Clock, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { projectService } from '@/services/project.service';
import { format } from 'date-fns';

interface ProjectPerformanceAnalysisProps {
  projectId: string;
}

interface PerformanceData {
  projectId: string;
  projectName: string;
  status: string;
  priority: string;
  progress: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  performance: {
    projectPerformance: number;
    taskCompletionRate: number;
    deadlineAdherence: number;
    timeAccuracyScore: number;
    activeTaskRatio: number;
  };
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  };
  deadlineMetrics: {
    hasDeadline: boolean;
    deadline?: string;
    daysToDeadline?: number;
    isOverdue: boolean;
  };
}

export const ProjectPerformanceAnalysis: React.FC<ProjectPerformanceAnalysisProps> = ({
  projectId
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, [projectId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await projectService.getProjectPerformance(projectId);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to load performance data');
      }
    } catch (error: any) {
      console.error('Failed to load performance data:', error);
      setError('Failed to load performance data');
      toast({
        title: "Error",
        description: "Failed to load performance analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBadgeVariant = (risk: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (risk) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HIGH': return 'destructive';
      case 'CRITICAL': return 'destructive';
      default: return 'outline';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'No performance data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Scorecard - Hero Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Performance Scorecard
            </span>
            <Badge variant={getRiskBadgeVariant(data.riskLevel)} className="text-sm">
              {data.riskLevel} RISK
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Overall Performance Score</div>
              <div className={`text-5xl font-bold ${getPerformanceColor(data.performance.projectPerformance)}`}>
                {data.performance.projectPerformance.toFixed(1)}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="text-sm font-medium mt-2">
                {getPerformanceLabel(data.performance.projectPerformance)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center ${getRiskColor(data.riskLevel)} bg-opacity-10`}>
                <div className={`h-20 w-20 rounded-full flex items-center justify-center ${getRiskColor(data.riskLevel)} bg-opacity-20`}>
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center ${getRiskColor(data.riskLevel)}`}>
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Progress value={data.performance.projectPerformance} className="h-3" />
        </CardContent>
      </Card>

      {/* KPI Grid - 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Task Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{data.performance.taskCompletionRate.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground">
                  {data.taskMetrics.completedTasks}/{data.taskMetrics.totalTasks} tasks
                </span>
              </div>
              <Progress value={data.performance.taskCompletionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Percentage of completed tasks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{data.performance.deadlineAdherence.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground">on-time delivery</span>
              </div>
              <Progress value={data.performance.deadlineAdherence} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Tasks completed before deadline
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Accuracy Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{data.performance.timeAccuracyScore.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground">accuracy</span>
              </div>
              <Progress value={data.performance.timeAccuracyScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Estimated vs actual time accuracy
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Task Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{data.performance.activeTaskRatio.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground">active</span>
              </div>
              <Progress value={data.performance.activeTaskRatio} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Tasks currently in progress
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deadline Intelligence */}
      {data.deadlineMetrics.hasDeadline && (
        <Card className={data.deadlineMetrics.isOverdue ? 'border-red-500 border-2' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deadline Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Project Deadline</div>
                <div className="text-lg font-semibold">
                  {data.deadlineMetrics.deadline 
                    ? format(new Date(data.deadlineMetrics.deadline), 'MMM dd, yyyy')
                    : 'Not set'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Days Remaining</div>
                <div className={`text-lg font-semibold ${
                  data.deadlineMetrics.isOverdue 
                    ? 'text-red-600' 
                    : data.deadlineMetrics.daysToDeadline && data.deadlineMetrics.daysToDeadline <= 7
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}>
                  {data.deadlineMetrics.isOverdue 
                    ? 'OVERDUE' 
                    : data.deadlineMetrics.daysToDeadline !== undefined && data.deadlineMetrics.daysToDeadline !== null
                    ? `${data.deadlineMetrics.daysToDeadline} days`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge 
                  variant={data.deadlineMetrics.isOverdue ? 'destructive' : 'default'}
                  className="text-sm"
                >
                  {data.deadlineMetrics.isOverdue ? 'Overdue' : 'On Track'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};