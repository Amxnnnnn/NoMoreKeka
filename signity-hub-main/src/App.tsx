import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Login from "./pages/auth/Login";
import AcceptInvitation from "./pages/auth/AcceptInvitation";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import HRDashboard from "./pages/dashboards/HRDashboard";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import Members from "./pages/Members";
import InviteMembers from "./pages/InviteMembers";
import NotFound from "./pages/NotFound";

// Admin Pages
import Departments from "./pages/admin/Departments";
import UserManagement from "./pages/admin/UserManagement";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import SystemConfiguration from "./pages/admin/SystemConfiguration";

// Manager Pages
import ManagerTaskManagement from "./pages/manager/ManagerTaskManagement";
import ManagerTeamManagement from "./pages/manager/ManagerTeamManagement";

// Project Management
import { ProjectManagement } from "./pages/project/ProjectManagement";

// Team Management
import TeamManagement from "./pages/team/TeamManagement";

// Leave Management
import { LeaveApplicationPage } from "./pages/leave/LeaveApplication";
import { LeaveApprovalPage } from "./pages/leave/LeaveApproval";
import { LeaveHistoryPage } from "./pages/leave/LeaveHistory";

// Work Log Management
import { WorkLogManagement } from "./pages/worklog/WorkLogManagement";
import { WorkLogApproval } from "./pages/worklog/WorkLogApproval";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/verify-otp" element={<VerifyOtp />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/accept-invitation" element={<AcceptInvitation />} />
          
          {/* Main Dashboard Route - Role-based routing */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Role-Specific Dashboard Routes - SECURE */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/dashboard" 
            element={
              <ProtectedRoute requiredRole="HR">
                <HRDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/dashboard" 
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee/dashboard" 
            element={
              <ProtectedRoute requiredRole="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ========== ADMIN ROUTES ========== */}
          <Route 
            path="/admin/departments" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Departments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/members" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Members />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/invite" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <InviteMembers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ReportsAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <SystemConfiguration />
              </ProtectedRoute>
            } 
          />
          
          {/* ========== HR ROUTES ========== */}
          <Route 
            path="/hr/members" 
            element={
              <ProtectedRoute requiredRole="HR">
                <Members />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/invite" 
            element={
              <ProtectedRoute requiredRole="HR">
                <InviteMembers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/users" 
            element={
              <ProtectedRoute requiredRole="HR">
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/reports" 
            element={
              <ProtectedRoute requiredRole="HR">
                <ReportsAnalytics />
              </ProtectedRoute>
            } 
          />
          
          {/* ========== MANAGER ROUTES ========== */}
          <Route 
            path="/manager/tasks" 
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerTaskManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/team" 
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerTeamManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/projects" 
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ProjectManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* ========== PROJECT MANAGEMENT ROUTES ========== */}
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <ProjectManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/projects" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ProjectManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/projects" 
            element={
              <ProtectedRoute requiredRole="HR">
                <ProjectManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* ========== TEAM MANAGEMENT ROUTES ========== */}
          <Route 
            path="/teams" 
            element={
              <ProtectedRoute>
                <TeamManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/teams" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <TeamManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/teams" 
            element={
              <ProtectedRoute requiredRole="HR">
                <TeamManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* ========== LEAVE MANAGEMENT ROUTES ========== */}
          <Route 
            path="/leave/apply" 
            element={
              <ProtectedRoute>
                <LeaveApplicationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leave/history" 
            element={
              <ProtectedRoute>
                <LeaveHistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leave/approval" 
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <LeaveApprovalPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/leave/approval" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <LeaveApprovalPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/leave/approval" 
            element={
              <ProtectedRoute requiredRole="HR">
                <LeaveApprovalPage />
              </ProtectedRoute>
            } 
          />
          
          {/* ========== WORK LOG ROUTES ========== */}
          <Route 
            path="/worklog" 
            element={
              <ProtectedRoute>
                <WorkLogManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/worklog/approval" 
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <WorkLogApproval />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/worklog" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <WorkLogManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/worklog/approval" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <WorkLogApproval />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/worklog" 
            element={
              <ProtectedRoute requiredRole="HR">
                <WorkLogManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* ========== LEGACY ROUTES - Redirect to role-specific routes ========== */}
          <Route 
            path="/members" 
            element={
              <ProtectedRoute requiredRole="HR">
                <Members />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invite" 
            element={
              <ProtectedRoute requiredRole="HR">
                <InviteMembers />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
