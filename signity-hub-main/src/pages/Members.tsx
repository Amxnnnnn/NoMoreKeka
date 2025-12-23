import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, UserPlus, ChevronDown, ChevronRight, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MemberCard } from "@/components/MemberCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole, User } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { getAllUsers, getUsersByRole } from "@/services/user.service";
import { getAllDepartments, Department } from "@/services/department.service";

interface Member extends User {
  status: "active" | "invited" | "inactive";
  projectCount?: number;
  department?: {
    id: string;
    name: string;
  };
}

const roleGroups: { role: UserRole; label: string }[] = [
  { role: "ADMIN", label: "Administrators" },
  { role: "HR", label: "Human Resources" },
  { role: "MANAGER", label: "Managers" },
  { role: "EMPLOYEE", label: "Employees" },
];

export default function Members() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<UserRole>>(new Set(["ADMIN", "HR", "EMPLOYEE"]));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch departments first
        const departmentsResult = await getAllDepartments();
        const departmentsMap = new Map(
          departmentsResult.departments?.map(dept => [dept.id, dept]) || []
        );
        setDepartments(departmentsResult.departments || []);
        
        // Fetch members
        let result: any;
        if (roleFilter === "all") {
          result = await getAllUsers();
        } else {
          result = await getUsersByRole(roleFilter as UserRole);
        }
        
        // Transform users to members format with department info
        const transformedMembers: Member[] = result.users.map((user: any) => ({
          ...user,
          status: user.isActive ? "active" : "inactive" as const,
          projectCount: Math.floor(Math.random() * 5), // Mock project count for now
          department: user.departmentId ? departmentsMap.get(user.departmentId) : undefined
        }));
        
        setMembers(transformedMembers);
        
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: "destructive",
          title: "Failed to load members",
          description: error.message || "Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [roleFilter, toast]);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleGroup = (role: UserRole) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const getMembersByRole = (role: UserRole) => filteredMembers.filter((m) => m.role === role);

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </div>
          <div className="enterprise-card p-4 mb-6">
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="enterprise-card p-4">
                <div className="h-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Members</h1>
            <p className="text-muted-foreground">
              Manage and view all organization members ({filteredMembers.length} total).
            </p>
          </div>
          <Button onClick={() => navigate("/invite")} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="enterprise-card p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Members List */}
        {filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members found"
            description={
              members.length === 0 
                ? "No members have joined your organization yet. Start by inviting team members."
                : "Try adjusting your search or filter criteria."
            }
            actionLabel={members.length === 0 ? "Invite Members" : undefined}
            onAction={members.length === 0 ? () => navigate("/invite") : undefined}
          />
        ) : (
          <div className="space-y-6">
            {roleGroups.map(({ role, label }) => {
              const roleMembers = getMembersByRole(role);
              if (roleMembers.length === 0) return null;

              const isExpanded = expandedGroups.has(role);

              return (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="enterprise-card overflow-hidden"
                >
                  <button
                    onClick={() => toggleGroup(role)}
                    className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <h2 className="font-semibold text-foreground">{label}</h2>
                      <span className="text-sm text-muted-foreground">
                        ({roleMembers.length})
                      </span>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                          {roleMembers.map((member, index) => (
                            <MemberCard
                              key={member.id}
                              name={member.name}
                              email={member.email}
                              role={member.role}
                              department={member.department?.name || "No Department"}
                              status={member.status}
                              projectCount={member.projectCount}
                              delay={index * 0.05}
                              onClick={() => {
                                // Navigate to member details - implement later
                                console.log('View member details:', member.id);
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
