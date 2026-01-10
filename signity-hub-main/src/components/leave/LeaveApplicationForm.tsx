import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isWeekend, addDays } from "date-fns";
import { CalendarIcon, AlertCircle, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FileUpload, FileUploadFile } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

import { leaveService, LeaveBalance, ApplyLeaveData } from "@/services/leave.service";
import { useDataStore } from "@/stores/dataStore";

const leaveApplicationSchema = z.object({
  leaveTypeId: z.string().min(1, "Please select a leave type"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  reason: z.string().min(10, "Please provide a detailed reason (minimum 10 characters)"),
  attachments: z.array(z.any()).optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

type LeaveApplicationFormData = z.infer<typeof leaveApplicationSchema>;

interface LeaveApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({
  onSuccess,
  onCancel,
  className,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [files, setFiles] = React.useState<FileUploadFile[]>([]);
  const [conflicts, setConflicts] = React.useState<string[]>([]);
  const [leaveBalance, setLeaveBalance] = React.useState<LeaveBalance[]>([]);
  const [selectedBalance, setSelectedBalance] = React.useState<LeaveBalance | null>(null);
  const [calculatedDays, setCalculatedDays] = React.useState(0);

  const { leaveBalance: storeBalance } = useDataStore();

  const form = useForm<LeaveApplicationFormData>({
    resolver: zodResolver(leaveApplicationSchema),
    defaultValues: {
      reason: "",
      attachments: [],
    },
  });

  const watchedValues = form.watch();

  // Load leave balance on component mount
  React.useEffect(() => {
    const loadLeaveBalance = async () => {
      try {
        const result = await leaveService.getLeaveBalance();
        if (result.success) {
          setLeaveBalance(result.data);
        }
      } catch (error) {
        console.error("Failed to load leave balance:", error);
      }
    };

    if (storeBalance.length > 0) {
      setLeaveBalance(storeBalance);
    } else {
      loadLeaveBalance();
    }
  }, [storeBalance]);

  // Update selected balance when leave type changes
  React.useEffect(() => {
    if (watchedValues.leaveTypeId) {
      const balance = leaveBalance.find(b => b.leaveType.id === watchedValues.leaveTypeId);
      setSelectedBalance(balance || null);
    }
  }, [watchedValues.leaveTypeId, leaveBalance]);

  const calculateLeaveDays = (startDate: Date, endDate: Date): number => {
    let days = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Only count weekdays (skip weekends)
      if (!isWeekend(currentDate)) {
        days++;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  };

  const checkLeaveConflicts = React.useCallback(async (startDate: Date, endDate: Date) => {
    try {
      // This would typically call an API to check for conflicts
      // For now, we'll simulate conflict checking
      const conflictMessages: string[] = [];
      
      // Check if dates fall on weekends
      if (isWeekend(startDate) || isWeekend(endDate)) {
        conflictMessages.push("Selected dates include weekends");
      }
      
      // Check if sufficient balance exists
      if (selectedBalance && calculatedDays > selectedBalance.remainingDays) {
        conflictMessages.push(`Insufficient leave balance. You have ${selectedBalance.remainingDays} days remaining.`);
      }
      
      setConflicts(conflictMessages);
    } catch (error) {
      console.error("Failed to check leave conflicts:", error);
    }
  }, [selectedBalance, calculatedDays]);

  // Calculate leave days and check conflicts when dates change
  React.useEffect(() => {
    if (watchedValues.startDate && watchedValues.endDate) {
      const days = calculateLeaveDays(watchedValues.startDate, watchedValues.endDate);
      setCalculatedDays(days);
      checkLeaveConflicts(watchedValues.startDate, watchedValues.endDate);
    }
  }, [watchedValues.startDate, watchedValues.endDate, checkLeaveConflicts]);

  const handleFileUpload = async (uploadedFiles: File[]) => {
    // Simulate file upload
    const newFiles: FileUploadFile[] = uploadedFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}`,
      progress: 100,
      url: URL.createObjectURL(file),
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const onSubmit = async (data: LeaveApplicationFormData) => {
    if (conflicts.length > 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const leaveData: ApplyLeaveData = {
        leaveTypeId: data.leaveTypeId,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
        reason: data.reason,
      };

      const result = await leaveService.applyLeave(leaveData);
      
      if (result.success) {
        form.reset();
        setFiles([]);
        setConflicts([]);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to apply for leave:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBalanceVariant = (balance: LeaveBalance) => {
    const percentage = (balance.remainingDays / balance.totalDays) * 100;
    if (percentage > 50) return "default";
    if (percentage > 20) return "secondary";
    return "destructive";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5" />
          <span>Apply for Leave</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Leave Type Selection */}
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveBalance.map((balance) => (
                        <SelectItem key={balance.leaveType.id} value={balance.leaveType.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{balance.leaveType.name}</span>
                            <Badge variant={getBalanceVariant(balance)} className="ml-2">
                              {balance.remainingDays}/{balance.totalDays} days
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Leave Balance Display */}
            {selectedBalance && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{selectedBalance.leaveType.name} Balance</h4>
                  <Badge variant={getBalanceVariant(selectedBalance)}>
                    {selectedBalance.remainingDays} days remaining
                  </Badge>
                </div>
                <Progress 
                  value={(selectedBalance.remainingDays / selectedBalance.totalDays) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>Used: {selectedBalance.usedDays} days</span>
                  <span>Total: {selectedBalance.totalDays} days</span>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder="Select start date"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder="Select end date"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Leave Summary */}
            {calculatedDays > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Leave Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{calculatedDays} working days</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dates:</span>
                    <span className="ml-2 font-medium">
                      {watchedValues.startDate && format(watchedValues.startDate, "MMM dd")} - {watchedValues.endDate && format(watchedValues.endDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Conflicts Alert */}
            {conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {conflicts.map((conflict, index) => (
                      <div key={index}>• {conflict}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Leave</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed reason for your leave request..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear and detailed reason for your leave request.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Attachments */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Supporting Documents (Optional)</label>
              <FileUpload
                files={files}
                onFilesChange={setFiles}
                onUpload={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxSize={5 * 1024 * 1024} // 5MB
                maxFiles={3}
                dropzoneText="Drag & drop supporting documents here"
                browseText="Browse Files"
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX, JPG, PNG. Max 5MB per file, up to 3 files.
              </p>
            </div>

            <Separator />

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting || conflicts.length > 0}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};