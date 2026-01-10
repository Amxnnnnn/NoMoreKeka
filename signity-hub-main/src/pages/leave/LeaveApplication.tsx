import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LeaveApplicationForm } from "@/components/leave/LeaveApplicationForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const LeaveApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
    // Auto-redirect after 3 seconds
    setTimeout(() => {
      navigate("/dashboard");
    }, 3000);
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  if (showSuccess) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-green-900">
                    Leave Application Submitted!
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Your leave application has been successfully submitted and sent to your manager for approval.
                  </p>
                </div>
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">What happens next?</p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Your manager will receive an email notification</li>
                        <li>• You'll get updates via email and in-app notifications</li>
                        <li>• You can track the status in your leave history</li>
                        <li>• You can cancel the request before it's approved</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => navigate("/leave/history")}>
                    View Leave History
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Redirecting to dashboard in 3 seconds...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Apply for Leave</h1>
          <p className="text-muted-foreground mt-2">
            Submit a new leave application with all required details and supporting documents.
          </p>
        </div>

        {/* Application Form */}
        <LeaveApplicationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};