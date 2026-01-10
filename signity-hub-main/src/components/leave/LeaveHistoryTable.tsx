import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Eye, X, Calendar, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Leave, leaveService } from "@/services/leave.service";
import { useDataStore } from "@/stores/dataStore";

interface LeaveHistoryTableProps {
  onViewDetails?: (leave: Leave) => void;
  onCancelLeave?: (leave: Leave) => void;
  className?: string;
}

export const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({
  onViewDetails,
  onCancelLeave,
  className,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [leaves, setLeaves] = React.useState<Leave[]>([]);
  const { leaves: storeLeaves } = useDataStore();

  // Load leave history on component mount
  React.useEffect(() => {
    const loadLeaveHistory = async () => {
      setLoading(true);
      try {
        const result = await leaveService.getLeaveHistory();
        if (result.success) {
          setLeaves(result.data);
        }
      } catch (error) {
        console.error("Failed to load leave history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeLeaves.length > 0) {
      setLeaves(storeLeaves);
    } else {
      loadLeaveHistory();
    }
  }, [storeLeaves]);

  const getStatusVariant = (status: Leave['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: Leave['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'REJECTED':
        return 'text-red-600';
      case 'CANCELLED':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const canCancelLeave = (leave: Leave) => {
    return leave.status === 'PENDING' || 
           (leave.status === 'APPROVED' && new Date(leave.startDate) > new Date());
  };

  const columns: ColumnDef<Leave>[] = [
    {
      accessorKey: "leaveType.name",
      header: "Leave Type",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.leaveType.name}
        </div>
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
        <Badge variant="outline" className="font-mono">
          {row.original.days}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
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
      accessorKey: "approver",
      header: "Approver",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.approver?.name || "Pending"}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const leave = row.original;

        return (
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(leave.id)}>
                <Download className="mr-2 h-4 w-4" />
                Copy Leave ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canCancelLeave(leave) && (
                <DropdownMenuItem
                  onClick={() => onCancelLeave?.(leave)}
                  className="text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Leave
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const statusFilters = [
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Leave History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={leaves}
          searchKey="leaveType.name"
          searchPlaceholder="Search by leave type..."
          loading={loading}
          emptyMessage="No leave applications found."
          filters={[
            {
              column: "status",
              title: "Status",
              options: statusFilters,
            },
          ]}
          onRowClick={onViewDetails}
        />
      </CardContent>
    </Card>
  );
};