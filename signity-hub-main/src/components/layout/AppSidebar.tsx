import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  ChevronLeft,
  Building2,
  Settings,
  FolderOpen,
  Target,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * SECURE ROLE-BASED NAVIGATION
 * 
 * This component provides role-specific navigation items to prevent
 * unauthorized access to admin/HR features by employees.
 */

interface NavItem {
  title: string;
  icon: any;
  href: string;
  disabled?: boolean;
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // SECURE ROLE-BASED NAVIGATION ITEMS
  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    switch (user.role) {
      case 'ADMIN':
        return [
          { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
          { title: "Members", icon: Users, href: "/admin/members" },
          { title: "Invite Members", icon: UserPlus, href: "/admin/invite" },
          { title: "Departments", icon: Building2, href: "/admin/departments", disabled: true },
          { title: "Settings", icon: Settings, href: "/admin/settings", disabled: true },
        ];
      
      case 'HR':
        return [
          { title: "Dashboard", icon: LayoutDashboard, href: "/hr/dashboard" },
          { title: "Employees", icon: Users, href: "/hr/members" },
          { title: "Invite Employee", icon: UserPlus, href: "/hr/invite" },
          { title: "Departments", icon: Building2, href: "/hr/departments", disabled: true },
        ];
      
      case 'MANAGER':
        return [
          { title: "Dashboard", icon: LayoutDashboard, href: "/manager/dashboard" },
          { title: "My Team", icon: Users, href: "/manager/team", disabled: true },
          { title: "Projects", icon: FolderOpen, href: "/manager/projects", disabled: true },
          { title: "Tasks", icon: Target, href: "/manager/tasks", disabled: true },
        ];
      
      case 'EMPLOYEE':
      default:
        return [
          { title: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
          { title: "My Tasks", icon: Target, href: "/employee/tasks", disabled: true },
          { title: "Calendar", icon: Calendar, href: "/employee/calendar", disabled: true },
        ];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <>
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-screen bg-sidebar z-50 flex flex-col border-r border-sidebar-border"
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-sidebar-foreground">NoMoreKeka</h1>
                    <p className="text-xs text-sidebar-foreground/60 capitalize">
                      {user?.role?.toLowerCase()} Portal
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  collapsed && "rotate-180"
                )}
              />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-sidebar-foreground/40 cursor-not-allowed"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium text-sm whitespace-nowrap"
                      >
                        {item.title}
                        <span className="ml-2 text-xs">(Soon)</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "text-sidebar-foreground/80 hover:text-sidebar-foreground",
                  "hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium text-sm whitespace-nowrap"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <AnimatePresence mode="wait">
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2 mb-2"
              >
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user.email} • {user.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            onClick={() => setShowLogoutDialog(true)}
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.aside>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
