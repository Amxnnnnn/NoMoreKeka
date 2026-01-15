import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Users, 
  UserPlus, 
  Search, 
  Building2,
  Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable, createSelectColumn, createActionsColumn, createStatusColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserRole, User } from "@/stores/authStore";
import { getAllUsers, updateUser, deactivateUser } from "@/services/user.service";
import { getAllDepartments, Department } from "@/services/department.service";
import { UserProfileDialog } from "@/components/admin/UserProfileDialog";
import { BulkUserActionsDialog } from "@/components/admin/BulkUserActionsDialog";
import { UserInviteDialog } from "@/components/admin/UserInviteDialog";
import { UserDetailCard } from "@/components/admin/UserDetailCard";

interface ExtendedUser extends User {
  status: "active" | "inactive" | "invited";
  lastLogin?: string;
  department?: Department;
  projectCount?: number;
  leaveBalance?: number;
}

const roleOptions = [
  { label: "All Roles", value: "all" },
  { label: "Admin", value: "ADMIN" },
  { label: "HR", value: "HR" },
  { label: "Manager", value: "MANAGER" },
  { label: "Employee", value: "EMPLOYEE" },
];

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Invited", value: "invited" },
];

const statusConfig = {
  active: { label: "Active", variant: "default" as const },
  inactive: { label: "Inactive", variant: "secondary" as const },
  invited: { label: "Invited", variant: "outline" as const },
};

