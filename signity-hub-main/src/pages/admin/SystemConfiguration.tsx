import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  Calendar, 
  Building2, 
  Bell, 
  Shield,
  Save,
  Plus,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LeaveTypeManagement } from "@/components/admin/LeaveTypeManagement";
import { DepartmentManagement } from "@/components/admin/DepartmentManagement";
import { CompanySettings } from "@/components/admin/CompanySettings";
import { NotificationSettings } from "@/components/admin/NotificationSettings";

export default function SystemConfiguration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leave-types");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleTabChange = (value: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this tab?'
      );
      if (!confirmed) return;
      setHasUnsavedChanges(false);
    }
    setActiveTab(value);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">System Configuration</h1>
            <p className="text-muted-foreground">
              Manage system settings, leave types, departments, and notifications.
            </p>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          )}
        </motion.div>

        {/* Configuration Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="enterprise-card p-6"
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="leave-types" className="gap-2">
                <Calendar className="w-4 h-4" />
                Leave Types
              </TabsTrigger>
              <TabsTrigger value="departments" className="gap-2">
                <Building2 className="w-4 h-4" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-2">
                <Settings className="w-4 h-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leave-types" className="space-y-6">
              <LeaveTypeManagement 
                onUnsavedChanges={setHasUnsavedChanges}
              />
            </TabsContent>

            <TabsContent value="departments" className="space-y-6">
              <DepartmentManagement 
                onUnsavedChanges={setHasUnsavedChanges}
              />
            </TabsContent>

            <TabsContent value="company" className="space-y-6">
              <CompanySettings 
                onUnsavedChanges={setHasUnsavedChanges}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettings 
                onUnsavedChanges={setHasUnsavedChanges}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}