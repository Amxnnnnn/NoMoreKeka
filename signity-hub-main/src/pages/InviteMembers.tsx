import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, UserPlus, Loader2, Send, CheckCircle2, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { sendInvitation, getAllInvitations, Invitation } from "@/services/invitation.service";
import { getAllDepartments, Department } from "@/services/department.service";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"], {
    required_error: "Please select a role",
  }),
  departmentId: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteMembers() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recentInvites, setRecentInvites] = useState<Invitation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      name: "",
      role: undefined,
      departmentId: "none",
    },
  });

  // Fetch departments and recent invitations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        
        // Fetch departments with error handling
        try {
          const departmentsResult = await getAllDepartments();
          setDepartments(departmentsResult.departments || []);
        } catch (deptError) {
          console.error('Failed to fetch departments:', deptError);
          setDepartments([]);
        }
        
        // Fetch recent invitations with error handling
        try {
          const invitationsResult = await getAllInvitations();
          setRecentInvites(invitationsResult.invitations || []);
        } catch (invError) {
          console.error('Failed to fetch invitations:', invError);
          setRecentInvites([]);
        }
        
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: error.message || "Please try refreshing the page.",
        });
        setDepartments([]);
        setRecentInvites([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [toast]);

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);

    try {
      const invitationData = {
        email: data.email,
        name: data.name,
        role: data.role,
        departmentId: data.departmentId && data.departmentId !== "" ? data.departmentId : undefined,
      };

      const result = await sendInvitation(invitationData);
      
      if (result.success && result.invitation) {
        setRecentInvites((prev) => [result.invitation!, ...prev]);
        
        toast({
          title: "Invitation Sent",
          description: `Successfully sent invitation to ${data.email}`,
        });

        form.reset();
      }
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to send invitation",
        description: error.response?.data?.message || error.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "HR":
        return "default";
      case "MANAGER":
        return "secondary";
      case "EMPLOYEE":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "default";
      case "ACCEPTED":
        return "default";
      case "EXPIRED":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };


  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="enterprise-card p-6">
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
            <div className="enterprise-card p-6">
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Invite Members
          </h1>
          <p className="text-muted-foreground">
            Send invitations to new team members to join your organization.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Invite Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="enterprise-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                New Invitation
              </h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                        />
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
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="colleague@signity.com"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Department (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {dept.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>

          {/* Recent Invites */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="enterprise-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent Invitations
              </h2>
            </div>

            {recentInvites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No invitations sent yet.
                  <br />
                  Your recent invites will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentInvites.slice(0, 10).map((invite, index) => {
                  const department = departments.find(d => d.id === invite.departmentId);
                  
                  return (
                    <motion.div
                      key={invite.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 rounded-lg border border-border/50 bg-muted/20"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {invite.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {invite.email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={getRoleVariant(invite.role) as any}>
                              {invite.role}
                            </Badge>
                            <Badge variant={getStatusVariant(invite.status) as any}>
                              {invite.status}
                            </Badge>
                            {department && (
                              <Badge variant="outline">
                                {department.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTimeAgo(invite.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
