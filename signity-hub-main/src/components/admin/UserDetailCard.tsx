import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Building2,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/user.service";
import { taskService } from "@/services/task.service";
import { projectService } from "@/services/project.service";
import { worklogService } from "@/services/worklog.service";
import { leaveService } from "@/services/leave.service";
import { teamService } from "@/services/team.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ================= TYPES ================= */

interface UserDetailCardProps {
  userId: string;
  open: boolean;
  onClose: () => void;
  onEdit?: (userId: string) => void;
  onUserUpdated?: () => void;
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string };
  department?: { id: string; name: string; description?: string };
  team?: {
    id: string;
    name: string;
    description?: string;
    manager?: { id: string; name: string; email: string; role: string };
  };
}

interface WorkOverview {
  projects: { total: number; active: number; completed: number };
  tasks: { assigned: number; completed: number; inProgress: number; overdue: number };
}

interface TimeTracking {
  totalHoursLogged: number;
  averageHoursPerDay: number;
  lastWorkLogDate: string | null;
  unapprovedWorkLogs: number;
}

interface LeaveBalance {
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
  pending: number;
}

/* ================= COMPONENT ================= */

export function UserDetailCard({
  userId,
  open,
  onClose,
  onEdit,
  onUserUpdated,
}: UserDetailCardProps) {
  const { toast } = useToast();

  const [user, setUser] = useState<UserDetails | null>(null);
  const [workOverview, setWorkOverview] = useState<WorkOverview | null>(null);
  const [timeTracking, setTimeTracking] = useState<TimeTracking | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["organization", "workOverview"])
  );
  const [loading, setLoading] = useState(false);
  
  // Team assignment dialog state
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [assigningTeam, setAssigningTeam] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      
      /* ---------- USER ---------- */
      const userResult = await userService.getUserById(userId);
      setUser(userResult.user);

      /* ---------- TASKS & PROJECTS ---------- */
      const [tasksResult, projectsResult] = await Promise.all([
        taskService.getTasks({ assigneeId: userId }),
        projectService.getMyProjects(),
      ]);

      const tasks = tasksResult?.data ?? [];
      const projects = projectsResult?.data ?? [];

      setWorkOverview({
        projects: {
          total: projects.length,
          active: projects.filter((p: any) => p.status === "IN_PROGRESS").length,
          completed: projects.filter((p: any) => p.status === "COMPLETED").length,
        },
        tasks: {
          assigned: tasks.length,
          completed: tasks.filter((t: any) => t.status === "COMPLETED").length,
          inProgress: tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
          overdue: tasks.filter(
            (t: any) =>
              t.dueDate &&
              new Date(t.dueDate) < new Date() &&
              t.status !== "COMPLETED"
          ).length,
        },
      });

      /* ---------- WORK LOGS ---------- */
      const workLogsResult = await worklogService.getTeamWorkLogs({ userId });
      const workLogs = workLogsResult?.data ?? [];

      const totalHours = workLogs.reduce(
        (sum: number, log: any) => sum + (log.hoursWorked || 0),
        0
      );

      const avgHours =
        workLogs.length > 0 ? totalHours / workLogs.length : 0;

      const sortedLogs = [...workLogs].sort(
        (a: any, b: any) =>
          new Date(b.workDate).getTime() - new Date(a.workDate).getTime()
      );

      const lastLog =
        sortedLogs.length > 0 ? sortedLogs[0].workDate : null;

      const unapproved = workLogs.filter((log: any) => !log.isApproved).length;

      setTimeTracking({
        totalHoursLogged: totalHours,
        averageHoursPerDay: avgHours,
        lastWorkLogDate: lastLog,
        unapprovedWorkLogs: unapproved,
      });

      /* ---------- LEAVES ---------- */
      try {
        console.log('🔍 Fetching leave data for user:', userId);
        console.log('⚠️  Note: Leave APIs return data for logged-in user, not the viewed user');
        
        // NOTE: The leave balance and history APIs return data for the currently logged-in user (admin),
        // not for the user being viewed. This is a backend limitation.
        // To show leave data for the viewed user, we would need new admin endpoints like:
        // GET /api/admin/users/:userId/leaves/balance
        // GET /api/admin/users/:userId/leaves/history
        
        // For now, we'll attempt to fetch but show appropriate message if data doesn't match
        const [leaveBalanceResult, leaveHistoryResult] = await Promise.all([
          leaveService.getLeaveBalance().catch(err => {
            console.error('❌ Leave balance fetch error:', err);
            return null;
          }),
          leaveService.getLeaveHistory({ limit: 100 }).catch(err => {
            console.error('❌ Leave history fetch error:', err);
            return null;
          })
        ]);

        console.log('📊 Leave balance result:', leaveBalanceResult);
        console.log('📊 Leave history result:', leaveHistoryResult);

        // Handle different response structures
        let balances = [];
        if (leaveBalanceResult) {
          if (Array.isArray(leaveBalanceResult.data)) {
            balances = leaveBalanceResult.data;
          } else if ((leaveBalanceResult as any).balances) {
            balances = (leaveBalanceResult as any).balances;
          } else if (Array.isArray((leaveBalanceResult as any).data?.balances)) {
            balances = (leaveBalanceResult as any).data.balances;
          }
        }

        let history = [];
        if (leaveHistoryResult) {
          if (Array.isArray(leaveHistoryResult.data)) {
            history = leaveHistoryResult.data;
          } else if ((leaveHistoryResult as any).leaves) {
            history = (leaveHistoryResult as any).leaves;
          } else if (Array.isArray((leaveHistoryResult as any).data?.leaves)) {
            history = (leaveHistoryResult as any).data.leaves;
          }
        }

        console.log('✅ Processed balances:', balances);
        console.log('✅ Processed history:', history);

        if (balances.length === 0) {
          console.warn('⚠️  No leave balances found - this could mean:');
          console.warn('   1. User has no leave types assigned');
          console.warn('   2. Leave balance API returns data for logged-in admin, not viewed user');
          console.warn('   3. Backend needs admin endpoint: GET /api/admin/users/:userId/leaves/balance');
          setLeaveBalances([]);
          return;
        }

        // Calculate leave data with proper grouping by leave type
        const leaveData: LeaveBalance[] = balances.map((balance: any) => {
          const leaveTypeId = balance.leaveType?.id;
          
          // Count pending leaves for this leave type
          const pendingCount = history.filter(
            (l: any) =>
              l.leaveType?.id === leaveTypeId &&
              l.status === "PENDING"
          ).length;

          const leaveInfo = {
            leaveType: balance.leaveType?.name || "Unknown",
            allocated: balance.totalDays ?? 0,
            used: balance.usedDays ?? 0,
            remaining: balance.remainingDays ?? 0,
            pending: pendingCount,
          };

          console.log(`📋 Leave type "${leaveInfo.leaveType}":`, leaveInfo);
          return leaveInfo;
        });

        console.log('✅ Final leave data:', leaveData);
        setLeaveBalances(leaveData);
      } catch (error) {
        console.error('❌ Failed to fetch leave balances:', error);
        setLeaveBalances([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch user details:", error);
      toast({
        variant: "destructive",
        title: "Failed to load user details",
        description: error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= TEAM ASSIGNMENT ================= */
  
  const handleOpenTeamDialog = async () => {
    try {
      setShowTeamDialog(true);
      const teamsResult = await teamService.getTeams();
      setAvailableTeams(teamsResult.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load teams",
        description: error?.message || "Please try again.",
      });
    }
  };

  const handleAssignTeam = async () => {
    if (!selectedTeamId) {
      toast({
        variant: "destructive",
        title: "No team selected",
        description: "Please select a team to assign.",
      });
      return;
    }

    try {
      setAssigningTeam(true);
      
      // If user already has a team, remove them first
      if (user?.team?.id) {
        await teamService.removeTeamMember(user.team.id, userId);
      }
      
      // Add user to new team
      await teamService.addTeamMember(selectedTeamId, userId);
      
      toast({
        title: "Team assigned successfully",
        description: `User has been ${user?.team?.id ? 'reassigned to' : 'assigned to'} the selected team.`,
      });
      
      setShowTeamDialog(false);
      setSelectedTeamId("");
      
      // Refresh user details
      await fetchUserDetails();
      onUserUpdated?.();
      
    } catch (error: any) {
      console.error("Failed to assign team:", error);
      toast({
        variant: "destructive",
        title: "Failed to assign team",
        description: error?.message || "Please try again.",
      });
    } finally {
      setAssigningTeam(false);
    }
  };

  /* ================= USER ACTIVATION/DEACTIVATION ================= */
  
  const handleToggleUserStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      if (user.isActive) {
        // Deactivate user
        await userService.deactivateUser(userId);
        toast({
          title: "User deactivated",
          description: `${user.name} has been deactivated successfully.`,
        });
      } else {
        // Activate user
        await userService.activateUser(userId);
        toast({
          title: "User activated",
          description: `${user.name} has been activated successfully.`,
        });
      }
      
      // Refresh user details
      await fetchUserDetails();
      onUserUpdated?.();
      
    } catch (error: any) {
      console.error("Failed to toggle user status:", error);
      toast({
        variant: "destructive",
        title: `Failed to ${user.isActive ? 'deactivate' : 'activate'} user`,
        description: error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= HELPERS ================= */

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
      return next;
    });
  };

  const getRoleColor = (role: string) =>
    ({
      ADMIN: "bg-red-500",
      HR: "bg-blue-500",
      MANAGER: "bg-purple-500",
      EMPLOYEE: "bg-green-500",
    }[role] || "bg-gray-500");

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (!open) return null;


  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Centered Modal Card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl max-h-[90vh] bg-background rounded-xl shadow-2xl border pointer-events-auto flex flex-col"
            >
              {/* Header - Fixed */}
              <div className="flex-shrink-0 p-6 border-b bg-gradient-to-r from-background to-muted/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className={`w-16 h-16 ${user ? getRoleColor(user.role) : "bg-gray-500"} ring-4 ring-background shadow-lg`}>
                      <AvatarFallback className="text-white font-bold text-xl">
                        {user ? getInitials(user.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{user?.name || "Loading..."}</h2>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      {user && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                          <Badge variant="outline">{user.role}</Badge>
                          {user.isEmailVerified && (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Meta Information */}
                {user && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* Changed to 2-column grid */}

                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Organization Section */}
                    <CollapsibleSection
                      id="organization"
                      title="Organization"
                      icon={<Building2 className="w-4 h-4" />}
                      expanded={expandedSections.has("organization")}
                      onToggle={() => toggleSection("organization")}
                    >
                      {user && (
                        <div className="grid grid-cols-2 gap-4">
                          <InfoItem label="Company" value={user.company?.name || "N/A"} />
                          <InfoItem label="Department" value={user.department?.name || "N/A"} />
                          <InfoItem label="Team" value={user.team?.name || "N/A"} />
                          <InfoItem label="Manager" value={user.team?.manager?.name || "N/A"} />
                        </div>
                      )}
                    </CollapsibleSection>

                    {/* Work Overview Section */}
                    <CollapsibleSection
                      id="workOverview"
                      title="Work Overview"
                      icon={<Briefcase className="w-4 h-4" />}
                      expanded={expandedSections.has("workOverview")}
                      onToggle={() => toggleSection("workOverview")}
                    >
                      {workOverview && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Projects</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <StatCard label="Total" value={workOverview.projects.total} />
                              <StatCard label="Active" value={workOverview.projects.active} variant="blue" />
                              <StatCard label="Completed" value={workOverview.projects.completed} variant="green" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Tasks</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <StatCard label="Assigned" value={workOverview.tasks.assigned} />
                              <StatCard label="Completed" value={workOverview.tasks.completed} variant="green" />
                              <StatCard label="In Progress" value={workOverview.tasks.inProgress} variant="blue" />
                              <StatCard label="Overdue" value={workOverview.tasks.overdue} variant="red" />
                            </div>
                          </div>
                        </div>
                      )}
                    </CollapsibleSection>

                    {/* Time Tracking Section */}
                    <CollapsibleSection
                      id="timeTracking"
                      title="Time & Work Logs"
                      icon={<Clock className="w-4 h-4" />}
                      expanded={expandedSections.has("timeTracking")}
                      onToggle={() => toggleSection("timeTracking")}
                    >
                      {timeTracking && (
                        <div className="space-y-3">
                          <InfoItem 
                            label="Total Hours Logged" 
                            value={`${timeTracking.totalHoursLogged.toFixed(1)} hrs`} 
                          />
                          <InfoItem 
                            label="Average Hours/Day" 
                            value={`${timeTracking.averageHoursPerDay.toFixed(1)} hrs`} 
                          />
                          <InfoItem 
                            label="Last Work Log" 
                            value={timeTracking.lastWorkLogDate 
                              ? new Date(timeTracking.lastWorkLogDate).toLocaleDateString() 
                              : "No logs"
                            } 
                          />
                          {timeTracking.unapprovedWorkLogs > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{timeTracking.unapprovedWorkLogs} unapproved work logs</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CollapsibleSection>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">{/* Right column content */}

                {/* Leave Summary Section */}
                <CollapsibleSection
                  id="leaveSummary"
                  title="Leave Summary"
                  icon={<Calendar className="w-4 h-4" />}
                  expanded={expandedSections.has("leaveSummary")}
                  onToggle={() => toggleSection("leaveSummary")}
                >
                  {leaveBalances.length > 0 ? (
                    <div className="space-y-3">
                      {leaveBalances.map((balance, index) => (
                        <div key={index} className="p-3 border rounded-lg space-y-3 bg-card">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{balance.leaveType}</span>
                            {balance.pending > 0 && (
                              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                {balance.pending} pending
                              </Badge>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Used: {balance.used} / {balance.allocated} days</span>
                              <span className="font-medium text-foreground">{balance.remaining} left</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                style={{ width: `${balance.allocated > 0 ? (balance.used / balance.allocated) * 100 : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Allocated</p>
                              <p className="text-sm font-bold text-blue-600">{balance.allocated}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Used</p>
                              <p className="text-sm font-bold text-orange-600">{balance.used}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Remaining</p>
                              <p className="text-sm font-bold text-green-600">{balance.remaining}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">No leave data available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave data can only be viewed for your own account
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Check browser console for technical details
                      </p>
                    </div>
                  )}
                </CollapsibleSection>

                    {/* Activity & Risk Section */}
                    <CollapsibleSection
                      id="activityRisk"
                      title="Activity & Risk Indicators"
                      icon={<Activity className="w-4 h-4" />}
                      expanded={expandedSections.has("activityRisk")}
                      onToggle={() => toggleSection("activityRisk")}
                    >
                      <div className="space-y-2">
                        {workOverview && workOverview.tasks.overdue > 0 && (
                          <RiskIndicator
                            type="OVERDUE_TASKS"
                            count={workOverview.tasks.overdue}
                            severity="medium"
                            message="tasks are overdue"
                          />
                        )}
                        {timeTracking && timeTracking.unapprovedWorkLogs > 0 && (
                          <RiskIndicator
                            type="UNAPPROVED_WORK_LOGS"
                            count={timeTracking.unapprovedWorkLogs}
                            severity="low"
                            message="work logs need approval"
                          />
                        )}
                        {(!workOverview || (workOverview.tasks.overdue === 0 && timeTracking?.unapprovedWorkLogs === 0)) && (
                          <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm">No risk indicators</span>
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer - Fixed Actions */}
              <div className="flex-shrink-0 p-6 border-t bg-muted/20">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">Admin Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit?.(userId)} className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit User
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={handleOpenTeamDialog}
                    >
                      <Users className="w-4 h-4" />
                      {user?.team ? "Reassign Team" : "Assign Team"}
                    </Button>
                    <Button 
                      variant={user?.isActive ? "destructive" : "default"}
                      size="sm" 
                      className="gap-2 ml-auto"
                      onClick={handleToggleUserStatus}
                      disabled={loading}
                    >
                      {user?.isActive ? (
                        <>
                          <UserX className="w-4 h-4" />
                          Deactivate Account
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Activate Account
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Team Assignment Dialog */}
          <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {user?.team ? "Reassign Team" : "Assign Team"}
                </DialogTitle>
                <DialogDescription>
                  {user?.team 
                    ? `Current team: ${user.team.name}. Select a new team to reassign this user.`
                    : "Select a team to assign this user to."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {user?.team && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Current Team</p>
                    <p className="text-sm text-muted-foreground">{user.team.name}</p>
                    {user.team.manager && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Manager: {user.team.manager.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Team</label>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{team.name}</span>
                            <span className="text-xs text-muted-foreground">
                              Manager: {team.manager?.name || 'N/A'} • 
                              Members: {team.memberCount || team.members?.length || 0} • 
                              Projects: {team.projectCount || team.projects?.length || 0}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTeamId && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-sm text-blue-600">
                      {user?.team 
                        ? `User will be removed from "${user.team.name}" and added to the selected team.`
                        : "User will be added to the selected team."
                      }
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTeamDialog(false);
                    setSelectedTeamId("");
                  }}
                  disabled={assigningTeam}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignTeam}
                  disabled={!selectedTeamId || assigningTeam}
                >
                  {assigningTeam ? "Assigning..." : user?.team ? "Reassign" : "Assign"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper Components
interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 pt-0 border-t">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  variant?: "default" | "blue" | "green" | "red";
}

function StatCard({ label, value, variant = "default" }: StatCardProps) {
  const colors = {
    default: "bg-muted",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    green: "bg-green-500/10 text-green-600 border-green-500/20",
    red: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <div className={`p-2 rounded-md border ${colors[variant]}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

interface RiskIndicatorProps {
  type: string;
  count: number;
  severity: "low" | "medium" | "high";
  message: string;
}

function RiskIndicator({ count, severity, message }: RiskIndicatorProps) {
  const colors = {
    low: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600",
    medium: "bg-orange-500/10 border-orange-500/20 text-orange-600",
    high: "bg-red-500/10 border-red-500/20 text-red-600",
  };

  return (
    <div className={`flex items-center gap-2 p-2 border rounded-md ${colors[severity]}`}>
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">
        <strong>{count}</strong> {message}
      </span>
    </div>
  );
}
