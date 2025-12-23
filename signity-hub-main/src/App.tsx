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
          
          {/* Admin-Only Routes */}
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
          
          {/* HR-Level Routes */}
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
          
          {/* Legacy Routes - Redirect to role-specific routes */}
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
