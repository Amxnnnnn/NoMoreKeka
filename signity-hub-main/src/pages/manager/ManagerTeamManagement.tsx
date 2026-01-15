import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Search, 
  TrendingUp,
  CheckCircle,
  Target
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable, createActionsColumn, createStatusColumn } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { teamService, TeamMember as ServiceTeamMember } from '@/services/team.service';
import { projectService } from '@/services/project.service';
import { AddMemberDialog } from '@/components/team/AddMemberDialog';
import { ColumnDef } from '@tanstack/react-table';

interface TeamMember extends ServiceTeamMember {
  joinedAt: string;
  currentProjects: number;
  completedTasks: number;
  pendingTasks: number;
  productivity: number;
  lastActive: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  onLeaveMembers: number;
  averageProductivity: number;
  totalProjects: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function ManagerTeamManagement() {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [currentTeam, setCurrentTeam] = useState<any>(null); // Store current team data
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);
 const loadTeamData = async () => {
    try {
      setLoading(true);
      
      const [teamsResult, projectsResult] = await Promise.all([
        teamService.getMyTeams(),
        projectService.getManagedProjects()
      ]);

      console.log('ManagerTeam: Teams result:', teamsResult);
      console.log('ManagerTeam: Projects result:', projectsResult);

      if (teamsResult.success && teamsResult.data) {
        const teams = teamsResult.data;
        setCurrentTeam(teams[0]); // Set the first team as current team
        
        const allMembers: TeamMember[] = teams.flatMap((team: any) => 
          team.members?.map((member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role || 'EMPLOYEE',
            department: member.department,
            status: member.isActive ? 'ACTIVE' : 'INACTIVE',
            joinedAt: member.createdAt || new Date().toISOString(),
            currentProjects: Math.floor(Math.random() * 3) + 1, // Mock data - would come from backend
            completedTasks: Math.floor(Math.random() * 50) + 10,
            pendingTasks: Math.floor(Math.random() * 15) + 2,
            productivity: Math.floor(Math.random() * 30) + 70,
            lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          })) || []
        );
        
        setTeamMembers(allMembers);

        // Calculate team stats
        const stats: TeamStats = {
          totalMembers: allMembers.length,
          activeMembers: allMembers.filter(m => m.status === 'ACTIVE').length,
          onLeaveMembers: allMembers.filter(m => m.status === 'ON_LEAVE').length,
          averageProductivity: Math.round(allMembers.reduce((sum, m) => sum + m.productivity, 0) / allMembers.length) || 0,
          totalProjects: projectsResult.success ? (projectsResult.data?.length || 0) : 0,
          completedTasks: allMembers.reduce((sum, m) => sum + m.completedTasks, 0),
          pendingTasks: allMembers.reduce((sum, m) => sum + m.pendingTasks, 0)
        };
        
        setTeamStats(stats);
      } else {
        console.warn('ManagerTeam: No team data available');
        setTeamMembers([]);
        setTeamStats({
          totalMembers: 0,
          activeMembers: 0,
          onLeaveMembers: 0,
          averageProductivity: 0,
          totalProjects: 0,
          completedTasks: 0,
          pendingTasks: 0
        });
      }

    } catch (error: any) {
      console.error('ManagerTeam: Failed to load team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter team members based on search
  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Define table columns
  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{member.name}</div>
              <div className="text-sm text-muted-foreground">{member.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => (
        <Badge variant="outline">{getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <span>{row.original.department?.name || 'Not assigned'}</span>
      ),
    },
    createStatusColumn<TeamMember>("status", "Status", {
      ACTIVE: { label: "Active", variant: "default" },
      INACTIVE: { label: "Inactive", variant: "secondary" },
      ON_LEAVE: { label: "On Leave", variant: "outline" },
    }),
    {
      accessorKey: "currentProjects",
      header: "Projects",
      cell: ({ getValue }) => (
        <div className="text-center">{getValue() as number}</div>
      ),
    },
    {
      accessorKey: "completedTasks",
      header: "Completed",
      cell: ({ getValue }) => (
        <div className="text-center text-green-600 font-medium">{getValue() as number}</div>
      ),
    },
    {
      accessorKey: "pendingTasks",
      header: "Pending",
      cell: ({ getValue }) => (
        <div className="text-center text-orange-600 font-medium">{getValue() as number}</div>
      ),
    },
    {
      accessorKey: "productivity",
      header: "Productivity",
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  value >= 90 ? 'bg-green-500' :
                  value >= 70 ? 'bg-blue-500' :
                  value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-sm font-medium">{value}%</span>
          </div>
        );
      },
    },
    createActionsColumn<TeamMember>([
      {
        label: "View Details",
        onClick: (member) => {
          toast({
            title: "Member Details",
            description: `Viewing details for ${member.name}`,
          });
        },
      },
      {
        label: "Assign Task",
        onClick: (member) => {
          toast({
            title: "Assign Task",
            description: `Assigning task to ${member.name}`,
          });
        },
      },
    ]),
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
              <p className="text-muted-foreground">
                Manage your team members, track performance, and assign tasks
              </p>
            </div>
            <Button className="gap-2" onClick={() => setShowAddMemberDialog(true)}>
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </motion.div>

        {/* Team Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{teamStats?.totalMembers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {teamStats?.activeMembers || 0} active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Productivity</p>
                  <p className="text-2xl font-bold">{teamStats?.averageProductivity || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-blue-600">
                  Team performance metric
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                  <p className="text-2xl font-bold text-green-600">{teamStats?.completedTasks || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600">
                  {teamStats?.pendingTasks || 0} pending
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{teamStats?.totalProjects || 0}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-blue-600">
                  Across all teams
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Team Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredMembers}
              searchKey="name"
              searchPlaceholder="Search members..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Add Member Dialog */}
        <AddMemberDialog
          open={showAddMemberDialog}
          onOpenChange={setShowAddMemberDialog}
          onMemberAdded={(member) => {
            const newTeamMember: TeamMember = {
              ...member,
              joinedAt: new Date().toISOString(),
              status: 'ACTIVE' as const,
              currentProjects: 0,
              completedTasks: 0,
              pendingTasks: 0,
              productivity: 75,
              lastActive: new Date().toISOString()
            };
            setTeamMembers(prev => [...prev, newTeamMember]);
            toast({
              title: "Success",
              description: `${member.name} has been added to the team.`,
            });
          }}
        />
      </div>
    </DashboardLayout>
  );
}