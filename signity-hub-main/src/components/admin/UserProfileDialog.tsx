import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  Calendar, 
  Loader2,
  Save,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/stores/authStore";
import { updateUser } from "@/services/user.service";
import { Department } from "@/services/department.service";

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  status: "active" | "inactive" | "invited";
  lastLogin?: string;
  department?: Department;
  projectCount?: number;
  leaveBalance?: number;
  createdAt: string;
  updatedAt: string;
}

interface UserProfileDialogProps {
  user: ExtendedUser;
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: ExtendedUser) => void;
}

const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"], {
    required_error: "Please select a role",
  }),
  departmentId: z.string().optional(),
});

type UserUpdateFormData = z.infer<typeof userUpdateSchema>;

export function UserProfileDialog({
  user,
  departments,
  open,
  onOpenChange,
  onUserUpdated,
}: UserProfileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.department?.id || "",
    },
  });

  const onSubmit = async (data: UserUpdateFormData) => {
    setIsLoading(true);

    try {
      const updateData = {
        name: data.name,
        email: data.email,
        role: data.role,
        departmentId: data.departmentId || undefined,
      };

      const result = await updateUser(user.id, updateData);
      
      if (result.success) {
        const updatedUser: ExtendedUser = {
          ...user,
          ...result.user,
          department: data.departmentId 
            ? departments.find(d => d.id === data.departmentId)
            : undefined,
        };
        
        onUserUpdated(updatedUser);
        onOpenChange(false);
        
        toast({
          title: "User updated",
          description: `${data.name}'s profile has been updated successfully.`,
        });
      }
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleVariant = (role: UserRole) => {
    const variants = {
      ADMIN: "destructive",
      HR: "default",
      MANAGER: "secondary",
      EMPLOYEE: "outline",
    } as const;
    return variants[role];
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      invited: "outline",
    } as const;
    return variants[status as keyof typeof variants] || "outline";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            User Profile
          </DialogTitle>
          <DialogDescription>
            View and edit user information, role, and department assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Summary */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                  <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
              {user.lastLogin && (
                <p>Last login: {new Date(user.lastLogin).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{user.projectCount || 0}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{user.leaveBalance || 0}</div>
              <div className="text-sm text-muted-foreground">Leave Days</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {user.department ? 1 : 0}
              </div>
              <div className="text-sm text-muted-foreground">Department</div>
            </div>
          </div>

          <Separator />

          {/* Edit Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="John Doe" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="john@company.com" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <Shield className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <Building2 className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Department</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}