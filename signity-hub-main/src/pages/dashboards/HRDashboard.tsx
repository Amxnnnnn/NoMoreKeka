import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Building2, Calendar, FileText, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "@/services/dashboard.service";
import { useToast } from "@/hooks/use-toast";

interface HRStats {
  totalEmployees: number;
  newHires: number;
  pendingInvitations: number;
  departments: number;
}

export default function HRDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<HRStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // SECURITY: HR can access dashboard stats (HR+ level access)
        const result = await getDashboardStats();
        
        setStats({
          totalEmployees: result.stats.totalUsers,
          newHires: result.stats.recentUsers, // Use actual recent users data
          pendingInvitations: 0, // Will be implemented when invitations tracking is added
          departments: 0, // Will be implemented when departments are added
        });
      } catch (error: any) {
        console.error('Failed to fetch HR stats:', error);
        
        // SECURITY: Handle authorization errors gracefully
        if (error.message.includes('Access denied') || error.message.includes('403')) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to view HR dashboard data.",
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
            HR Dashboard
          </h1>
          <p className="text-muted-foreground">
            Human resources management and employee oversight
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            trend={{
              value: 5.2,
              isPositive: true
            }}
            icon={Users}
            delay={0}
          />
          <StatCard
            title="New Hires (30d)"
            value={stats?.newHires || 0}
            trend={{
              value: 12.5,
              isPositive: true
            }}
            icon={TrendingUp}
            delay={0.1}
          />
          <StatCard
            title="Pending Invitations"
            value={stats?.pendingInvitations || 0}
            icon={UserPlus}
            delay={0.2}
          />
          <StatCard
            title="Departments"
            value={stats?.departments || 0}
            icon={Building2}
            delay={0.3}
          />
        </div>

        {/* HR Actions */}
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
                  Employee Management
                </CardTitle>
                <CardDescription>
                  Manage employee records, recruitment, and onboarding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => navigate("/members")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View All Employees
                </Button>
                <Button 
                  onClick={() => navigate("/invite")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite New Employee
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
                  <FileText className="w-5 h-5" />
                  HR Operations
                </CardTitle>
                <CardDescription>
                  Policies, compliance, and employee relations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Leave Management
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Performance Reviews
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}