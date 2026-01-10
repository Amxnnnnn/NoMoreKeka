import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Users, Calendar, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { LeaveApprovalTable } from "@/components/leave/LeaveApprovalTable";
import { LeaveApprovalDialog } from "@/components/leave/LeaveApprovalDialog";
import { BulkLeaveApprovalDialog } from "@/components/leave/BulkLeaveApprovalDialog";
import { LeaveCalendar } from "@/components/leave/LeaveCalendar";

import { Leave, leaveService } from "@/services/leave.service";

export const LeaveApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLeave, setSelectedLeave] = React.useState<Leave | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = React.useState(false);
  const [showBulkDialog, setShowBulkDialog] = React.useState(false);
  const [bulkDecision, setBulkDecision] = React.useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [bulkLeaves, setBulkLeaves] = React.useState<Leave[]>([]);
  const [stats, setStats] = React.useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    urgent: 0,
  });
  const [activeTab, setActiveTab] = React.useState("pending");

  // Load stats on component mount
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        // This would typically come from an API
        setStats({
          pending: 12,
          approved: 45,
          rejected: 3,
          urgent: 4,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    };

    loadStats();
  }, []);

  const handleViewDetails = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowApprovalDialog(true);
  };

  const handleApprove = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowApprovalDialog(true);
  };

  const handleReject = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowApprovalDialog(true);
  };

  const handleBulkApprove = (leaves: Leave[]) => {
    setBulkLeaves(leaves);
    setBulkDecision('APPROVED');
    setShowBulkDialog(true);
  };

  const handleBulkReject = (leaves: Leave[]) => {
    setBulkLeaves(leaves);
    setBulkDecision('REJECTED');
    setShowBulkDialog(true);
  };

  const handleApprovalComplete = (leave: Leave, decision: 'APPROVED' | 'REJECTED') => {
    // Update stats
    setStats(prev => ({
      ...prev,
      pending: prev.pending - 1,
      approved: decision === 'APPROVED' ? prev.approved + 1 : prev.approved,
      rejected: decision === 'REJECTED' ? prev.rejected + 1 : prev.rejected,
    }));

    // Show success message or refresh data
    console.log(`Leave ${decision.toLowerCase()} successfully`);
  };

  const handleBulkApprovalComplete = (processedLeaves: Leave[], decision: 'APPROVED' | 'REJECTED') => {
    // Update stats
    setStats(prev => ({
      ...prev,
      pending: prev.pending - processedLeaves.length,
      approved: decision === 'APPROVED' ? prev.approved + processedLeaves.length : prev.approved,
      rejected: decision === 'REJECTED' ? prev.rejected + processedLeaves.length : prev.rejected,
    }));

    console.log(`${processedLeaves.length} leaves ${decision.toLowerCase()} successfully`);
  };

  const handleLeaveClick = (leave: Leave) => {
    handleViewDetails(leave);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Leave Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve leave requests from your team members.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejected This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.urgent}</p>
                  <p className="text-sm text-muted-foreground">Urgent Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Requests Alert */}
        {stats.urgent > 0 && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Urgent Leave Requests</p>
                  <p className="text-sm">
                    You have {stats.urgent} leave requests that start within 3 days and need immediate attention.
                  </p>
                </div>
                <Button size="sm" onClick={() => setActiveTab("pending")}>
                  Review Now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Pending Requests</span>
              {stats.pending > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Team Calendar</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-6">
            <LeaveApprovalTable
              onViewDetails={handleViewDetails}
              onApprove={handleApprove}
              onReject={handleReject}
              onBulkApprove={handleBulkApprove}
              onBulkReject={handleBulkReject}
            />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <LeaveCalendar
              showTeamView={true}
              teamMembers={[]} // Would be loaded from API
              onLeaveClick={handleLeaveClick}
            />
          </TabsContent>
        </Tabs>

        {/* Leave Approval Dialog */}
        <LeaveApprovalDialog
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          leave={selectedLeave}
          onApprovalComplete={handleApprovalComplete}
        />

        {/* Bulk Approval Dialog */}
        <BulkLeaveApprovalDialog
          open={showBulkDialog}
          onOpenChange={setShowBulkDialog}
          leaves={bulkLeaves}
          defaultDecision={bulkDecision}
          onBulkApprovalComplete={handleBulkApprovalComplete}
        />
      </div>
    </DashboardLayout>
  );
};