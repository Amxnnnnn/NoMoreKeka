import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { Project, projectService } from '@/services/project.service';
import { useToast } from '@/hooks/use-toast';

interface ProjectTimelineProps {
  projects: Project[];
  loading: boolean;
  onProjectClick: (project: Project) => void;
}

interface ProjectPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  tasks: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    progress: number;
    dependencies: string[];
  }>;
}

interface TimelineData {
  phases: ProjectPhase[];
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  projects,
  loading,
  onProjectClick
}) => {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'gantt' | 'timeline'>('timeline');

  // Load timeline data for selected project
  useEffect(() => {
    if (selectedProject) {
      loadTimelineData(selectedProject);
    }
  }, [selectedProject]);

  const loadTimelineData = async (projectId: string) => {
    try {
      setTimelineLoading(true);
      const result = await projectService.getProjectTimeline(projectId);
      
      if (result.success) {
        setTimelineData(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load project timeline",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to load timeline data:', error);
      toast({
        title: "Error",
        description: "Failed to load project timeline",
        variant: "destructive",
      });
    } finally {
      setTimelineLoading(false);
    }
  };

  // Convert projects to timeline items for overview
  const projectTimelineItems: TimelineItem[] = projects
    ?.filter(project => project && project.startDate)
    ?.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    ?.map((project) => {
      const progress = project._count?.tasks 
        ? Math.round(((project._count.completedTasks || 0) / project._count.tasks) * 100)
        : 0;
      
      const isOverdue = project.endDate && 
        new Date(project.endDate) < new Date() && 
        project.status !== 'COMPLETED';

      const getStatusIcon = () => {
        switch (project.status) {
          case 'COMPLETED':
            return <Target className="h-4 w-4" />;
          case 'IN_PROGRESS':
            return <Clock className="h-4 w-4" />;
          case 'ON_HOLD':
            return <AlertTriangle className="h-4 w-4" />;
          default:
            return <Calendar className="h-4 w-4" />;
        }
      };

      return {
        id: project.id,
        title: project.name || 'Untitled Project',
        description: project.description,
        timestamp: project.startDate,
        status: project.status === 'COMPLETED' ? 'completed' : 
                project.status === 'IN_PROGRESS' ? 'current' : 
                project.status === 'CANCELLED' ? 'cancelled' : 'upcoming',
        icon: getStatusIcon(),
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={
                project.status === 'IN_PROGRESS' ? 'default' :
                project.status === 'COMPLETED' ? 'secondary' :
                project.status === 'ON_HOLD' ? 'outline' : 'destructive'
              }>
                {project.status}
              </Badge>
              <Badge variant={
                project.priority === 'URGENT' ? 'destructive' :
                project.priority === 'HIGH' ? 'default' : 'outline'
              }>
                {project.priority}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">
                  Overdue
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Team:</span>
                <div className="font-medium">{project.team?.name || 'No team'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Manager:</span>
                <div className="font-medium">{project.manager?.name || 'No manager'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <div className="font-medium">{progress}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Tasks:</span>
                <div className="font-medium">
                  {project._count?.completedTasks || 0}/{project._count?.tasks || 0}
                </div>
              </div>
            </div>
            
            {project.endDate && (
              <div className="text-sm">
                <span className="text-muted-foreground">Due:</span>
                <span className={`ml-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                  {new Date(project.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ),
        actions: [
          {
            label: 'View Details',
            onClick: () => onProjectClick(project),
          },
        ],
      };
    }) || [];

  // Convert timeline data to timeline items for detailed view
  const phaseTimelineItems: TimelineItem[] = timelineData?.phases.map((phase) => ({
    id: phase.id,
    title: phase.name,
    timestamp: phase.startDate,
    status: phase.progress === 100 ? 'completed' : 
            phase.progress > 0 ? 'current' : 'upcoming',
    icon: <Target className="h-4 w-4" />,
    content: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="font-medium">{phase.progress}%</span>
        </div>
        
        <div className="text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start:</span>
            <span>{new Date(phase.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End:</span>
            <span>{new Date(phase.endDate).toLocaleDateString()}</span>
          </div>
        </div>
        
        {phase.tasks.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Tasks ({phase.tasks.length})</span>
            <div className="space-y-1">
              {phase.tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-sm text-muted-foreground">
                  • {task.title} ({task.progress}%)
                </div>
              ))}
              {phase.tasks.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  ... and {phase.tasks.length - 3} more tasks
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    ),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={(value: 'gantt' | 'timeline') => setViewMode(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timeline">Timeline View</SelectItem>
              <SelectItem value="gantt">Gantt Chart</SelectItem>
            </SelectContent>
          </Select>
          
          {viewMode === 'gantt' && (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Timeline Content */}
      {viewMode === 'timeline' ? (
        <Timeline
          items={projectTimelineItems}
          title="Project Timeline Overview"
          loading={loading}
          emptyMessage="No projects to display"
          maxHeight={600}
        />
      ) : (
        <div className="space-y-6">
          {selectedProject ? (
            timelineData ? (
              <Timeline
                items={phaseTimelineItems}
                title={`Project Phases - ${projects.find(p => p.id === selectedProject)?.name}`}
                loading={timelineLoading}
                emptyMessage="No phases defined for this project"
                maxHeight={600}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-32">
                    {timelineLoading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    ) : (
                      <p className="text-muted-foreground">No timeline data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                  <p className="text-muted-foreground">
                    Choose a project from the dropdown above to view its detailed timeline and phases.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Project Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Projects</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {projects.filter(p => 
                p.endDate && 
                new Date(p.endDate) < new Date() && 
                p.status !== 'COMPLETED'
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {projects.filter(p => p.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};