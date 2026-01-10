import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInDays } from "date-fns";
import { Check, X, MessageSquare, Calendar, User, Clock, AlertTriangle, FileText } from "lucide-react";

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

import { Leave, LeaveApprovalData, leaveService } from "@/services/leave.service";

const approvalSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED'], {
    required_error: "Please select a decision",
  }),
  comments: z.string().optional(),
}).refine((data) => {
  if (data.decision === 'REJECTED' && (!data.comments || data.comments.trim().length < 10)) {
    return false;
  }
  return true;
}, {
  message: "Comments are required when rejecting a leave request (minimum 10 characters)",
  path: ["comments"],
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

interface LeaveApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: Leave | null;
  onApprovalComplete?: (leave: Leave, decision: 'APPROVED' | 'REJECTED') => void;
}

export const LeaveApprovalDialog: React.FC<LeaveApprovalDialogProps> = ({
  open,
  onOpenChange,
  leave,
  onApprovalComplete,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<string[]>([]);

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      comments: "",
    },
  });

  const watchedDecision = form.watch("decision");

  const checkLeaveConflicts = React.useCallback(async () => {
    if (!leave) return;

    try {
      // Simulate conflict checking
      const conflictMessages: string[] = [];
      
      // Check if this would cause team understaffing
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const today = new Date();
      
      // Check if leave starts very soon
      const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilStart <= 2) {
        conflictMessages.push("Leave starts in less than 2 days - very short notice");
      }
      
      // Check if it's a long leave period
      if (leave.days > 10) {
        conflictMessages.push("Extended leave period (>10 days) - consider impact on team");
      }
      
      // Check if it overlaps with busy periods (this would come from API)
      // conflictMessages.push("Overlaps with project deadline period");
      
      setConflicts(conflictMessages);
    } catch (error) {
      console.error("Failed to check leave conflicts:", error);
    }
  }, [leave]);

  // Reset form when dialog opens/closes or leave changes
  React.useEffect(() => {
    if (open && leave) {
      form.reset({
        comments: "",
      });
      checkLeaveConflicts();
    }
  }, [open, leave, form, checkLeaveConflicts]);

  const onSubmit = async (data: ApprovalFormData) => {
    if (!leave) return;

    setIsSubmitting(true);
    
    try {
      const approvalData: LeaveApprovalData = {
        status: data.decision,
        comments: data.comments,
      };

      const result = await leaveService.processLeaveRequest(leave.id, approvalData);
      
      if (result.success) {
        onApprovalComplete?.(leave, data.decision);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to process leave request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyLevel = (leave: Leave) => {
    const startDate = new Date(leave.startDate);
    const today = new Date();
    const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilStart <= 3) return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (daysUntilStart <= 7) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  if (!leave) return null;

  const urgency = getUrgencyLevel(leave);
  const startDate = new Date(leave.startDate);
  const endDate = new Date(leave.endDate);
  const today = new Date();
  const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Review Leave Request</span>
          </DialogTitle>
          <DialogDescription>
            Review and approve or reject this leave application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`/api/avatars/${leave.id}`} />
                  <AvatarFallback>EM</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">Employee Name</h3>
                  <p className="text-sm text-muted-foreground">employee@company.com</p>
                  <p className="text-sm text-muted-foreground">Software Engineer • Engineering Team</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">Team Member</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Leave Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Leave Type</p>
                    <Badge variant="secondary">{leave.leaveType.name}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <Badge variant="outline">{leave.days} days</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(startDate, "EEEE, MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="font-medium">{format(endDate, "EEEE, MMM dd, yyyy")}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applied On</p>
                  <p className="font-medium">{format(new Date(leave.appliedAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Urgency & Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Urgency Level</span>
                  <Badge variant={urgency.level === 'High' ? 'destructive' : 
                                 urgency.level === 'Medium' ? 'secondary' : 'default'}>
                    {urgency.level}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Starts In</span>
                  <span className="font-medium">{daysUntilStart} days</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Team Impact</span>
                  <span className="font-medium">Medium</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Coverage</span>
                  <span className="font-medium">Available</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reason */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Reason for Leave</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm leading-relaxed">{leave.reason}</p>
              </div>
            </CardContent>
          </Card>

          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Potential Issues:</p>
                  {conflicts.map((conflict, index) => (
                    <div key={index} className="text-sm">• {conflict}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Approval Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="decision"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Decision</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="APPROVED" id="approved" />
                              <Label htmlFor="approved" className="flex items-center space-x-2 cursor-pointer">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Approve</span>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="REJECTED" id="rejected" />
                              <Label htmlFor="rejected" className="flex items-center space-x-2 cursor-pointer">
                                <X className="h-4 w-4 text-red-600" />
                                <span>Reject</span>
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
                                ? "Add any comments or conditions for approval (optional)..."
                                : "Please provide a reason for rejection..."
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
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isSubmitting || !watchedDecision}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `${watchedDecision === 'APPROVED' ? 'Approve' : 'Reject'} Request`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};