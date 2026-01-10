import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Clock, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { teamService } from '@/services/team.service';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TeamWorkloadAnalysisProps {
  teamId: string;
}

interface WorkloadData {
  summary: {
    totalTasks: number;
    totalUrgentTasks: number;
    totalOverdueTasks: number;
    totalEstimatedHours: number;
  };
  memberWorkloads: Array<{
    member: {
      id: string;
      name: string;
      email: string;
    };
    workload: {
      totalTasks: number;
      urgentTasks: number;
      overdueTasks: number;
      estimatedHours: number;
      workloadLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate: string | null;
      estimatedHours: number | null;
    }>;
  }>;
}

export const TeamWorkloadAnalysis: React.FC<TeamWorkloadAnalysisProps> = ({
  teamId
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWorkloadData();
  }, [teamId]);

  const loadWorkloadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await teamService.getTeamWorkload(teamId);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to load workload data');
      }
    } catch (error: any) {
      console.error('Failed to load workload data:', error);
      setError('Failed to load workload data');
      toast({
        title: "Error",
        description: "Failed to load team workload analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getWorkloadBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HIGH': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'in_review': return 'text-purple-600';
      case 'todo': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const toggleMemberExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
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
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'No workload data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Across all team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.summary.totalUrgentTasks}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.summary.totalOverdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Past their due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalEstimatedHours}</div>
            <p className="text-xs text-muted-foreground">
              Total estimated work
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Member Workload Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Workload Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.memberWorkloads.length > 0 ? (
              data.memberWorkloads.map((memberData) => (
                <Collapsible key={memberData.member.id}>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full p-4 h-auto justify-between hover:bg-muted/50"
                        onClick={() => toggleMemberExpansion(memberData.member.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {expandedMembers.has(memberData.member.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div className="text-left">
                                <div className="font-medium">{memberData.member.name}</div>
                                <div className="text-sm text-muted-foreground">{memberData.member.email}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-sm font-medium">{memberData.workload.totalTasks}</div>
                              <div className="text-xs text-muted-foreground">Total Tasks</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm font-medium text-red-600">{memberData.workload.urgentTasks}</div>
                              <div className="text-xs text-muted-foreground">Urgent</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm font-medium text-orange-600">{memberData.workload.overdueTasks}</div>
                              <div className="text-xs text-muted-foreground">Overdue</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm font-medium">{memberData.workload.estimatedHours}h</div>
                              <div className="text-xs text-muted-foreground">Est. Hours</div>
                            </div>
                            
                            <Badge variant={getWorkloadBadgeVariant(memberData.workload.workloadLevel)}>
                              {memberData.workload.workloadLevel}
                            </Badge>
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t bg-muted/20">
                        <div className="pt-4">
                          <h4 className="font-medium mb-3">Assigned Tasks ({memberData.tasks.length})</h4>
                          {memberData.tasks.length > 0 ? (
                            <div className="space-y-2">
                              {memberData.tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{task.title}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        <span className={getStatusColor(task.status)}>
                                          {task.status.replace('_', ' ')}
                                        </span>
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        <span className={getPriorityColor(task.priority)}>
                                          {task.priority}
                                        </span>
                                      </Badge>
                                      {task.estimatedHours && (
                                        <span className="text-xs text-muted-foreground">
                                          {task.estimatedHours}h
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {task.dueDate && (
                                    <div className="text-xs text-muted-foreground">
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No tasks assigned</p>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
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