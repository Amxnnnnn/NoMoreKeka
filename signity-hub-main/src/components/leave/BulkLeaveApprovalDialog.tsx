import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Check, X, MessageSquare, Users, AlertTriangle, Calendar } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Leave, LeaveApprovalData, leaveService } from "@/services/leave.service";

const bulkApprovalSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED'], {
    required_error: "Please select a decision",
  }),
  comments: z.string().optional(),
  selectedLeaves: z.array(z.string()).min(1, "Please select at least one leave request"),
}).refine((data) => {
  if (data.decision === 'REJECTED' && (!data.comments || data.comments.trim().length < 10)) {
    return false;
  }
  return true;
}, {
  message: "Comments are required when rejecting leave requests (minimum 10 characters)",
  path: ["comments"],
});

type BulkApprovalFormData = z.infer<typeof bulkApprovalSchema>;

interface BulkLeaveApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaves: Leave[];
  defaultDecision?: 'APPROVED' | 'REJECTED';
  onBulkApprovalComplete?: (processedLeaves: Leave[], decision: 'APPROVED' | 'REJECTED') => void;
}

export const BulkLeaveApprovalDialog: React.FC<BulkLeaveApprovalDialogProps> = ({
  open,
  onOpenChange,
  leaves,
  defaultDecision,
  onBulkApprovalComplete,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [processingStatus, setProcessingStatus] = React.useState<Record<string, 'pending' | 'success' | 'error'>>({});

  const form = useForm<BulkApprovalFormData>({
    resolver: zodResolver(bulkApprovalSchema),
    defaultValues: {
      decision: defaultDecision,
      comments: "",
      selectedLeaves: leaves.map(leave => leave.id),
    },
  });

  const watchedDecision = form.watch("decision");
  const watchedSelectedLeaves = form.watch("selectedLeaves");

  // Reset form when dialog opens/closes or leaves change
  React.useEffect(() => {
    if (open && leaves.length > 0) {
      form.reset({
        decision: defaultDecision,
        comments: "",
        selectedLeaves: leaves.map(leave => leave.id),
      });
      setProcessingStatus({});
    }
  }, [open, leaves, defaultDecision, form]);

  const selectedLeaves = leaves.filter(leave => watchedSelectedLeaves.includes(leave.id));

  const onSubmit = async (data: BulkApprovalFormData) => {
    setIsSubmitting(true);
    
    try {
      const approvalData: LeaveApprovalData = {
        status: data.decision,
        comments: data.comments,
      };

      // Process each leave request
      const requests = data.selectedLeaves.map(leaveId => ({
        leaveId,
        data: approvalData,
      }));

      // Initialize processing status
      const initialStatus: Record<string, 'pending' | 'success' | 'error'> = {};
      data.selectedLeaves.forEach(leaveId => {
        initialStatus[leaveId] = 'pending';
      });
      setProcessingStatus(initialStatus);

      // Process requests in batches
      const results = await Promise.allSettled(
        requests.map(({ leaveId, data }) => 
          leaveService.processLeaveRequest(leaveId, data)
        )
      );
      
      // Check if all requests were successful
      const allSuccessful = results.every(result => 
        result.status === 'fulfilled' && result.value.success
      );
      
      if (allSuccessful) {
        // Update status for successful requests
        const updatedStatus = { ...initialStatus };
        data.selectedLeaves.forEach(leaveId => {
          updatedStatus[leaveId] = 'success';
        });
        setProcessingStatus(updatedStatus);

        // Wait a moment to show success status
        setTimeout(() => {
          onBulkApprovalComplete?.(selectedLeaves, data.decision);
          onOpenChange(false);
        }, 1000);
      } else {
        // Handle partial failures
        const errorStatus: Record<string, 'pending' | 'success' | 'error'> = {};
        results.forEach((result, index) => {
          const leaveId = data.selectedLeaves[index];
          if (result.status === 'fulfilled' && result.value.success) {
            errorStatus[leaveId] = 'success';
          } else {
            errorStatus[leaveId] = 'error';
          }
        });
        setProcessingStatus(errorStatus);
      }
    } catch (error) {
      console.error("Failed to process bulk leave requests:", error);
      
      // Mark all as error
      const errorStatus: Record<string, 'pending' | 'success' | 'error'> = {};
      watchedSelectedLeaves.forEach(leaveId => {
        errorStatus[leaveId] = 'error';
      });
      setProcessingStatus(errorStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      form.setValue("selectedLeaves", leaves.map(leave => leave.id));
    } else {
      form.setValue("selectedLeaves", []);
    }
  };

  const handleSelectLeave = (leaveId: string, checked: boolean) => {
    const currentSelected = form.getValues("selectedLeaves");
    if (checked) {
      form.setValue("selectedLeaves", [...currentSelected, leaveId]);
    } else {
      form.setValue("selectedLeaves", currentSelected.filter(id => id !== leaveId));
    }
  };

  const getStatusIcon = (leaveId: string) => {
    const status = processingStatus[leaveId];
    switch (status) {
      case 'pending':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const totalSelected = watchedSelectedLeaves.length;
  const allSelected = totalSelected === leaves.length;
  const someSelected = totalSelected > 0 && totalSelected < leaves.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Bulk {defaultDecision === 'APPROVED' ? 'Approve' : 'Reject'} Leave Requests</span>
          </DialogTitle>
          <DialogDescription>
            {defaultDecision === 'APPROVED' 
              ? 'Approve multiple leave requests at once.'
              : 'Reject multiple leave requests at once.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{leaves.length}</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalSelected}</p>
                  <p className="text-sm text-muted-foreground">Selected</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {selectedLeaves.reduce((sum, leave) => sum + leave.days, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {new Set(selectedLeaves.map(leave => leave.leaveType.name)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Leave Types</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Leave Requests</CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {leaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center space-x-4 p-3 border rounded-lg"
                    >
                      <Checkbox
                        checked={watchedSelectedLeaves.includes(leave.id)}
                        onCheckedChange={(checked) => handleSelectLeave(leave.id, !!checked)}
                      />
                      
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/api/avatars/${leave.id}`} />
                        <AvatarFallback>EM</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm">Employee Name</p>
                          <Badge variant="outline" className="text-xs">
                            {leave.leaveType.name}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd, yyyy")} • {leave.days} days
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(leave.id)}
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(leave.appliedAt), "MMM dd")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Decision Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Bulk Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="decision"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Decision for Selected Requests</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="APPROVED" id="bulk-approved" />
                              <Label htmlFor="bulk-approved" className="flex items-center space-x-2 cursor-pointer">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Approve All Selected</span>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="REJECTED" id="bulk-rejected" />
                              <Label htmlFor="bulk-rejected" className="flex items-center space-x-2 cursor-pointer">
                                <X className="h-4 w-4 text-red-600" />
                                <span>Reject All Selected</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Comments {watchedDecision === 'REJECTED' && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              watchedDecision === 'APPROVED' 
                                ? "Add any comments for all approved requests (optional)..."
                                : "Please provide a reason for rejecting all selected requests..."
                            }
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Warning for bulk rejection */}
          {watchedDecision === 'REJECTED' && totalSelected > 1 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Bulk Rejection Warning</p>
                  <p className="text-sm">
                    You are about to reject {totalSelected} leave requests. This action cannot be undone.
                    Please ensure you have provided adequate reasoning in the comments.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isSubmitting || !watchedDecision || totalSelected === 0}
            className="min-w-[160px]"
            variant={watchedDecision === 'REJECTED' ? 'destructive' : 'default'}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `${watchedDecision === 'APPROVED' ? 'Approve' : 'Reject'} ${totalSelected} Requests`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};