export default function UserManagement() {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<ExtendedUser[]>([]);
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<ExtendedUser | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch departments
        const departmentsResult = await getAllDepartments();
        const departmentsMap = new Map(
          departmentsResult.departments?.map(dept => [dept.id, dept]) || []
        );
        setDepartments(departmentsResult.departments || []);
        
        // Fetch users
        const usersResult = await getAllUsers();
        const transformedUsers: ExtendedUser[] = usersResult.users.map((user: any) => ({
          ...user,
          status: user.isActive ? "active" : "inactive" as const,
          lastLogin: user.lastLogin || undefined,
          department: user.departmentId ? departmentsMap.get(user.departmentId) : undefined,
          projectCount: Math.floor(Math.random() * 5), // Mock data
          leaveBalance: Math.floor(Math.random() * 20) + 5, // Mock data
        }));
        
        setUsers(transformedUsers);
        
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: "destructive",
          title: "Failed to load users",
          description: error.message || "Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesDepartment = departmentFilter === "all" || user.department?.id === departmentFilter;
      
      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [users, searchQuery, roleFilter, statusFilter, departmentFilter]);

  // Handle user actions
  const handleViewUserDetail = (user: ExtendedUser) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleEditUser = (user: ExtendedUser) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const handleDeactivateUser = (user: ExtendedUser) => {
    setUserToDeactivate(user);
    setShowDeactivateDialog(true);
  };

  const confirmDeactivateUser = async () => {
    if (!userToDeactivate) return;
    
    try {
      await deactivateUser(userToDeactivate.id);
      setUsers(prev => prev.map(u => 
        u.id === userToDeactivate.id 
          ? { ...u, status: "inactive" as const, isActive: false }
          : u
      ));
      
      toast({
        title: "User deactivated",
        description: `${userToDeactivate.name} has been deactivated successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to deactivate user",
        description: error.message || "Please try again.",
      });
    } finally {
      setShowDeactivateDialog(false);
      setUserToDeactivate(null);
    }
  };

  const handleActivateUser = async (user: ExtendedUser) => {
    try {
      await updateUser(user.id, { role: user.role }); // This will reactivate the user
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, status: "active" as const, isActive: true }
          : u
      ));
      
      toast({
        title: "User activated",
        description: `${user.name} has been activated successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to activate user",
        description: error.message || "Please try again.",
      });
    }
  };

  const handleBulkActions = () => {
    setShowBulkActions(true);
  };

  const handleExportUsers = () => {
    const csvContent = [
      ["Name", "Email", "Role", "Department", "Status", "Last Login"].join(","),
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.role,
        user.department?.name || "No Department",
        user.status,
        user.lastLogin || "Never"
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Table columns
  const columns: ColumnDef<ExtendedUser>[] = [
    createSelectColumn<ExtendedUser>(),
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => {
        const role = getValue() as UserRole;
        const variants = {
          ADMIN: "destructive",
          HR: "default",
          MANAGER: "secondary",
          EMPLOYEE: "outline",
        } as const;
        return <Badge variant={variants[role]}>{role}</Badge>;
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ getValue }) => {
        const department = getValue() as Department | undefined;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span>{department?.name || "No Department"}</span>
          </div>
        );
      },
    },
    createStatusColumn<ExtendedUser>("status", "Status", statusConfig),
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ getValue }) => {
        const lastLogin = getValue() as string | undefined;
        if (!lastLogin) return <span className="text-muted-foreground">Never</span>;
        return <span>{new Date(lastLogin).toLocaleDateString()}</span>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return <span>{new Date(date).toLocaleDateString()}</span>;
      },
    },
    createActionsColumn<ExtendedUser>([
      {
        label: "View Details",
        onClick: handleViewUserDetail,
      },
      {
        label: "Edit Profile",
        onClick: handleEditUser,
      },
      {
        label: "Send Email",
        onClick: (user) => {
          window.location.href = `mailto:${user.email}`;
        },
      },
      {
        label: "Deactivate",
        onClick: (user) => {
          if (user.status === "active") {
            handleDeactivateUser(user);
          } else {
            handleActivateUser(user);
          }
        },
        variant: "destructive",
      },
    ]),
  ];

  const departmentOptions = [
    { label: "All Departments", value: "all" },
    ...departments.map(dept => ({ label: dept.name, value: dept.id })),
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions ({filteredUsers.length} users).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportUsers} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invite User
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="enterprise-card p-4"
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
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="enterprise-card p-4 bg-primary/5 border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{selectedUsers.length} selected</Badge>
                <span className="text-sm text-muted-foreground">
                  Bulk actions available
                </span>
              </div>
              <Button onClick={handleBulkActions} variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Bulk Actions
              </Button>
            </div>
          </motion.div>
        )}

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="enterprise-card p-6"
        >
          <DataTable
            columns={columns}
            data={filteredUsers}
            loading={isLoading}
            showRowSelection={true}
            searchKey="name"
            searchPlaceholder="Search users..."
            emptyMessage="No users found matching your criteria."
            onRowClick={handleViewUserDetail}
          />
        </motion.div>

        {/* Dialogs */}
        {showUserDetail && selectedUser && (
          <UserDetailCard
            userId={selectedUser.id}
            open={showUserDetail}
            onClose={() => setShowUserDetail(false)}
            onEdit={(userId) => {
              setShowUserDetail(false);
              const user = users.find(u => u.id === userId);
              if (user) {
                setSelectedUser(user);
                setShowUserProfile(true);
              }
            }}
          />
        )}

        {showUserProfile && selectedUser && (
          <UserProfileDialog
            user={selectedUser}
            departments={departments}
            open={showUserProfile}
            onOpenChange={setShowUserProfile}
            onUserUpdated={(updatedUser) => {
              setUsers(prev => prev.map(u => 
                u.id === updatedUser.id ? { ...u, ...updatedUser } : u
              ));
            }}
          />
        )}

        {showBulkActions && (
          <BulkUserActionsDialog
            users={selectedUsers}
            open={showBulkActions}
            onOpenChange={setShowBulkActions}
            onUsersUpdated={(updatedUsers) => {
              setUsers(prev => prev.map(u => {
                const updated = updatedUsers.find(uu => uu.id === u.id);
                return updated ? { ...u, ...updated, department: u.department } : u;
              }));
              setSelectedUsers([]);
            }}
          />
        )}

        {showInviteDialog && (
          <UserInviteDialog
            departments={departments}
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            onUserInvited={(invitation) => {
              // Add invited user to the list
              const newUser: ExtendedUser = {
                id: invitation.id,
                name: invitation.name,
                email: invitation.email,
                role: invitation.role,
                isActive: false,
                isEmailVerified: false,
                companyId: invitation.companyId || "",
                status: "invited",
                createdAt: invitation.createdAt,
                updatedAt: invitation.createdAt,
                department: departments.find(d => d.id === invitation.departmentId),
              };
              setUsers(prev => [newUser, ...prev]);
            }}
          />
        )}

        {/* Deactivate Confirmation Dialog */}
        <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate User</DialogTitle>
              <DialogDescription>
                Are you sure you want to deactivate {userToDeactivate?.name}? 
                They will lose access to the system but their data will be preserved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeactivateUser}>
                Deactivate User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}