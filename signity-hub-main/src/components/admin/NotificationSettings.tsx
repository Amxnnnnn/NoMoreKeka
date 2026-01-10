import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Bell, 
  Save,
  Loader2,
  Mail,
  MessageSquare,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Users,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

const notificationSettingsSchema = z.object({
  // Email Settings
  emailEnabled: z.boolean(),
  emailHost: z.string().optional(),
  emailPort: z.number().optional(),
  emailUsername: z.string().optional(),
  emailPassword: z.string().optional(),
  emailFromAddress: z.string().email().optional(),
  emailFromName: z.string().optional(),
  
  // SMS Settings
  smsEnabled: z.boolean(),
  smsProvider: z.string().optional(),
  smsApiKey: z.string().optional(),
  smsFromNumber: z.string().optional(),
  
  // Push Notification Settings
  pushEnabled: z.boolean(),
  pushApiKey: z.string().optional(),
  
  // Notification Types
  leaveRequestNotifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    recipients: z.array(z.string()),
  }),
  leaveApprovalNotifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    recipients: z.array(z.string()),
  }),
  worklogReminderNotifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    recipients: z.array(z.string()),
    schedule: z.string(),
  }),
  systemAlertNotifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    recipients: z.array(z.string()),
  }),
  
  // Timing Settings
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  weekendNotifications: z.boolean(),
  
  // Templates
  emailTemplates: z.object({
    leaveRequest: z.string().optional(),
    leaveApproval: z.string().optional(),
    worklogReminder: z.string().optional(),
    systemAlert: z.string().optional(),
  }),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

// Mock data - replace with actual API calls
const mockSettings: NotificationSettingsFormData = {
  emailEnabled: true,
  emailHost: "smtp.gmail.com",
  emailPort: 587,
  emailUsername: "notifications@signity.com",
  emailPassword: "",
  emailFromAddress: "notifications@signity.com",
  emailFromName: "Signity HRMS",
  
  smsEnabled: false,
  smsProvider: "twilio",
  smsApiKey: "",
  smsFromNumber: "",
  
  pushEnabled: true,
  pushApiKey: "",
  
  leaveRequestNotifications: {
    email: true,
    sms: false,
    push: true,
    recipients: ["managers", "hr"],
  },
  leaveApprovalNotifications: {
    email: true,
    sms: false,
    push: true,
    recipients: ["employee"],
  },
  worklogReminderNotifications: {
    email: true,
    sms: false,
    push: true,
    recipients: ["employees"],
    schedule: "daily",
  },
  systemAlertNotifications: {
    email: true,
    sms: true,
    push: true,
    recipients: ["admins"],
  },
  
  quietHoursEnabled: true,
  quietHoursStart: "18:00",
  quietHoursEnd: "08:00",
  weekendNotifications: false,
  
  emailTemplates: {
    leaveRequest: "A new leave request has been submitted by {{employee_name}} for {{leave_dates}}.",
    leaveApproval: "Your leave request for {{leave_dates}} has been {{status}}.",
    worklogReminder: "Don't forget to submit your work log for {{date}}.",
    systemAlert: "System Alert: {{alert_message}}",
  },
};

const recipientOptions = [
  { value: "employees", label: "All Employees" },
  { value: "managers", label: "Managers" },
  { value: "hr", label: "HR Team" },
  { value: "admins", label: "Administrators" },
];

const scheduleOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const smsProviders = [
  { value: "twilio", label: "Twilio" },
  { value: "aws-sns", label: "AWS SNS" },
  { value: "nexmo", label: "Nexmo" },
];

export function NotificationSettings({ onUnsavedChanges }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  const form = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: mockSettings,
  });

  // Handle form changes for unsaved changes tracking
  useEffect(() => {
    const subscription = form.watch(() => {
      onUnsavedChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form, onUnsavedChanges]);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // Mock API call - replace with actual implementation
        await new Promise(resolve => setTimeout(resolve, 1000));
        form.reset(mockSettings);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to load notification settings",
          description: error.message || "Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [form, toast]);

  const onSubmit = async (data: NotificationSettingsFormData) => {
    setIsSaving(true);

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Notification settings saved",
        description: "Notification preferences have been updated successfully.",
      });
      
      onUnsavedChanges(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save notification settings",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailConfiguration = async () => {
    setTestingEmail(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Test email sent",
        description: "Check your inbox for the test email.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send test email",
        description: error.message || "Please check your email configuration.",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const testSmsConfiguration = async () => {
    setTestingSms(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Test SMS sent",
        description: "Check your phone for the test SMS.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send test SMS",
        description: error.message || "Please check your SMS configuration.",
      });
    } finally {
      setTestingSms(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                <div className="h-4 bg-muted rounded w-48 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-10 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Notification Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure notification channels, recipients, and templates.
          </p>
        </div>
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={isSaving || !form.formState.isDirty}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="emailEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Enable Email Notifications</FormLabel>
                        <FormDescription>
                          Send notifications via email
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("emailEnabled") && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emailHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input placeholder="smtp.gmail.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emailPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Port</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="587" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="emailUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="notifications@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emailFromAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Address</FormLabel>
                            <FormControl>
                              <Input placeholder="noreply@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emailFromName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Company HRMS" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={testEmailConfiguration}
                      disabled={testingEmail}
                      className="w-full gap-2"
                    >
                      {testingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending Test Email...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Test Email
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* SMS Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  SMS Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMS provider for text notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="smsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Enable SMS Notifications</FormLabel>
                        <FormDescription>
                          Send notifications via SMS
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("smsEnabled") && (
                  <>
                    <FormField
                      control={form.control}
                      name="smsProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMS Provider</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {smsProviders.map((provider) => (
                                <SelectItem key={provider.value} value={provider.value}>
                                  {provider.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smsApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smsFromNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={testSmsConfiguration}
                      disabled={testingSms}
                      className="w-full gap-2"
                    >
                      {testingSms ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending Test SMS...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Send Test SMS
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Types
              </CardTitle>
              <CardDescription>
                Configure which notifications to send and to whom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Leave Request Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <h4 className="font-medium">Leave Request Notifications</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-6">
                    <FormField
                      control={form.control}
                      name="leaveRequestNotifications.email"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Email</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="leaveRequestNotifications.sms"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">SMS</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="leaveRequestNotifications.push"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Push</FormLabel>
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-wrap gap-1">
                      {form.watch("leaveRequestNotifications.recipients").map((recipient) => (
                        <Badge key={recipient} variant="secondary">
                          {recipientOptions.find(r => r.value === recipient)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* System Alert Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="font-medium">System Alert Notifications</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-6">
                    <FormField
                      control={form.control}
                      name="systemAlertNotifications.email"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Email</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemAlertNotifications.sms"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">SMS</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemAlertNotifications.push"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Push</FormLabel>
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-wrap gap-1">
                      {form.watch("systemAlertNotifications.recipients").map((recipient) => (
                        <Badge key={recipient} variant="secondary">
                          {recipientOptions.find(r => r.value === recipient)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timing Settings
              </CardTitle>
              <CardDescription>
                Configure when notifications should be sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="quietHoursEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Quiet Hours</FormLabel>
                      <FormDescription>
                        Suppress notifications during specified hours
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("quietHoursEnabled") && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quietHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiet Hours Start</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quietHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiet Hours End</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="weekendNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Weekend Notifications</FormLabel>
                      <FormDescription>
                        Send notifications on weekends
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}