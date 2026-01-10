import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  Calendar,
  MoreHorizontal,
  User,
  Crown,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Team, TeamMember, teamService } from "@/services/team.service";
import { EmptyState } from "@/components/EmptyState";
import { AddMemberDialog, MemberProfileDialog } from ".";

interface TeamDirectoryProps {
  team: Team;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'HR':
      return <Shield className="w-4 h-4 text-blue-500" />;
    case 'MANAGER':
      return <Shield className="w-4 h-4 text-green-500" />;
    default:
      return <User className="w-4 h-4 text-gray-500" />;
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'default';
    case 'HR':
      return 'secondary';
    case 'MANAGER':
      return 'outline';
    default:
      return 'outline';
  }
};

export function TeamDirectory({ team }: TeamDirectoryProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, [team.id]);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const result = await teamService.getTeamMembers(team.id);
      setMembers(result.data || []);
    } catch (error: any) {
      console.error('Failed to fetch team members:', error);
      toast({
        variant: "destructive",
        title: "Failed to load team members",
        description: error.message || "Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await teamService.removeTeamMember(team.id, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast({
        title: "Member removed",
        description: "Team member has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: error.message || "Please try again.",
      });
    }
  };

  const handleMemberAdded = (newMember: TeamMember) => {
    setMembers(prev => [...prev, newMember]);
    setShowAddDialog(false);
    toast({
      title: "Member added",
      description: `${newMember.name} has been added to the team.`,
    });
  };

  const handleViewProfile = (member: TeamMember) => {
    setSelectedMember(member);
    setShowProfileDialog(true);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          <div className="h-10 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            {filteredMembers.length} of {members.length} members
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="EMPLOYEE">Employee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={User}
          title="No members found"
          description={
            members.length === 0 
              ? "This team doesn't have any members yet. Add some members to get started."
              : "No members match your search criteria. Try adjusting your filters."
          }
          actionLabel={members.length === 0 ? "Add Member" : undefined}
          onAction={members.length === 0 ? () => setShowAddDialog(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{member.name}</h4>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-destructive"
                        >
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                        <span className="mr-1">{getRoleIcon(member.role)}</span>
                        {member.role}
                      </Badge>
                      <Badge 
                        variant={member.isActive ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => handleViewProfile(member)}
                      >
                        <User className="w-3 h-3 mr-1" />
                        Profile
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        teamId={team.id}
        onMemberAdded={handleMemberAdded}
      />

      {/* Member Profile Dialog */}
      {selectedMember && (
        <MemberProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          member={selectedMember}
          team={team}
        />
      )}
    </div>
  );
}