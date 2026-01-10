import * as React from "react";
import { format } from "date-fns";
import { Calendar, Clock, FileText, User, AlertTriangle } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ApplyLeaveData } from "@/services/leave.service";

interface LeavePreviewData extends ApplyLeaveData {
  leaveTypeName: string;
  calculatedDays: number;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

interface LeavePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveData: LeavePreviewData | null;
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting?: boolean;
}

export const LeavePreviewDialog: React.FC<LeavePreviewDialogProps> = ({
  open,
  onOpenChange,
  leaveData,
  onConfirm,
  onEdit,
  isSubmitting = false,
}) => {
  if (!leaveData) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('document') || type.includes('word')) return '📝';
    return '📎';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Review Leave Application</span>
          </DialogTitle>
          <DialogDescription>
            Please review your leave application details before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Leave Type and Duration */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Leave Type</span>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {leaveData.leaveTypeName}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Duration</span>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {leaveData.calculatedDays} working days
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Start Date</span>
                  <div className="text-lg font-semibold">
                    {format(new Date(leaveData.startDate), "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">End Date</span>
                  <div className="text-lg font-semibold">
                    {format(new Date(leaveData.endDate), "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Reason for Leave</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm leading-relaxed">{leaveData.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {leaveData.attachments && leaveData.attachments.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <span className="text-sm font-medium">Supporting Documents</span>
                  <div className="space-y-2">
                    {leaveData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Important Notice:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Your leave application will be sent to your manager for approval</li>
                  <li>• You will receive email notifications about status updates</li>
                  <li>• Leave days will be deducted from your balance upon approval</li>
                  <li>• You can cancel this request before it's approved</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Application Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Leave Type:</span>
                <span className="ml-2 font-medium">{leaveData.leaveTypeName}</span>
              </div>
              <div>
                <span className="text-blue-700">Duration:</span>
                <span className="ml-2 font-medium">{leaveData.calculatedDays} days</span>
              </div>
              <div className="col-span-2">
                <span className="text-blue-700">Period:</span>
                <span className="ml-2 font-medium">
                  {format(new Date(leaveData.startDate), "MMM dd")} - {format(new Date(leaveData.endDate), "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onEdit} disabled={isSubmitting}>
            Edit Application
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              "Confirm & Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};