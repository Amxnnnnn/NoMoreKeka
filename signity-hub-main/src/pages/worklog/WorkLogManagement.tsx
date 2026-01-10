import * as React from "react";
import { Plus, Clock, BarChart3, History, Download, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { 
  WorkLogEntryForm, 
  WorkLogHistoryTable, 
  WorkLogAnalytics,
  WorkLogExport
} from "@/components/worklog";
import { StatCard } from "@/components/StatCard";
import { useAuthStore } from "@/stores/authStore";
import { worklogService } from "@/services/worklog.service";

export const WorkLogManagement: React.FC = () => {
  const [showEntryForm, setShowEntryForm] = React.useState(false);
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = React.useState(null);
  const [quickStats, setQuickStats] = React.useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = React.useState(true);

  const { user } = useAuthStore();

  // Load quick stats
  React.useEffect(() => {
    const loadQuickStats = async () => {
      try {
        setLoading(true);
        
        // Get today's summary
        const today = new Date().toISOString().split('T')[0];
        const todayResult = await worklogService.getWorkLogSummary(today, today);
        
        // Get this week's summary
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekResult = await worklogService.getWorkLogSummary(weekStartStr);
        
        // Get this month's summary
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthResult = await worklogService.getWorkLogSummary(monthStartStr);

        setQuickStats({
          todayHours: todayResult.success ? todayResult.data.totalHours || 0 : 0,
          weekHours: weekResult.success ? weekResult.data.totalHours || 0 : 0,
          monthHours: monthResult.success ? monthResult.data.totalHours || 0 : 0,
          pendingApprovals: monthResult.success ? monthResult.data.pendingEntries || 0 : 0,
        });
      } catch (error) {
        console.error("Failed to load quick stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuickStats();
  }, []);

  const formatHours = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const handleWorkLogSuccess = () => {
    setShowEntryForm(false);
    // Refresh stats
    window.location.reload();
  };

  const handleEditWorkLog = (workLog: any) => {
    setSelectedWorkLog(workLog);
    setShowEntryForm(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Log Management</h1>
          <p className="text-muted-foreground">
            Track your work time and manage your daily activities
          </p>
        </div>
        <Button onClick={() => setShowEntryForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Work Time
        </Button>
        <Button variant="outline" onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Today"
          value={formatHours(quickStats.todayHours)}
          icon={Clock}
        />
        <StatCard
          title="This Week"
          value={formatHours(quickStats.weekHours)}
          icon={BarChart3}
          trend={{ value: quickStats.weekHours, isPositive: true }}
        />
        <StatCard
          title="This Month"
          value={formatHours(quickStats.monthHours)}
          icon={History}
          trend={{ value: quickStats.monthHours, isPositive: true }}
        />
        <StatCard
          title="Pending Approvals"
          value={quickStats.pendingApprovals.toString()}
          icon={Clock}
          trend={quickStats.pendingApprovals > 0 ? { value: quickStats.pendingApprovals, isPositive: false } : undefined}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Work Log History</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <WorkLogHistoryTable
            onEdit={handleEditWorkLog}
            onView={(workLog) => console.log('View work log:', workLog)}
            showFilters={true}
            enableBulkActions={true}
            enableExport={true}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <WorkLogAnalytics />
        </TabsContent>
      </Tabs>

      {/* Work Log Entry Dialog */}
      <Dialog open={showEntryForm} onOpenChange={setShowEntryForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkLog ? 'Edit Work Log' : 'Log Work Time'}
            </DialogTitle>
          </DialogHeader>
          <WorkLogEntryForm
            onSuccess={handleWorkLogSuccess}
            onCancel={() => {
              setShowEntryForm(false);
              setSelectedWorkLog(null);
            }}
            initialData={selectedWorkLog ? {
              projectId: selectedWorkLog.project?.id,
              taskId: selectedWorkLog.task?.id,
              date: new Date(selectedWorkLog.date),
              hoursWorked: selectedWorkLog.hoursWorked,
              description: selectedWorkLog.description,
              logType: selectedWorkLog.logType,
            } : undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <WorkLogExport
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </div>
  );
};