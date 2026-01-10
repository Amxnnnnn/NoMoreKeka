import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Loader2,
  Play,
  Pause,
  Mail,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { DataTable, createActionsColumn, createStatusColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  frequency: string;
  schedule: string;
  recipients: string[];
  format: string[];
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  status: "active" | "paused" | "error";
  createdAt: string;
  createdBy: string;
}

interface ReportSchedulerProps {}

const scheduleSchema = z.object({
  name: z.string().min(2, "Schedule name must be at least 2 characters"),
  reportType: z.string().min(1, "Please select a report type"),
  frequency: z.string().min(1, "Please select frequency"),
  schedule: z.string().min(1, "Please specify schedule details"),
  recipients: z.string().min(1, "Please add at least one recipient"),
  format: z.array(z.string()).min(1, "Select at least one format"),
  isActive: z.boolean(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

// Mock data - replace with actual API calls
const mockScheduledReports: ScheduledReport[] = [
  {
    id: "1",
    name: "Weekly Employee Report",
    reportType: "employee-summary",
    frequency: "weekly",
    schedule: "Every Monday at 9:00 AM",
    recipients: ["hr@company.com", "manager@company.com"],
    format: ["PDF", "Excel"],
    isActive: true,
    lastRun: "2024-01-15T09:00:00Z",
    nextRun: "2024-01-22T09:00:00Z",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: "Admin User",
  },
  {
    id: "2",
    name: "Monthly Leave Analytics",
    reportType: "leave-analytics",
    frequency: "monthly",
    schedule: "1st day of month at 8:00 AM",
    recipients: ["hr@company.com"],
    format: ["PDF"],
    isActive: true,
    lastRun: "2024-01-01T08:00:00Z",
    nextRun: "2024-02-01T08:00:00Z",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: "HR Manager",
  },
  {
    id: "3",
    name: "Daily Attendance Report",
    reportType: "attendance-tracking",
    frequency: "daily",
    schedule: "Every day at 6:00 PM",
    recipients: ["operations@company.com"],
    format: ["CSV"],
    isActive: false,
    lastRun: "2024-01-14T18:00:00Z",
    nextRun: "2024-01-16T18:00:00Z",
    status: "paused",
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: "Operations Manager",
  },
];

const reportTypes = [
  { value: "employee-summary", label: "Employee Summary Report" },
  { value: "leave-analytics", label: "Leave Analytics Report" },
  { value: "attendance-tracking", label: "Attendance Tracking Report" },
  { value: "department-performance", label: "Department Performance Report" },
  { value: "payroll-summary", label: "Payroll Summary Report" },
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const formats = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "csv", label: "CSV" },
];

const statusConfig = {
  active: { label: "Active", variant: "default" as const },
  paused: { label: "Paused", variant: "secondary" as const },
  error: { label: "Error", variant: "destructive" as const },
};

export function ReportScheduler({}: ReportSchedulerProps) {
  const { toast } = useToast();
  
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(mockScheduledReports);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduledReport | null>(null);

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: "",
      reportType: "",
      frequency: "",
      schedule: "",
      recipients: "",
      format: [],
      isActive: true,
      emailSubject: "",
      emailBody: "",
    },
  });

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    form.reset({
      name: "",
      reportType: "",
      frequency: "",
      schedule: "",
      recipients: "",
      format: [],
      isActive: true,
      emailSubject: "",
      emailBody: "",
    });
    setShowDialog(true);
  };

  const handleEditSchedule = (schedule: ScheduledReport) => {
    setEditingSchedule(schedule);
    form.reset({
      name: schedule.name,
      reportType: schedule.reportType,
      frequency: schedule.frequency,
      schedule: schedule.schedule,
      recipients: schedule.recipients.join(", "),
      format: schedule.format.map(f => f.toLowerCase()),
      isActive: schedule.isActive,
      emailSubject: `Scheduled Report: ${schedule.name}`,
      emailBody: `Please find the attached ${schedule.name} report.`,
    });
    setShowDialog(true);
  };

  const handleDeleteSchedule = (schedule: ScheduledReport) => {
    setScheduleToDelete(schedule);
    setShowDeleteDialog(true);
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScheduledReports(prev => prev.map(s => 
        s.id === scheduleId 
          ? { ...s, isActive, status: isActive ? "active" : "paused" as const }
          : s
      ));
      
      toast({
        title: isActive ? "Schedule activated" : "Schedule paused",
        description: `The report schedule has been ${isActive ? "activated" : "paused"}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update schedule",
        description: error.message || "Please try again.",
      });
    }
  };

  const onSubmit = async (data: ScheduleFormData) => {
    setIsSaving(true);

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const recipients = data.recipients.split(",").map(email => email.trim());
      
      if (editingSchedule) {
        // Update existing schedule
        const updatedSchedule: ScheduledReport = {
          ...editingSchedule,
          name: data.name,
          reportType: data.reportType,
          frequency: data.frequency,
          schedule: data.schedule,
          recipients,
          format: data.format.map(f => f.toUpperCase()),
          isActive: data.isActive,
          status: data.isActive ? "active" : "paused",
        };
        
        setScheduledReports(prev => prev.map(s => 
          s.id === editingSchedule.id ? updatedSchedule : s
        ));
        
        toast({
          title: "Schedule updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        // Create new schedule
        const newSchedule: ScheduledReport = {
          id: Date.now().toString(),
          name: data.name,
          reportType: data.reportType,
          frequency: data.frequency,
          schedule: data.schedule,
          recipients,
          format: data.format.map(f => f.toUpperCase()),
          isActive: data.isActive,
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mock next run
          status: data.isActive ? "active" : "paused",
          createdAt: new Date().toISOString(),
          createdBy: "Current User",
        };
        
        setScheduledReports(prev => [...prev, newSchedule]);
        
        toast({
          title: "Schedule created",
          description: `${data.name} has been scheduled successfully.`,
        });
      }

      setShowDialog(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save schedule",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    try {
      setIsSaving(true);
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScheduledReports(prev => prev.filter(s => s.id !== scheduleToDelete.id));
      
      toast({
        title: "Schedule deleted",
        description: `${scheduleToDelete.name} has been deleted successfully.`,
      });
      
      setShowDeleteDialog(false);
      setScheduleToDelete(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete schedule",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Table columns
  const columns: ColumnDef<ScheduledReport>[] = [
    {
      accessorKey: "name",
      header: "Schedule Name",
      cell: ({ row }) => {
        const schedule = row.original;
        const reportType = reportTypes.find(rt => rt.value === schedule.reportType);
        return (
          <div>
            <p className="font-medium">{schedule.name}</p>
            <p className="text-sm text-muted-foreground">{reportType?.label}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "frequency",
      header: "Frequency",
      cell: ({ getValue }) => {
        const frequency = getValue() as string;
        return <Badge variant="outline">{frequency}</Badge>;
      },
    },
    {
      accessorKey: "schedule",
      header: "Schedule",
      cell: ({ getValue }) => {
        const schedule = getValue() as string;
        return <span className="text-sm">{schedule}</span>;
      },
    },
    {
      accessorKey: "recipients",
      header: "Recipients",
      cell: ({ getValue }) => {
        const recipients = getValue() as string[];
        return (
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{recipients.length} recipient(s)</span>
          </div>
        );
      },
    },
    {
      accessorKey: "nextRun",
      header: "Next Run",
      cell: ({ getValue }) => {
        const nextRun = getValue() as string;
        return (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{new Date(nextRun).toLocaleDateString()}</span>
          </div>
        );
      },
    },
    createStatusColumn<ScheduledReport>("status", "Status", statusConfig),
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => {
        const schedule = row.original;
        return (
          <Switch
            checked={schedule.isActive}
            onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
          />
        );
      },
    },
    createActionsColumn<ScheduledReport>([
      {
        label: "Edit",
        onClick: handleEditSchedule,
      },
      {
        label: "Delete",
        onClick: handleDeleteSchedule,
        variant: "destructive",
      },
    ]),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Report Scheduler</h3>
          <p className="text-sm text-muted-foreground">
            Automate report generation and delivery with flexible scheduling options.
          </p>
        </div>
        <Button onClick={handleAddSchedule} className="gap-2">
          <Plus className="w-4 h-4" />
          New Schedule
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={scheduledReports}
        searchKey="name"
        searchPlaceholder="Search schedules..."
        emptyMessage="No scheduled reports found."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              {editingSchedule ? "Edit Schedule" : "New Schedule"}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule 
                ? "Update the schedule configuration below."
                : "Create a new automated report schedule."
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Weekly Employee Report" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <FileText className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select report" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <Clock className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {frequencies.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
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
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Details</FormLabel>
                    <FormControl>
                      <Input placeholder="Every Monday at 9:00 AM" {...field} />
                    </FormControl>
                    <FormDescription>
                      Describe when the report should be generated (e.g., "Every Monday at 9:00 AM")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Recipients</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="hr@company.com, manager@company.com"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter email addresses separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output Formats</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        {formats.map((format) => (
                          <label key={format.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value.includes(format.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, format.value]);
                                } else {
                                  field.onChange(field.value.filter(f => f !== format.value));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{format.label}</span>
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Active Schedule</FormLabel>
                      <FormDescription>
                        Enable this schedule to start automated report generation
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
            </form>
          </Form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isSaving}
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
                  {editingSchedule ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              Delete Schedule
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{scheduleToDelete?.name}"? 
              This will stop all future automated reports for this schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteSchedule}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}