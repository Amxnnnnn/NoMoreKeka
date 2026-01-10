import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  MessageSquare, 
  Plus, 
  Search,
  Settings
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { teamService, Team } from "@/services/team.service";
import { 
  TeamDirectory,
  TeamCalendar,
  TeamMetrics,
  TeamCommunication,
  CreateTeamDialog
} from "@/components/team";
import { TeamWorkloadAnalysis } from "@/components/team/TeamWorkloadAnalysis";
import { TeamPerformanceEvaluation } from "@/components/team/TeamPerformanceEvaluation";
import { EmptyState } from "@/components/EmptyState";

export default function TeamManagement() {
  const { toast } = useToast();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("directory");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const result = await teamService.getMyTeams();
      setTeams(result.data || []);
      
      // Auto-select first team if available
      if (result.data && result.data.length > 0) {
        setSelectedTeam(result.data[0]);
      }
    } catch (error: any) {
      console.error('Failed to fetch teams:', error);
      toast({
        variant: "destructive",
        title: "Failed to load teams",
        description: error.message || "Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamCreated = (newTeam: Team) => {
    setTeams(prev => [newTeam, ...prev]);
    setSelectedTeam(newTeam);
    setShowCreateDialog(false);
    toast({
      title: "Team created successfully",
      description: `${newTeam.name} has been created and you are now managing it.`,
    });
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
            <div className="lg:col-span-3">
              <div className="h-96 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your teams, view performance metrics, and coordinate activities.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </motion.div>

        {teams.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No teams found"
            description="You don't have any teams yet. Create your first team to get started with team management."
            actionLabel="Create Team"
            onAction={() => setShowCreateDialog(true)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Team Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Teams</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {filteredTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-accent ${
                          selectedTeam?.id === team.id ? 'bg-accent border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium truncate">{team.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {team._count.members}
                          </Badge>
                        </div>
                        {team.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {team.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{team._count.members} members</span>
                          <span>•</span>
                          <span>{team._count.projects} projects</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-3"
            >
              {selectedTeam ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedTeam.name}</CardTitle>
                        {selectedTeam.description && (
                          <p className="text-muted-foreground mt-1">{selectedTeam.description}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="directory" className="gap-2">
                          <Users className="w-4 h-4" />
                          Directory
                        </TabsTrigger>
                        <TabsTrigger value="workload" className="gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Workload
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Performance
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="gap-2">
                          <Calendar className="w-4 h-4" />
                          Calendar
                        </TabsTrigger>
                        <TabsTrigger value="metrics" className="gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Metrics
                        </TabsTrigger>
                        <TabsTrigger value="communication" className="gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Communication
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="directory" className="mt-6">
                        <TeamDirectory team={selectedTeam} />
                      </TabsContent>

                      <TabsContent value="workload" className="mt-6">
                        <TeamWorkloadAnalysis teamId={selectedTeam.id} />
                      </TabsContent>

                      <TabsContent value="performance" className="mt-6">
                        <TeamPerformanceEvaluation teamId={selectedTeam.id} />
                      </TabsContent>

                      <TabsContent value="calendar" className="mt-6">
                        <TeamCalendar team={selectedTeam} />
                      </TabsContent>

                      <TabsContent value="metrics" className="mt-6">
                        <TeamMetrics team={selectedTeam} />
                      </TabsContent>

                      <TabsContent value="communication" className="mt-6">
                        <TeamCommunication team={selectedTeam} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Select a Team</h3>
                      <p className="text-muted-foreground">
                        Choose a team from the sidebar to view its details and manage members.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        )}

        {/* Create Team Dialog */}
        <CreateTeamDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onTeamCreated={handleTeamCreated}
        />
      </div>
    </DashboardLayout>
  );
}