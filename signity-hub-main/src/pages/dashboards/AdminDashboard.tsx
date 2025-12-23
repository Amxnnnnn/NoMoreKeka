import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Building2, UserPlus, Settings, Shield, Database } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getCompanyOverview } from "@/services/dashboard.service";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  pendingInvitations: number;
  userGrowth: number;
  departmentGrowth: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // SECURITY: Only call admin-specific APIs for admin dashboard
        const [statsResult, overviewResult] = await Promise.all([
          getDashboardStats(), // Admin/HR only - will return 403 for others
          getCompanyOverview() // Admin only - will return 403 for others
        ]);
        
        setStats({
          totalUsers: statsResult.stats.totalUsers,
          activeUsers: statsResult.stats.adminCount + statsResult.stats.hrCount + statsResult.stats.employeeCount,
          totalDepartments: 0, // Will be implemented when departments are added
          pendingInvitations: 0, // Will be implemented when invitations tracking is added
          userGrowth: statsResult.stats.growthPercentage,
          departmentGrowth: 0, // Will be implemented when departments are added
        });
      } catch (error: any) {
        console.error('Failed to fetch admin stats:', error);
        
        // SECURITY: Handle authorization errors gracefully
        if (error.message.includes('Access denied') || error.message.includes('403')) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to view admin dashboard data.",
          });
          // Redirect to appropriate dashboard based on user role
          navigate("/dashboard");
          return;
        }
        
        toast({
          variant: "destructive",
          title: "Failed to load dashboard",
          description: "Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [toast, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            System administration and company management overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            trend={stats?.userGrowth ? {
              value: stats.userGrowth,
              isPositive: stats.userGrowth >= 0
            } : undefined}
            icon={Users}
            delay={0}
          />
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={Shield}
            delay={0.1}
          />
          <StatCard
            title="Departments"
            value={stats?.totalDepartments || 0}
            trend={stats?.departmentGrowth ? {
              value: stats.departmentGrowth,
              isPositive: stats.departmentGrowth >= 0
            } : undefined}
            icon={Building2}
            delay={0.2}
          />
          <StatCard
            title="Pending Invitations"
            value={stats?.pendingInvitations || 0}
            icon={UserPlus}
            delay={0.3}
          />
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage users, roles, and permissions across the organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => navigate("/members")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View All Members
                </Button>
                <Button 
                  onClick={() => navigate("/invite")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite New Members
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Administration
                </CardTitle>
                <CardDescription>
                  Configure system settings and manage company data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Company Settings
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Database className="w-4 h-4 mr-2" />
                  System Logs
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}