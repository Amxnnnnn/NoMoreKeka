import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Shield, 
  Building2, 
  UserX, 
  UserCheck, 
  Mail,
  Loader2,
  CheckCircle2,
  AlertTriangle
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/stores/authStore";
import { updateUser, deactivateUser } from "@/services/user.service";
import { sendInvitation } from "@/services/invitation.service";

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  status: "active" | "inactive" | "invited";
  department?: { id: string; name: string };
}

interface BulkUserActionsDialogProps {
  users: ExtendedUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUsersUpdated: (users: ExtendedUser[]) => void;
}

const bulkUpdateSchema = z.object({
  action: z.enum(["role", "department", "activate", "deactivate", "resend_invite"]),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]).optional(),
  departmentId: z.string().optional(),
});

type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>;

export function BulkUserActionsDialog({
  users,
  open,
  onOpenChange,
  onUsersUpdated,
}: BulkUserActionsDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });

  const form = useForm<BulkUpdateFormData>({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
      action: "role",
    },
  });

  const watchedAction = form.watch("action");

  const onSubmit = async (data: BulkUpdateFormData) => {
    setIsLoading(true);
    setResults({ success: 0, failed: 0, errors: [] });

    const updatedUsers: ExtendedUser[] = [];
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      for (const user of users) {
        try {
          let updatedUser = { ...user };

          switch (data.action) {
            case "role":
              if (data.role) {
                const result = await updateUser(user.id, { role: data.role });
                updatedUser = { ...updatedUser, role: data.role };
              }
              break;

            case "department":
              const result = await updateUser(user.id, { 
                departmentId: data.departmentId || undefined 
              });
              // Note: We don't have department info here, so we'll let the parent handle it
              break;

            case "activate":
              if (user.status !== "active") {
                await updateUser(user.id, { role: user.role }); // This reactivates
                updatedUser = { ...updatedUser, status: "active", isActive: true };
              }
              break;

            case "deactivate":
              if (user.status === "active") {
                await deactivateUser(user.id);
                updatedUser = { ...updatedUser, status: "inactive", isActive: false };
              }
              break;

            case "resend_invite":
              if (user.status === "invited") {
                await sendInvitation({
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  departmentId: user.department?.id,
                });
              }
              break;
          }

          updatedUsers.push(updatedUser);
          successCount++;
        } catch (error: any) {
          failedCount++;
          errors.push(`${user.name}: ${error.message}`);
        }
      }

      setResults({ success: successCount, failed: failedCount, errors });

      if (successCount > 0) {
        onUsersUpdated(updatedUsers);
        toast({
          title: "Bulk action completed",
          description: `Successfully updated ${successCount} user(s).${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
        });
      }

      if (failedCount === 0) {
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Bulk action failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case "role":
        return "Change the role for all selected users";
      case "department":
        return "Move all selected users to a different department";
      case "activate":
        return "Activate all selected inactive users";
      case "deactivate":
        return "Deactivate all selected active users";
      case "resend_invite":
        return "Resend invitation emails to all invited users";
      default:
        return "";
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
              <Users className="w-5 h-5" />
            </div>
            Bulk User Actions
          </DialogTitle>
          <DialogDescription>
            Perform actions on {users.length} selected user(s).
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="action" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="action">Action</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="action" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an action" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="role">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Change Role
                            </div>
                          </SelectItem>
                          <SelectItem value="department">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              Change Department
                            </div>
                          </SelectItem>
                          <SelectItem value="activate">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4" />
                              Activate Users
                            </div>
                          </SelectItem>
                          <SelectItem value="deactivate">
                            <div className="flex items-center gap-2">
                              <UserX className="w-4 h-4" />
                              Deactivate Users
                            </div>
                          </SelectItem>
                          <SelectItem value="resend_invite">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Resend Invitations
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        {getActionDescription(watchedAction)}
                      </p>
                    </FormItem>
                  )}
                />

                {watchedAction === "role" && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Role</FormLabel>
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
                )}

                {watchedAction === "department" && (
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No Department</SelectItem>
                            {/* Note: We'd need to pass departments as props */}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </form>
            </Form>

            {/* Results */}
            {(results.success > 0 || results.failed > 0) && (
              <div className="space-y-3">
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Results</h4>
                  <div className="flex items-center gap-4">
                    {results.success > 0 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{results.success} successful</span>
                      </div>
                    )}
                    {results.failed > 0 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{results.failed} failed</span>
                      </div>
                    )}
                  </div>
                  {results.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-600">Errors:</p>
                      <div className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                        {results.errors.map((error, index) => (
                          <p key={index}>• {error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Selected Users ({users.length})</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                      <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
                Processing...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Apply Action
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}