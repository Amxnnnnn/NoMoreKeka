import * as React from "react";
import { CheckCircle, Clock, BarChart3, Users, AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { 
  WorkLogApprovalTable, 
  WorkLogAnalytics 
} from "@/components/worklog";
import { StatCard } from "@/components/StatCard";
import { useAuthStore } from "@/stores/authStore";
import { worklogService } from "@/services/worklog.service";
import { teamService } from "@/services/team.service";

export const WorkLogApproval: React.FC = () => {
  const [quickStats, setQuickStats] = React.useState({
    pendingApprovals: 0,
    totalTeamHours: 0,
    approvedToday: 0,
    teamMembers: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [teams, setTeams] = React.useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = React.useState<string | undefined>();

  const { user } = useAuthStore();

  // Load quick stats and teams
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load teams if user is manager/admin
        if (user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'ADMIN') {
          const teamsResult = await teamService.getMyTeams();
          if (teamsResult.success) {
            setTeams(teamsResult.data);
            if (teamsResult.data.length > 0) {
              setSelectedTeam(teamsResult.data[0].id);
            }
          }
        }

        // Get pending approvals
        const pendingResult = await worklogService.getTeamWorkLogs({ 
          isApproved: false,
          limit: 100 
        });
        
        // Get today's approved logs
        const today = new Date().toISOString().split('T')[0];
        const approvedTodayResult = await worklogService.getTeamWorkLogs({ 
          isApproved: true,
          startDate: today,
          endDate: today,
          limit: 100
        });

        // Get this month's team hours
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthResult = await worklogService.getWorkLogSummary(monthStartStr);

        setQuickStats({
          pendingApprovals: pendingResult.success ? pendingResult.data.length : 0,
          totalTeamHours: monthResult.success ? monthResult.data.totalHours || 0 : 0,
          approvedToday: approvedTodayResult.success ? approvedTodayResult.data.length : 0,
          teamMembers: teams.reduce((sum, team) => sum + (team.members?.length || 0), 0),
        });
      } catch (error) {
        console.error("Failed to load approval data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, teams.length]);

  const formatHours = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Log Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve team work log entries
          </p>
        </div>
        {quickStats.pendingApprovals > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <AlertCircle className="h-4 w-4 mr-2" />
            {quickStats.pendingApprovals} pending
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approvals"
          value={quickStats.pendingApprovals.toString()}
          icon={AlertCircle}
          trend={quickStats.pendingApprovals > 0 ? { value: quickStats.pendingApprovals, isPositive: false } : undefined}
        />
        <StatCard
          title="Approved Today"
          value={quickStats.approvedToday.toString()}
          icon={CheckCircle}
          trend={{ value: quickStats.approvedToday, isPositive: true }}
        />
        <StatCard
          title="Team Hours (Month)"
          value={formatHours(quickStats.totalTeamHours)}
          icon={Clock}
          trend={{ value: quickStats.totalTeamHours, isPositive: true }}
        />
        <StatCard
          title="Team Members"
          value={quickStats.teamMembers.toString()}
          icon={Users}
        />
      </div>

      {/* Team Selection */}
      {teams.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTeam(undefined)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTeam === undefined
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                All Teams
              </button>
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedTeam === team.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {team.name}
                  {team.members && (
                    <Badge variant="secondary" className="ml-2">
                      {team.members.length}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Pending Approvals</span>
            {quickStats.pendingApprovals > 0 && (
              <Badge variant="secondary" className="ml-2">
                {quickStats.pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Team Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <WorkLogApprovalTable 
            teamId={selectedTeam} 
            enableExport={true}
            showOnlyPending={true}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <WorkLogAnalytics teamId={selectedTeam} />
        </TabsContent>
      </Tabs>
    </div>
  );
};