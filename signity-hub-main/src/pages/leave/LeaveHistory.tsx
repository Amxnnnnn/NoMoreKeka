import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Calendar, BarChart3, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { LeaveHistoryTable } from "@/components/leave/LeaveHistoryTable";
import { LeaveStatusTimeline } from "@/components/leave/LeaveStatusTimeline";
import { LeaveCalendar } from "@/components/leave/LeaveCalendar";
import { LeaveBalanceChart } from "@/components/leave/LeaveBalanceChart";

import { Leave, leaveService } from "@/services/leave.service";

export const LeaveHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLeave, setSelectedLeave] = React.useState<Leave | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("history");

  const handleViewDetails = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowDetailsDialog(true);
  };

  const handleCancelLeave = async (leave: Leave) => {
    try {
      const result = await leaveService.cancelLeaveRequest(leave.id);
      if (result.success) {
        // Refresh data or show success message
        console.log("Leave cancelled successfully");
      }
    } catch (error) {
      console.error("Failed to cancel leave:", error);
    }
  };

  const handleLeaveClick = (leave: Leave) => {
    handleViewDetails(leave);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
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
          
          <Button
            onClick={() => navigate("/leave/apply")}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Apply for Leave</span>
          </Button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground mt-2">
            Track your leave applications, view balance, and manage your time off.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Balance</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <LeaveHistoryTable
              onViewDetails={handleViewDetails}
              onCancelLeave={handleCancelLeave}
            />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <LeaveCalendar
              onLeaveClick={handleLeaveClick}
            />
          </TabsContent>

          {/* Balance Tab */}
          <TabsContent value="balance" className="space-y-6">
            <LeaveBalanceChart />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeaveBalanceChart />
              <LeaveCalendar
                onLeaveClick={handleLeaveClick}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Leave Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Leave Application Details</DialogTitle>
            </DialogHeader>
            
            {selectedLeave && (
              <div className="space-y-6">
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Leave Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{selectedLeave.leaveType.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{selectedLeave.days} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">{selectedLeave.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Reason</h3>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {selectedLeave.reason}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Timeline</h3>
                    <LeaveStatusTimeline leave={selectedLeave} />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};