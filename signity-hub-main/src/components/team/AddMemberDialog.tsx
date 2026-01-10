import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, User, Users, Building2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { teamService, TeamMember } from "@/services/team.service";
import { userService } from "@/services/user.service";
import { departmentService } from "@/services/department.service";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId?: string; // Make optional to allow team selection
  teamName?: string;
  projectId?: string;
  projectName?: string;
  onMemberAdded: (member: TeamMember) => void;
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
}

export function AddMemberDialog({ 
  open, 
  onOpenChange, 
  teamId, 
  teamName,
  projectId,
  projectName,
  onMemberAdded 
}: AddMemberDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId || "");
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    if (open) {
      fetchInitialData();
    } else {
      // Reset state when dialog closes
      setSelectedUsers([]);
      setSearchQuery("");
      setSelectedDepartment("all");
      setSelectedRole("all");
      setSelectedTeamId(teamId || "");
      setActiveTab("available");
    }
  }, [open, teamId]);

  const fetchInitialData = async () => {
    try {
      setIsFetching(true);
      
      // Fetch departments and teams in parallel
      const [departmentsResult, teamsResult] = await Promise.all([
        departmentService.getDepartments(),
        teamService.getMyTeams()
      ]);

      if (departmentsResult.success) {
        setDepartments(departmentsResult.data || []);
      }

      if (teamsResult.success) {
        const teamsData = teamsResult.data || [];
        setTeams(teamsData.map((team: any) => ({
          id: team.id,
          name: team.name,
          description: team.description,
          memberCount: team._count?.members || team.members?.length || 0
        })));
      }

      // Only fetch users if we have a team selected
      if (selectedTeamId) {
        await fetchUsersForTeam(selectedTeamId);
      }
    } catch (error: any) {
      console.error('Failed to fetch initial data:', error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const fetchUsersForTeam = async (teamIdToUse: string) => {
    if (!teamIdToUse) return;
    
    try {
      setIsFetching(true);
      const result = await userService.getAvailableUsersForTeam(
        teamIdToUse, 
        selectedDepartment !== "all" ? selectedDepartment : undefined
      );
      
      if (result.success) {
        setAvailableUsers(result.data || []);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load users",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleTeamSelection = async (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    setSelectedUsers([]); // Clear selected users when changing teams
    if (newTeamId) {
      await fetchUsersForTeam(newTeamId);
    } else {
      setAvailableUsers([]);
    }
  };

  const handleDepartmentFilter = async (departmentId: string) => {
    setSelectedDepartment(departmentId);
    if (selectedTeamId) {
      await fetchUsersForTeam(selectedTeamId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeamId) {
      toast({
        variant: "destructive",
        title: "No team selected",
        description: "Please select a team first.",
      });
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "No users selected",
        description: "Please select at least one user to add to the team.",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Add members to team
      const result = await teamService.addTeamMembers(selectedTeamId, selectedUsers);
      
      if (result.success) {
        // Notify parent component about added members
        selectedUsers.forEach(userId => {
          const user = availableUsers.find(u => u.id === userId);
          if (user) {
            const newMember: TeamMember = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              department: user.department
            };
            onMemberAdded(newMember);
          }
        });
        
        setSelectedUsers([]);
        onOpenChange(false);
        
        const selectedTeam = teams.find(t => t.id === selectedTeamId);
        toast({
          title: "Members added successfully",
          description: `${selectedUsers.length} member(s) have been added to ${selectedTeam?.name || 'the team'}.`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to add members",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedRole("all");
    if (selectedTeamId) {
      handleDepartmentFilter("all");
    }
  };

  // Filter users based on search and role
  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Group users by department for better organization
  const usersByDepartment = filteredUsers.reduce((acc, user) => {
    const deptName = user.department?.name || 'No Department';
    if (!acc[deptName]) {
      acc[deptName] = [];
    }
    acc[deptName].push(user);
    return acc;
  }, {} as Record<string, AvailableUser[]>);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'default';
      case 'EMPLOYEE': return 'secondary';
      case 'HR': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Team Members
          </DialogTitle>
          <DialogDescription>
            Select a team and add existing employees to it
            {projectName && (
              <span> for project <strong>{projectName}</strong></span>
            )}. Choose from available employees organized by department.
          </DialogDescription>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Team Selection */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <Label htmlFor="team-select">Select Team</Label>
            <Select value={selectedTeamId} onValueChange={handleTeamSelection}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a team to add members to..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{team.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {team.memberCount} members
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedTeamId && (
              <p className="text-sm text-muted-foreground mt-1">
                Please select a team to view available employees
              </p>
            )}
          </div>

          {/* Filters - Only show if team is selected */}
          {selectedTeamId && (
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Search Employees</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[150px]">
                <Label>Department</Label>
                <Select value={selectedDepartment} onValueChange={handleDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Results Summary - Only show if team is selected */}
          {selectedTeamId && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredUsers.length} employee(s) available
                {selectedUsers.length > 0 && (
                  <span className="ml-2 font-medium text-foreground">
                    • {selectedUsers.length} selected
                  </span>
                )}
              </div>
              
              {filteredUsers.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          )}

          {/* User List - Only show if team is selected */}
          {selectedTeamId ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="available">Available ({filteredUsers.length})</TabsTrigger>
                <TabsTrigger value="by-department">By Department</TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="mt-4">
                {isFetching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading employees...</span>
                  </div>
                ) : (
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-2 space-y-2">
                      {filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No available employees found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => handleUserToggle(user.id)}
                          >
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleUserToggle(user.id)}
                            />
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                              <AvatarFallback className="text-sm">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              {user.team && (
                                <p className="text-xs text-blue-600">Currently in: {user.team.name}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                {user.role}
                              </Badge>
                              {user.department && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {user.department.name}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="by-department" className="mt-4">
                <ScrollArea className="h-64 border rounded-md">
                  <div className="p-2 space-y-4">
                    {Object.entries(usersByDepartment).map(([deptName, users]) => (
                      <div key={deptName}>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium text-sm">{deptName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {users.length}
                          </Badge>
                        </div>
                        <div className="space-y-2 ml-6">
                          {users.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                              onClick={() => handleUserToggle(user.id)}
                            >
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleUserToggle(user.id)}
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                                <AvatarFallback className="text-xs">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                              <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                {user.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {Object.keys(usersByDepartment).indexOf(deptName) < Object.keys(usersByDepartment).length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Please select a team first</p>
              <p className="text-sm">Choose a team from the dropdown above to view available employees</p>
            </div>
          )}
        </motion.div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || selectedUsers.length === 0 || !selectedTeamId}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}Member{selectedUsers.length !== 1 ? 's' : ''}
            {selectedTeamId && teams.find(t => t.id === selectedTeamId) && ` to ${teams.find(t => t.id === selectedTeamId)?.name}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}