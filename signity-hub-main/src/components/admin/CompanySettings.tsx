import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building, 
  Save,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
  Shield,
  AlertTriangle
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
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CompanySettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

const companySettingsSchema = z.object({
  // Company Information
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyDescription: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  
  // Working Hours & Policies
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  workingDays: z.array(z.string()).min(1, "Select at least one working day"),
  timeZone: z.string(),
  
  // Leave Policies
  defaultAnnualLeave: z.number().min(0).max(365),
  defaultSickLeave: z.number().min(0).max(365),
  leaveCarryOver: z.boolean(),
  maxCarryOverDays: z.number().min(0).max(365).optional(),
  
  // Approval Workflows
  leaveApprovalRequired: z.boolean(),
  worklogApprovalRequired: z.boolean(),
  expenseApprovalRequired: z.boolean(),
  
  // Security & Access
  passwordMinLength: z.number().min(6).max(50),
  passwordRequireSpecialChars: z.boolean(),
  sessionTimeout: z.number().min(15).max(1440), // minutes
  twoFactorRequired: z.boolean(),
  
  // Notifications
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

// Mock data - replace with actual API calls
const mockSettings: CompanySettingsFormData = {
  companyName: "Signity Solutions",
  companyDescription: "Leading software development company",
  website: "https://signity.com",
  email: "info@signity.com",
  phone: "+1 (555) 123-4567",
  address: "123 Tech Street, Silicon Valley, CA 94000",
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  timeZone: "America/Los_Angeles",
  defaultAnnualLeave: 20,
  defaultSickLeave: 10,
  leaveCarryOver: true,
  maxCarryOverDays: 5,
  leaveApprovalRequired: true,
  worklogApprovalRequired: false,
  expenseApprovalRequired: true,
  passwordMinLength: 8,
  passwordRequireSpecialChars: true,
  sessionTimeout: 480, // 8 hours
  twoFactorRequired: false,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
};

const weekDays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const timeZones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
];

export function CompanySettings({ onUnsavedChanges }: CompanySettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
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
          title: "Failed to load settings",
          description: error.message || "Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [form, toast]);

  const onSubmit = async (data: CompanySettingsFormData) => {
    setIsSaving(true);

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Settings saved",
        description: "Company settings have been updated successfully.",
      });
      
      onUnsavedChanges(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save settings",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
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
          <h3 className="text-lg font-semibold text-foreground">Company Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure company information, policies, and system preferences.
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
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Signity Solutions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of your company..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://company.com" 
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="email"
                            placeholder="info@company.com" 
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="+1 (555) 123-4567" 
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Textarea 
                            placeholder="123 Business St, City, State 12345"
                            className="resize-none pl-10"
                            rows={2}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Working Hours & Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Working Hours & Schedule
                </CardTitle>
                <CardDescription>
                  Define standard working hours and days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workingHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workingHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workingDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working Days</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          {weekDays.map((day) => (
                            <label key={day.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={field.value.includes(day.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, day.value]);
                                  } else {
                                    field.onChange(field.value.filter(d => d !== day.value));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{day.label}</span>
                            </label>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeZone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Zone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeZones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Leave Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Leave Policies
                </CardTitle>
                <CardDescription>
                  Configure default leave entitlements and policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="defaultAnnualLeave"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Leave (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="20" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultSickLeave"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sick Leave (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="leaveCarryOver"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Allow Leave Carry Over</FormLabel>
                        <FormDescription>
                          Allow unused leave to carry over to next year
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

                {form.watch("leaveCarryOver") && (
                  <FormField
                    control={form.control}
                    name="maxCarryOverDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Carry Over Days</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Access
                </CardTitle>
                <CardDescription>
                  Configure security policies and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="passwordMinLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Password Length</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="6"
                          max="50"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 6)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordRequireSpecialChars"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Require Special Characters</FormLabel>
                        <FormDescription>
                          Passwords must contain special characters
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

                <FormField
                  control={form.control}
                  name="sessionTimeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Timeout (Minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="15"
                          max="1440"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 480)}
                        />
                      </FormControl>
                      <FormDescription>
                        Automatic logout after inactivity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twoFactorRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Require Two-Factor Authentication</FormLabel>
                        <FormDescription>
                          Mandatory 2FA for all users
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
          </div>

          {/* Approval Workflows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Approval Workflows
              </CardTitle>
              <CardDescription>
                Configure which actions require manager approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="leaveApprovalRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Leave Requests</FormLabel>
                        <FormDescription>
                          Require approval for leave applications
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

                <FormField
                  control={form.control}
                  name="worklogApprovalRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Work Logs</FormLabel>
                        <FormDescription>
                          Require approval for work log entries
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

                <FormField
                  control={form.control}
                  name="expenseApprovalRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Expenses</FormLabel>
                        <FormDescription>
                          Require approval for expense claims
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
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}