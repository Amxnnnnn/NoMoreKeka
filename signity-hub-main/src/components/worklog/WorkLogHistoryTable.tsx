import * as React from "react";
import { format, parseISO } from "date-fns";
import { 
  Clock, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Download,
  Calendar,
  MoreHorizontal,
  Eye,
  Copy,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/components/ui/use-toast";

import { worklogService, WorkLog, WorkLogQueryParams } from "@/services/worklog.service";
import { useAuthStore } from "@/stores/authStore";
import { WorkLogExport } from "./WorkLogExport";

interface WorkLogHistoryTableProps {
  onEdit?: (workLog: WorkLog) => void;
  onView?: (workLog: WorkLog) => void;
  className?: string;
  showFilters?: boolean;
  userId?: string; // For manager/admin view
  enableBulkActions?: boolean;
  enableExport?: boolean;
}

interface WorkLogDetailsDialogProps {
  workLog: WorkLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WorkLogDetailsDialog: React.FC<WorkLogDetailsDialogProps> = ({
  workLog,
  open,
  onOpenChange,
}) => {
  if (!workLog) return null;

  const formatHours = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const getStatusBadge = (workLog: WorkLog) => {
    if (workLog.isApproved) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getLogTypeBadge = (logType: string) => {
    const variants = {
      DAILY: 'default',
      PROJECT: 'secondary',
      TASK: 'outline',
      WEEKLY: 'destructive',
    } as const;

    return (
      <Badge variant={variants[logType as keyof typeof variants] || 'default'}>
        {logType}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Work Log Details</DialogTitle>
          <DialogDescription>
            View detailed information about this work log entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(parseISO(workLog.date), "MMM dd, yyyy")}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Hours Worked</label>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatHours(workLog.hoursWorked)}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Log Type</label>
              <div className="mt-1">{getLogTypeBadge(workLog.logType)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">{getStatusBadge(workLog)}</div>
            </div>
          </div>

          {/* Project/Task Information */}
          {(workLog.project || workLog.task) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Project/Task</label>
              <div className="mt-1 space-y-1">
                {workLog.project && (
                  <div className="font-medium">{workLog.project.name}</div>
                )}
                {workLog.task && (
                  <div className="text-sm text-muted-foreground">{workLog.task.title}</div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <div className="mt-1 p-3 bg-muted rounded-md">
              {workLog.description}
            </div>
          </div>

          {/* Approval Information */}
          {workLog.isApproved && workLog.approver && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Approval Details</label>
              <div className="mt-1 p-3 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Approved by <span className="font-medium">{workLog.approver.name}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span>Created: {format(parseISO(workLog.createdAt), "MMM dd, yyyy 'at' h:mm a")}</span>
            </div>
            <div>
              <span>Updated: {format(parseISO(workLog.updatedAt), "MMM dd, yyyy 'at' h:mm a")}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const WorkLogHistoryTable: React.FC<WorkLogHistoryTableProps> = ({
  onEdit,
  onView,
  className,
  showFilters = true,
  userId,
  enableBulkActions = false,
  enableExport = true,
}) => {
  const [workLogs, setWorkLogs] = React.useState<WorkLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = React.useState<WorkLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [selectedWorkLogs, setSelectedWorkLogs] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState<WorkLogQueryParams>({
    page: 1,
    limit: 10,
  });

  // Load work logs
  const loadWorkLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (userId) {
        params.userId = userId;
      }

      const result = userId 
        ? await worklogService.getTeamWorkLogs(params)
        : await worklogService.getWorkLogs(params);
      
      if (result.success) {
        setWorkLogs(result.data);
      }
    } catch (error) {
      console.error("Failed to load work logs:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, userId]);

  React.useEffect(() => {
    loadWorkLogs();
  }, [loadWorkLogs]);

  const handleDelete = async (workLog: WorkLog) => {
    try {
      const result = await worklogService.deleteWorkLog(workLog.id);
      if (result.success) {
        setWorkLogs(prev => prev.filter(w => w.id !== workLog.id));
        setDeleteDialogOpen(false);
        setSelectedWorkLog(null);
        toast({
          title: "Success",
          description: "Work log deleted successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to delete work log:", error);
      toast({
        title: "Error",
        description: "Failed to delete work log. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedWorkLogs.map(id => worklogService.deleteWorkLog(id));
      await Promise.all(promises);
      
      setWorkLogs(prev => prev.filter(w => !selectedWorkLogs.includes(w.id)));
      setSelectedWorkLogs([]);
      toast({
        title: "Success",
        description: `${selectedWorkLogs.length} work logs deleted successfully.`,
      });
    } catch (error) {
      console.error("Failed to delete work logs:", error);
      toast({
        title: "Error",
        description: "Failed to delete some work logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (workLog: WorkLog) => {
    try {
      const duplicateData = {
        projectId: workLog.project?.id,
        taskId: workLog.task?.id,
        date: format(new Date(), 'yyyy-MM-dd'), // Use today's date
        hoursWorked: workLog.hoursWorked,
        description: `Copy of: ${workLog.description}`,
        logType: workLog.logType,
      };

      const result = await worklogService.logWork(duplicateData);
      if (result.success) {
        loadWorkLogs(); // Refresh the list
        toast({
          title: "Success",
          description: "Work log duplicated successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to duplicate work log:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate work log. Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleExport = async () => {
    setExportDialogOpen(true);
  };

  const getStatusBadge = (workLog: WorkLog) => {
    if (workLog.isApproved) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getLogTypeBadge = (logType: string) => {
    const variants = {
      DAILY: 'default',
      PROJECT: 'secondary',
      TASK: 'outline',
      WEEKLY: 'destructive',
    } as const;

    return (
      <Badge variant={variants[logType as keyof typeof variants] || 'default'}>
        {logType}
      </Badge>
    );
  };

  const formatHours = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const columns: ColumnDef<WorkLog>[] = [
    ...(enableBulkActions ? [{
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          disabled={row.original.isApproved}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }] : []),
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(parseISO(getValue() as string), "MMM dd, yyyy")}</span>
        </div>
      ),
    },
    {
      accessorKey: 'logType',
      header: 'Type',
      cell: ({ getValue }) => getLogTypeBadge(getValue() as string),
    },
    {
      id: 'project',
      header: 'Project/Task',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.project && (
            <div className="text-sm font-medium">{row.original.project.name}</div>
          )}
          {row.original.task && (
            <div className="text-xs text-muted-foreground">{row.original.task.title}</div>
          )}
          {!row.original.project && !row.original.task && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Hours',
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatHours(getValue() as number)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => (
        <div className="max-w-xs truncate" title={getValue() as string}>
          {getValue() as string}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setSelectedWorkLog(row.original);
              setDetailsDialogOpen(true);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {onView && (
              <DropdownMenuItem onClick={() => onView(row.original)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
            )}
            {onEdit && !row.original.isApproved && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleDuplicate(row.original)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!row.original.isApproved && (
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedWorkLog(row.original);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
  ];

  const totalHours = workLogs.reduce((sum, log) => sum + log.hoursWorked, 0);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Work Log History</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-medium">{formatHours(totalHours)}</span>
              </div>
              {enableBulkActions && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Bulk Actions
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={loadWorkLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {enableExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Log Type</label>
                  <Select
                    value={filters.logType || ""}
                    onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, logType: value as any || undefined }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="PROJECT">Project</SelectItem>
                      <SelectItem value="TASK">Task</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={filters.isApproved?.toString() || ""}
                    onValueChange={(value) => 
                      setFilters(prev => ({ 
                        ...prev, 
                        isApproved: value === "" ? undefined : value === "true" 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="true">Approved</SelectItem>
                      <SelectItem value="false">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <DatePicker
                    date={filters.startDate ? new Date(filters.startDate) : undefined}
                    onDateChange={(date) => 
                      setFilters(prev => ({ 
                        ...prev, 
                        startDate: date ? format(date, "yyyy-MM-dd") : undefined 
                      }))
                    }
                    placeholder="Select start date"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <DatePicker
                    date={filters.endDate ? new Date(filters.endDate) : undefined}
                    onDateChange={(date) => 
                      setFilters(prev => ({ 
                        ...prev, 
                        endDate: date ? format(date, "yyyy-MM-dd") : undefined 
                      }))
                    }
                    placeholder="Select end date"
                  />
                </div>
              </div>
              <Separator className="mb-6" />
            </>
          )}

          {workLogs.length === 0 && !loading ? (
            <EmptyState
              icon={Clock}
              title="No work logs found"
              description="Start logging your work time to see entries here."
            />
          ) : (
            <DataTable
              data={workLogs}
              columns={columns}
              searchKey="description"
              searchPlaceholder="Search work logs..."
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this work log entry? This action cannot be undone.
              {selectedWorkLog && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <div><strong>Date:</strong> {format(parseISO(selectedWorkLog.date), "MMM dd, yyyy")}</div>
                  <div><strong>Hours:</strong> {formatHours(selectedWorkLog.hoursWorked)}</div>
                  <div><strong>Description:</strong> {selectedWorkLog.description}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedWorkLog && handleDelete(selectedWorkLog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Work Log Details Dialog */}
      <WorkLogDetailsDialog
        workLog={selectedWorkLog}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      {/* Export Dialog */}
      {enableExport && (
        <WorkLogExport
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          userId={userId}
        />
      )}
    </div>
  );
};