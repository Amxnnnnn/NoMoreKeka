import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

/**
 * SECURE ROLE-BASED DASHBOARD ROUTER
 * 
 * This component acts as a secure router that redirects users to their
 * role-specific dashboard. This prevents unauthorized access to admin
 * or HR dashboards by employees.
 * 
 * SECURITY FEATURES:
 * - Immediate role-based redirection
 * - No data exposure during routing
 * - Fail-safe fallback to employee dashboard
 */
export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Security check: Ensure user is authenticated
    if (!isAuthenticated || !user) {
      navigate("/auth/login", { replace: true });
      return;
    }

    // SECURE ROLE-BASED ROUTING
    // Each role gets redirected to their specific dashboard
    switch (user.role) {
      case 'ADMIN':
        navigate("/admin/dashboard", { replace: true });
        break;
      case 'HR':
        navigate("/hr/dashboard", { replace: true });
        break;
      case 'MANAGER':
        navigate("/manager/dashboard", { replace: true });
        break;
      case 'EMPLOYEE':
        navigate("/employee/dashboard", { replace: true });
        break;
      default:
        // Fail-safe: Unknown roles get employee access (least privilege)
        console.warn(`Unknown role: ${user.role}. Redirecting to employee dashboard.`);
        navigate("/employee/dashboard", { replace: true });
        break;
    }
  }, [user, isAuthenticated, navigate]);

  // Show loading while redirecting (prevents flash of content)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
