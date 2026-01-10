import * as React from "react";
import { format, parseISO } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  MessageSquare,
  Filter,
  Download,
  Calendar,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Users,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";

import { worklogService, WorkLog, WorkLogQueryParams, ApproveWorkLogData } from "@/services/worklog.service";
import { WorkLogExport } from "./WorkLogExport";
import { useAuthStore } from "@/stores/authStore";

interface WorkLogApprovalTableProps {
  className?: string;
  teamId?: string;
  enableExport?: boolean;
  showOnlyPending?: boolean;
}

interface ApprovalDialogData {
  workLog: WorkLog;
  isApproving: boolean;
  comments: string;
}

interface BulkApprovalDialogData {
  workLogs: WorkLog[];
  isApproving: boolean;
  comments: string;
}

export const WorkLogApprovalTable: React.FC<WorkLogApprovalTableProps> = ({
  className,
  teamId,
  enableExport = true,
  showOnlyPending = false,
}) => {
  const [workLogs, setWorkLogs] = React.useState<WorkLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedWorkLogs, setSelectedWorkLogs] = React.useState<string[]>([]);
  const [approvalDialog, setApprovalDialog] = React.useState<ApprovalDialogData | null>(null);
  const [bulkApprovalDialog, setBulkApprovalDialog] = React.useState<BulkApprovalDialogData | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filters, setFilters] = React.useState<WorkLogQueryParams>({
    page: 1,
    limit: 10,
    isApproved: showOnlyPending ? false : undefined, // Show only pending by default if specified
  });

  const { user } = useAuthStore();

  // Load work logs
  const loadWorkLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (teamId) {
        // Get work logs for specific team
        const result = await worklogService.getTeamWorklogs(teamId, filters.startDate, filters.endDate);
        if (result.success) {
          setWorkLogs(result.data.filter((log: WorkLog) => 
            filters.isApproved === undefined || log.isApproved === filters.isApproved
          ));
        }
      } else {
        // Get all team work logs
        const result = await worklogService.getTeamWorkLogs(params);
        if (result.success) {
          setWorkLogs(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to load work logs:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, teamId]);

  React.useEffect(() => {
    loadWorkLogs();
  }, [loadWorkLogs]);

  const handleApproval = async (workLogId: string, isApproved: boolean, comments?: string) => {
    setIsSubmitting(true);
    try {
      const data: ApproveWorkLogData = {
        isApproved,
        comments,
      };

      const result = await worklogService.approveWorkLog(workLogId, data);
      if (result.success) {
        // Update the work log in the list
        setWorkLogs(prev => prev.map(log => 
          log.id === workLogId 
            ? { ...log, isApproved, approver: user, comments }
            : log
        ));
        setApprovalDialog(null);
        toast({
          title: "Success",
          description: `Work log ${isApproved ? 'approved' : 'rejected'} successfully.`,
        });
      }
    } catch (error) {
      console.error("Failed to approve work log:", error);
      toast({
        title: "Error",
        description: "Failed to process approval. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkApproval = async (workLogIds: string[], isApproved: boolean, comments?: string) => {
    setIsSubmitting(true);
    try {
      const promises = workLogIds.map(workLogId => 
        worklogService.approveWorkLog(workLogId, { isApproved, comments })
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      // Update successful work logs
      setWorkLogs(prev => prev.map(log => 
        workLogIds.includes(log.id)
          ? { ...log, isApproved, approver: user, comments }
          : log
      ));

      setSelectedWorkLogs([]);
      setBulkApprovalDialog(null);

      if (failureCount === 0) {
        toast({
          title: "Success",
          description: `${successCount} work logs ${isApproved ? 'approved' : 'rejected'} successfully.`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `${successCount} work logs processed successfully, ${failureCount} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to bulk approve work logs:", error);
      toast({
        title: "Error",
        description: "Failed to process bulk approval. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWorkLogs(workLogs.filter(log => !log.isApproved).map(log => log.id));
    } else {
      setSelectedWorkLogs([]);
    }
  };

  const handleSelectWorkLog = (workLogId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkLogs(prev => [...prev, workLogId]);
    } else {
      setSelectedWorkLogs(prev => prev.filter(id => id !== workLogId));
    }
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
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={selectedWorkLogs.length === workLogs.filter(log => !log.isApproved).length && workLogs.length > 0}
          onCheckedChange={handleSelectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedWorkLogs.includes(row.original.id)}
          onCheckedChange={(checked) => handleSelectWorkLog(row.original.id, checked as boolean)}
          disabled={row.original.isApproved}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'user',
      header: 'Employee',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/api/users/${row.original.id}/avatar`} />
            <AvatarFallback>
              {row.original.id.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">Employee Name</div>
            <div className="text-sm text-muted-foreground">employee@company.com</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(parseISO(row.original.date), "MMM dd, yyyy")}</span>
        </div>
      ),
    },
    {
      accessorKey: 'logType',
      header: 'Type',
      cell: ({ row }) => getLogTypeBadge(row.original.logType),
    },
    {
      accessorKey: 'project',
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
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatHours(row.original.hoursWorked)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.description}>
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: 'isApproved',
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
              setApprovalDialog({
                workLog: row.original,
                isApproving: true,
                comments: '',
              });
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {!row.original.isApproved && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setApprovalDialog({
                      workLog: row.original,
                      isApproving: true,
                      comments: '',
                    });
                  }}
                  className="text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setApprovalDialog({
                      workLog: row.original,
                      isApproving: false,
                      comments: '',
                    });
                  }}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const pendingCount = workLogs.filter(log => !log.isApproved).length;
  const totalHours = workLogs.reduce((sum, log) => sum + log.hoursWorked, 0);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Work Log Approvals</span>
              {pendingCount > 0 && (
                <Badge variant="secondary">{pendingCount} pending</Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-medium">{formatHours(totalHours)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={loadWorkLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {selectedWorkLogs.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Bulk Actions ({selectedWorkLogs.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        const selectedLogs = workLogs.filter(log => selectedWorkLogs.includes(log.id));
                        setBulkApprovalDialog({
                          workLogs: selectedLogs,
                          isApproving: true,
                          comments: '',
                        });
                      }}
                      className="text-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve All
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        const selectedLogs = workLogs.filter(log => selectedWorkLogs.includes(log.id));
                        setBulkApprovalDialog({
                          workLogs: selectedLogs,
                          isApproving: false,
                          comments: '',
                        });
                      }}
                      className="text-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {enableExport && (
                <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <SelectItem value="false">Pending</SelectItem>
                  <SelectItem value="true">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          {workLogs.length === 0 && !loading ? (
            <EmptyState
              icon={Clock}
              title="No work logs found"
              description="No work logs match the current filters."
            />
          ) : (
            <DataTable
              data={workLogs}
              columns={columns}
              searchKey="description"
            />
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      {approvalDialog && (
        <Dialog open={true} onOpenChange={() => setApprovalDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {approvalDialog.isApproving ? 'Approve' : 'Reject'} Work Log
              </DialogTitle>
              <DialogDescription>
                Review the work log details and provide feedback.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Work Log Details */}
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <div className="font-medium">
                      {format(parseISO(approvalDialog.workLog.date), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Hours:</span>
                    <div className="font-medium">
                      {formatHours(approvalDialog.workLog.hoursWorked)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <div>{getLogTypeBadge(approvalDialog.workLog.logType)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <div>{getStatusBadge(approvalDialog.workLog)}</div>
                  </div>
                </div>
                
                {(approvalDialog.workLog.project || approvalDialog.workLog.task) && (
                  <div>
                    <span className="text-sm text-muted-foreground">Project/Task:</span>
                    <div className="space-y-1">
                      {approvalDialog.workLog.project && (
                        <div className="font-medium">{approvalDialog.workLog.project.name}</div>
                      )}
                      {approvalDialog.workLog.task && (
                        <div className="text-sm text-muted-foreground">
                          {approvalDialog.workLog.task.title}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <div className="mt-1 p-2 bg-background rounded border">
                    {approvalDialog.workLog.description}
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Comments {!approvalDialog.isApproving && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  placeholder={
                    approvalDialog.isApproving 
                      ? "Add any comments or feedback (optional)..."
                      : "Please provide a reason for rejection..."
                  }
                  value={approvalDialog.comments}
                  onChange={(e) => setApprovalDialog(prev => 
                    prev ? { ...prev, comments: e.target.value } : null
                  )}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (approvalDialog) {
                    handleApproval(
                      approvalDialog.workLog.id,
                      approvalDialog.isApproving,
                      approvalDialog.comments
                    );
                  }
                }}
                disabled={isSubmitting || (!approvalDialog.isApproving && !approvalDialog.comments.trim())}
                className={approvalDialog.isApproving ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  approvalDialog.isApproving ? 'Approve' : 'Reject'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Approval Dialog */}
      {bulkApprovalDialog && (
        <Dialog open={true} onOpenChange={() => setBulkApprovalDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {bulkApprovalDialog.isApproving ? 'Bulk Approve' : 'Bulk Reject'} Work Logs
              </DialogTitle>
              <DialogDescription>
                {bulkApprovalDialog.isApproving 
                  ? `Approve ${bulkApprovalDialog.workLogs.length} selected work logs.`
                  : `Reject ${bulkApprovalDialog.workLogs.length} selected work logs.`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Selected Work Logs Preview */}
              <div>
                <label className="text-sm font-medium mb-2 block">Selected Work Logs</label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {bulkApprovalDialog.workLogs.map((workLog) => (
                    <div key={workLog.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">
                          {format(parseISO(workLog.date), 'MMM dd')}
                        </span>
                        <span className="text-sm">Employee Name</span>
                        <Badge variant="outline">{formatHours(workLog.hoursWorked)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {workLog.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Comments {!bulkApprovalDialog.isApproving && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  placeholder={
                    bulkApprovalDialog.isApproving 
                      ? "Add any comments or feedback (optional)..."
                      : "Please provide a reason for rejection..."
                  }
                  value={bulkApprovalDialog.comments}
                  onChange={(e) => setBulkApprovalDialog(prev => 
                    prev ? { ...prev, comments: e.target.value } : null
                  )}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkApprovalDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (bulkApprovalDialog) {
                    handleBulkApproval(
                      bulkApprovalDialog.workLogs.map(log => log.id),
                      bulkApprovalDialog.isApproving,
                      bulkApprovalDialog.comments
                    );
                  }
                }}
                disabled={isSubmitting || (!bulkApprovalDialog.isApproving && !bulkApprovalDialog.comments.trim())}
                className={bulkApprovalDialog.isApproving ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `${bulkApprovalDialog.isApproving ? 'Approve' : 'Reject'} ${bulkApprovalDialog.workLogs.length} Work Logs`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Export Dialog */}
      {enableExport && (
        <WorkLogExport
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          teamId={teamId}
        />
      )}
    </div>
  );
};