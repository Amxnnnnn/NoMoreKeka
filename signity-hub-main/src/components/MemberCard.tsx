import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "invited" | "inactive";
  avatar?: string;
  projectCount?: number;
  delay?: number;
  onClick?: () => void;
}

const roleVariants: Record<UserRole, "admin" | "hr" | "manager" | "employee"> = {
  ADMIN: "admin",
  HR: "hr",
  MANAGER: "manager",
  EMPLOYEE: "employee",
};

const getProjectBadgeClass = (count: number) => {
  if (count >= 4) return "bg-danger/10 text-danger border-danger/20";
  if (count >= 2) return "bg-warning/10 text-warning border-warning/20";
  return "bg-primary/10 text-primary border-primary/20";
};

export function MemberCard({
  name,
  email,
  role,
  department,
  status,
  avatar,
  projectCount,
  delay = 0,
  onClick,
}: MemberCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className={cn(
        "enterprise-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer",
        "hover:border-primary/30 group"
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12 border-2 border-border group-hover:border-primary/30 transition-colors">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            <Badge variant={roleVariants[role]} className="shrink-0">
              {role}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground truncate mb-2">{email}</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {department}
            </Badge>
            
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              status === "active" && "bg-success/10 text-success",
              status === "invited" && "bg-warning/10 text-warning",
              status === "inactive" && "bg-muted text-muted-foreground"
            )}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            
            {role === "MANAGER" && projectCount !== undefined && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                getProjectBadgeClass(projectCount)
              )}>
                {projectCount} Project{projectCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
