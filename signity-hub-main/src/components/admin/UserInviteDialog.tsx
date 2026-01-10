import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Building2, 
  Loader2,
  Send,
  X,
  Upload,
  FileText
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/stores/authStore";
import { sendInvitation, Invitation } from "@/services/invitation.service";
import { Department } from "@/services/department.service";

interface UserInviteDialogProps {
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInvited: (invitation: Invitation) => void;
}

const singleInviteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"], {
    required_error: "Please select a role",
  }),
  departmentId: z.string().optional(),
  message: z.string().optional(),
});

const bulkInviteSchema = z.object({
  emails: z.string().min(1, "Please enter at least one email address"),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"], {
    required_error: "Please select a role",
  }),
  departmentId: z.string().optional(),
  message: z.string().optional(),
});

type SingleInviteFormData = z.infer<typeof singleInviteSchema>;
type BulkInviteFormData = z.infer<typeof bulkInviteSchema>;

export function UserInviteDialog({
  departments,
  open,
  onOpenChange,
  onUserInvited,
}: UserInviteDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  const singleForm = useForm<SingleInviteFormData>({
    resolver: zodResolver(singleInviteSchema),
    defaultValues: {
      name: "",
      email: "",
      role: undefined,
      departmentId: "",
      message: "",
    },
  });

  const bulkForm = useForm<BulkInviteFormData>({
    resolver: zodResolver(bulkInviteSchema),
    defaultValues: {
      emails: "",
      role: undefined,
      departmentId: "",
      message: "",
    },
  });

  const onSingleSubmit = async (data: SingleInviteFormData) => {
    setIsLoading(true);

    try {
      const invitationData = {
        email: data.email,
        name: data.name,
        role: data.role,
        departmentId: data.departmentId || undefined,
        message: data.message || undefined,
      };

      const result = await sendInvitation(invitationData);
      
      if (result.success && result.invitation) {
        onUserInvited(result.invitation);
        onOpenChange(false);
        
        toast({
          title: "Invitation sent",
          description: `Successfully sent invitation to ${data.email}`,
        });

        singleForm.reset();
      }
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to send invitation",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onBulkSubmit = async (data: BulkInviteFormData) => {
    setIsLoading(true);

    try {
      // Parse emails from textarea (one per line or comma-separated)
      const emailList = data.emails
        .split(/[\n,]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (emailList.length === 0) {
        throw new Error("No valid email addresses found");
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Send invitations one by one
      for (const email of emailList) {
        try {
          // Generate a name from email if not provided
          const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          const invitationData = {
            email,
            name,
            role: data.role,
            departmentId: data.departmentId || undefined,
            message: data.message || undefined,
          };

          const result = await sendInvitation(invitationData);
          
          if (result.success && result.invitation) {
            onUserInvited(result.invitation);
            successCount++;
          }
        } catch (error: any) {
          failedCount++;
          errors.push(`${email}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Bulk invitations sent",
          description: `Successfully sent ${successCount} invitation(s).${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
        });
      }

      if (failedCount > 0) {
        toast({
          variant: "destructive",
          title: "Some invitations failed",
          description: `${failedCount} invitation(s) failed to send. Check the details.`,
        });
      }

      if (failedCount === 0) {
        onOpenChange(false);
        bulkForm.reset();
      }
    } catch (error: any) {
      console.error('Failed to send bulk invitations:', error);
      toast({
        variant: "destructive",
        title: "Failed to send invitations",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Simple CSV parsing - assumes email is in first column
      const lines = content.split('\n');
      const emails = lines
        .map(line => {
          const columns = line.split(',');
          return columns[0]?.trim();
        })
        .filter(email => email && email.includes('@'))
        .join('\n');
      
      bulkForm.setValue('emails', emails);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            Invite Users
          </DialogTitle>
          <DialogDescription>
            Send invitations to new team members to join your organization.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Invite</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Invite</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <Form {...singleForm}>
              <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={singleForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={singleForm.control}
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
                    control={singleForm.control}
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
                    control={singleForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department (Optional)</FormLabel>
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

                <FormField
                  control={singleForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a personal message to the invitation..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Form {...bulkForm}>
              <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
                <FormField
                  control={bulkForm.control}
                  name="emails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Addresses</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Enter email addresses (one per line or comma-separated)&#10;john@company.com&#10;jane@company.com&#10;mike@company.com"
                            className="resize-none min-h-[120px]"
                            {...field}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => document.getElementById('csv-upload')?.click()}
                            >
                              <Upload className="w-4 h-4" />
                              Upload CSV
                            </Button>
                            <input
                              id="csv-upload"
                              type="file"
                              accept=".csv,.txt"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                            <span className="text-sm text-muted-foreground">
                              Or upload a CSV file with email addresses
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={bulkForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role (for all invites)</FormLabel>
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
                    control={bulkForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department (Optional)</FormLabel>
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

                <FormField
                  control={bulkForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a personal message to all invitations..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={activeTab === "single" 
              ? singleForm.handleSubmit(onSingleSubmit)
              : bulkForm.handleSubmit(onBulkSubmit)
            } 
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send {activeTab === "bulk" ? "Invitations" : "Invitation"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}