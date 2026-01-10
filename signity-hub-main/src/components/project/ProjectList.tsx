import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, Trash2, Play, Pause, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { Project, projectService } from '@/services/project.service';

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onProjectClick: (project: Project) => void;
  onProjectUpdate: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading,
  onProjectClick,
  onProjectUpdate
}) => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [updatingProjects, setUpdatingProjects] = useState<Set<string>>(new Set());

  const handleStatusUpdate = async (project: Project, newStatus: Project['status']) => {
    try {
      setUpdatingProjects(prev => new Set(prev).add(project.id));
      
      const result = await projectService.updateProject(project.id, { status: newStatus });
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Project status updated to ${newStatus.toLowerCase()}`,
        });
        onProjectUpdate();
      } else {
        toast({
          title: "Error",
          description: "Failed to update project status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update project status:', error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    } finally {
      setUpdatingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.id);
        return newSet;
      });
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setUpdatingProjects(prev => new Set(prev).add(project.id));
      
      const result = await projectService.deleteProject(project.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
        onProjectUpdate();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setUpdatingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.id);
        return newSet;
      });
    }
  };

  const getStatusBadgeVariant = (status: Project['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'ON_HOLD':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      case 'PLANNING':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: Project['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive';
      case 'HIGH':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const calculateProgress = (project: Project) => {
    if (!project?._count) return 0;
    const totalTasks = project._count.tasks || 0;
    const completedTasks = project._count.completedTasks || 0;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const canManageProject = (project: Project) => {
    if (!user || !project) return false;
    return user.role === 'ADMIN' || 
           user.role === 'HR' || 
           (user.role === 'MANAGER' && project.manager?.id === user.id);
  };

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: 'name',
      header: 'Project Name',
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{project.name}</div>
            {project.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {project.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Project['status'];
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as Project['priority'];
        return (
          <Badge variant={getPriorityBadgeVariant(priority)}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => {
        const project = row.original;
        const progress = calculateProgress(project);
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{progress}%</span>
              <span className="text-muted-foreground">
                {project._count?.completedTasks || 0}/{project._count?.tasks || 0} tasks
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        );
      },
    },
    {
      accessorKey: 'team',
      header: 'Team',
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{project.team.name}</div>
            <div className="text-sm text-muted-foreground">
              Manager: {project.manager.name}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'dates',
      header: 'Timeline',
      cell: ({ row }) => {
        const project = row.original;
        const startDate = new Date(project.startDate).toLocaleDateString();
        const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No end date';
        
        const isOverdue = project.endDate && 
          new Date(project.endDate) < new Date() && 
          project.status !== 'COMPLETED';
        
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Start:</span> {startDate}
            </div>
            <div className={`text-sm ${isOverdue ? 'text-red-600' : ''}`}>
              <span className="text-muted-foreground">End:</span> {endDate}
              {isOverdue && <span className="ml-1 font-medium">(Overdue)</span>}
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original;
        const isUpdating = updatingProjects.has(project.id);
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0"
                disabled={isUpdating}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onProjectClick(project)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              {canManageProject(project) && (
                <>
                  <DropdownMenuSeparator />
                  
                  {project.status === 'PLANNING' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate(project, 'IN_PROGRESS')}
                      disabled={isUpdating}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Project
                    </DropdownMenuItem>
                  )}
                  
                  {project.status === 'IN_PROGRESS' && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(project, 'ON_HOLD')}
                        disabled={isUpdating}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Put on Hold
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(project, 'COMPLETED')}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Complete
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {project.status === 'ON_HOLD' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate(project, 'IN_PROGRESS')}
                      disabled={isUpdating}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Resume Project
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => handleDeleteProject(project)}
                    disabled={isUpdating}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filters = [
    {
      column: 'status',
      title: 'Status',
      options: [
        { label: 'Planning', value: 'PLANNING' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'On Hold', value: 'ON_HOLD' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
    {
      column: 'priority',
      title: 'Priority',
      options: [
        { label: 'Urgent', value: 'URGENT' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ],
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={projects}
      searchKey="name"
      searchPlaceholder="Search projects..."
      loading={loading}
      emptyMessage="No projects found"
      filters={filters}
      onRowClick={onProjectClick}
    />
  );
};