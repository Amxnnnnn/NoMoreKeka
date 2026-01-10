import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, Award, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { teamService } from '@/services/team.service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface TeamPerformanceEvaluationProps {
  teamId: string;
}

interface PerformanceData {
  team: {
    id: string;
    name: string;
  };
  performance: {
    teamPerformance: number;
    taskCompletionRate: number;
    deadlineAdherence: number;
  };
  memberPerformances: Array<{
    member: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    metrics: {
      individualPerformance: number;
      taskCompletionRate: number;
      onTimeDelivery: number;
      loadFactor: number;
    };
    taskStats: {
      totalTasks: number;
      completedTasks: number;
      overdueTasks: number;
      averageCompletionTime: number;
    };
  }>;
}

export const TeamPerformanceEvaluation: React.FC<TeamPerformanceEvaluationProps> = ({
  teamId
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    loadPerformanceData();
  }, [teamId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await teamService.getTeamPerformance(teamId);
      
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
        description: "Failed to load team performance evaluation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  const getLoadFactorColor = (factor: number) => {
    if (factor > 100) return 'text-red-600';
    if (factor > 80) return 'text-orange-600';
    if (factor > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Team Health Header Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Performance Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'No performance data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Health Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Team Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Team Performance</div>
              <div className={`text-3xl font-bold ${getPerformanceColor(data.performance.teamPerformance)}`}>
                {data.performance.teamPerformance.toFixed(1)}%
              </div>
              <Progress value={data.performance.teamPerformance} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Task Completion Rate</div>
              <div className={`text-3xl font-bold ${getPerformanceColor(data.performance.taskCompletionRate)}`}>
                {data.performance.taskCompletionRate.toFixed(1)}%
              </div>
              <Progress value={data.performance.taskCompletionRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Deadline Adherence</div>
              <div className={`text-3xl font-bold ${getPerformanceColor(data.performance.deadlineAdherence)}`}>
                {data.performance.deadlineAdherence.toFixed(1)}%
              </div>
              <Progress value={data.performance.deadlineAdherence} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.memberPerformances.length > 0 ? (
              data.memberPerformances.map((memberData) => (
                <div
                  key={memberData.member.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="font-medium">{memberData.member.name}</div>
                      <div className="text-sm text-muted-foreground">{memberData.member.email}</div>
                    </div>
                    
                    <div className="text-center min-w-[100px]">
                      <div className={`text-lg font-semibold ${getPerformanceColor(memberData.metrics.individualPerformance)}`}>
                        {memberData.metrics.individualPerformance.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Performance</div>
                    </div>
                    
                    <div className="text-center min-w-[100px]">
                      <div className={`text-lg font-semibold ${getPerformanceColor(memberData.metrics.taskCompletionRate)}`}>
                        {memberData.metrics.taskCompletionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Completion</div>
                    </div>
                    
                    <div className="text-center min-w-[100px]">
                      <div className={`text-lg font-semibold ${getPerformanceColor(memberData.metrics.onTimeDelivery)}`}>
                        {memberData.metrics.onTimeDelivery.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">On-Time</div>
                    </div>
                    
                    <div className="text-center min-w-[100px]">
                      <div className={`text-lg font-semibold ${getLoadFactorColor(memberData.metrics.loadFactor)}`}>
                        {memberData.metrics.loadFactor.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Load Factor</div>
                    </div>
                    
                    <Badge variant={getPerformanceBadgeVariant(memberData.metrics.individualPerformance)}>
                      {memberData.member.role}
                    </Badge>
                  </div>
                  
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMember(memberData)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>{memberData.member.name} - Performance Details</SheetTitle>
                        <SheetDescription>
                          Detailed performance metrics and task statistics
                        </SheetDescription>
                      </SheetHeader>
                      
                      <div className="mt-6 space-y-6">
                        {/* Performance Metrics */}
                        <div>
                          <h4 className="font-medium mb-4">Performance Metrics</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Individual Performance</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${getPerformanceColor(memberData.metrics.individualPerformance)}`}>
                                  {memberData.metrics.individualPerformance.toFixed(1)}%
                                </span>
                                <div className="w-20">
                                  <Progress value={memberData.metrics.individualPerformance} className="h-2" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Task Completion Rate</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${getPerformanceColor(memberData.metrics.taskCompletionRate)}`}>
                                  {memberData.metrics.taskCompletionRate.toFixed(1)}%
                                </span>
                                <div className="w-20">
                                  <Progress value={memberData.metrics.taskCompletionRate} className="h-2" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm">On-Time Delivery</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${getPerformanceColor(memberData.metrics.onTimeDelivery)}`}>
                                  {memberData.metrics.onTimeDelivery.toFixed(1)}%
                                </span>
                                <div className="w-20">
                                  <Progress value={memberData.metrics.onTimeDelivery} className="h-2" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Load Factor</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${getLoadFactorColor(memberData.metrics.loadFactor)}`}>
                                  {memberData.metrics.loadFactor.toFixed(1)}%
                                </span>
                                <div className="w-20">
                                  <Progress value={Math.min(memberData.metrics.loadFactor, 100)} className="h-2" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Task Statistics */}
                        <div>
                          <h4 className="font-medium mb-4">Task Statistics</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-2xl font-bold">{memberData.taskStats.totalTasks}</div>
                              <div className="text-xs text-muted-foreground">Total Tasks</div>
                            </div>
                            
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{memberData.taskStats.completedTasks}</div>
                              <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                            
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">{memberData.taskStats.overdueTasks}</div>
                              <div className="text-xs text-muted-foreground">Overdue</div>
                            </div>
                            
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-2xl font-bold">{memberData.taskStats.averageCompletionTime.toFixed(1)}h</div>
                              <div className="text-xs text-muted-foreground">Avg. Time</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Performance Insights */}
                        <div>
                          <h4 className="font-medium mb-4">Performance Insights</h4>
                          <div className="space-y-2">
                            {memberData.metrics.individualPerformance >= 80 && (
                              <div className="flex items-center gap-2 text-green-600">
                                <Award className="h-4 w-4" />
                                <span className="text-sm">Top performer - Excellent work quality</span>
                              </div>
                            )}
                            
                            {memberData.metrics.loadFactor > 100 && (
                              <div className="flex items-center gap-2 text-red-600">
                                <Target className="h-4 w-4" />
                                <span className="text-sm">High workload - Consider redistributing tasks</span>
                              </div>
                            )}
                            
                            {memberData.metrics.onTimeDelivery < 70 && (
                              <div className="flex items-center gap-2 text-orange-600">
                                <Target className="h-4 w-4" />
                                <span className="text-sm">Needs support with deadline management</span>
                              </div>
                            )}
                            
                            {memberData.taskStats.overdueTasks > 0 && (
                              <div className="flex items-center gap-2 text-red-600">
                                <Target className="h-4 w-4" />
                                <span className="text-sm">{memberData.taskStats.overdueTasks} overdue tasks need attention</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No team members found</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};