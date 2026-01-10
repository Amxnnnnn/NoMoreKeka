import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Check, X, MessageSquare, Users, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, createSelectColumn } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Leave, leaveService } from "@/services/leave.service";

interface LeaveApprovalTableProps {
  onViewDetails?: (leave: Leave) => void;
  onApprove?: (leave: Leave) => void;
  onReject?: (leave: Leave) => void;
  onBulkApprove?: (leaves: Leave[]) => void;
  onBulkReject?: (leaves: Leave[]) => void;
  className?: string;
}

export const LeaveApprovalTable: React.FC<LeaveApprovalTableProps> = ({
  onViewDetails,
  onApprove,
  onReject,
  onBulkApprove,
  onBulkReject,
  className,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [leaves, setLeaves] = React.useState<Leave[]>([]);
  const [selectedLeaves, setSelectedLeaves] = React.useState<Leave[]>([]);

  // Load pending leave requests
  React.useEffect(() => {
    const loadPendingLeaves = async () => {
      setLoading(true);
      try {
        const result = await leaveService.getTeamLeaveRequests();
        if (result.success) {
          // Filter only pending requests
          const pendingLeaves = result.data.filter(leave => leave.status === 'PENDING');
          setLeaves(pendingLeaves);
        }
      } catch (error) {
        console.error("Failed to load pending leaves:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPendingLeaves();
  }, []);

  const getUrgencyLevel = (leave: Leave) => {
    const startDate = new Date(leave.startDate);
    const today = new Date();
    const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilStart <= 3) return { level: 'high', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (daysUntilStart <= 7) return { level: 'medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'low', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const handleRowSelection = (selectedRows: Array<{ original: Leave }>) => {
    const selectedLeaveData = selectedRows.map(row => row.original);
    setSelectedLeaves(selectedLeaveData);
  };

  const columns: ColumnDef<Leave>[] = [
    createSelectColumn<Leave>(),
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/api/avatars/${row.original.id}`} />
            <AvatarFallback>
              {/* Would get employee name from API */}
              EM
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">Employee Name</p>
            <p className="text-xs text-muted-foreground">employee@company.com</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "leaveType.name",
      header: "Leave Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.leaveType.name}
        </Badge>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.startDate), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.endDate), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "days",
      header: "Days",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono">
          {row.original.days}
        </Badge>
      ),
    },
    {
      accessorKey: "urgency",
      header: "Urgency",
      cell: ({ row }) => {
        const urgency = getUrgencyLevel(row.original);
        const startDate = new Date(row.original.startDate);
        const today = new Date();
        const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className={`flex items-center space-x-1 ${urgency.color}`}>
                  {urgency.level === 'high' && <AlertTriangle className="h-4 w-4" />}
                  <span className="text-sm font-medium capitalize">{urgency.level}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Starts in {daysUntilStart} days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "appliedAt",
      header: "Applied On",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.appliedAt), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const leave = row.original;

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove?.(leave)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject?.(leave)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewDetails?.(leave)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onApprove?.(leave)}>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReject?.(leave)}>
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Comment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const urgencyFilters = [
    { label: "High Urgency", value: "high" },
    { label: "Medium Urgency", value: "medium" },
    { label: "Low Urgency", value: "low" },
  ];

  const leaveTypeFilters = Array.from(
    new Set(leaves.map(leave => leave.leaveType.name))
  ).map(type => ({ label: type, value: type }));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Pending Leave Requests</span>
            {leaves.length > 0 && (
              <Badge variant="secondary">{leaves.length}</Badge>
            )}
          </CardTitle>
          
          {selectedLeaves.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedLeaves.length} selected
              </span>
              <Button
                size="sm"
                onClick={() => onBulkApprove?.(selectedLeaves)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve All
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onBulkReject?.(selectedLeaves)}
              >
                <X className="h-4 w-4 mr-1" />
                Reject All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={leaves}
          searchKey="employee"
          searchPlaceholder="Search by employee name..."
          loading={loading}
          emptyMessage="No pending leave requests found."
          showRowSelection={true}
          filters={[
            {
              column: "leaveType.name",
              title: "Leave Type",
              options: leaveTypeFilters,
            },
          ]}
          onRowClick={onViewDetails}
        />
      </CardContent>
    </Card>
  );
};