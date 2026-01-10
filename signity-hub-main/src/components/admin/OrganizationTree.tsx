import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  Users, 
  UserCheck, 
  AlertTriangle,
  Clock,
  Target,
  TrendingUp,
  UserX
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrganizationData {
  managers: any[];
  teams: any[];
  employees: any[];
  unassignedEmployees: any[];
  projects: any[];
  tasks: any[];
}

interface OrganizationTreeProps {
  data: OrganizationData;
  onNodeSelect: (node: any, nodeType: 'manager' | 'team' | 'employee' | 'unassigned') => void;
  selectedNode: any;
}

interface TreeNodeProps {
  node: any;
  nodeType: 'manager' | 'team' | 'employee' | 'unassigned';
  level: number;
  isSelected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  nodeType, 
  level, 
  isSelected, 
  onClick, 
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const getNodeIcon = () => {
    switch (nodeType) {
      case 'manager':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'team':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'employee':
        return <User className="w-4 h-4 text-gray-600" />;
      case 'unassigned':
        return <UserX className="w-4 h-4 text-amber-600" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getNodeTitle = () => {
    switch (nodeType) {
      case 'manager':
        return node.name || 'Unknown Manager';
      case 'team':
        return node.name || 'Unknown Team';
      case 'employee':
        return node.name || 'Unknown Employee';
      case 'unassigned':
        return 'Unassigned Pool';
      default:
        return 'Unknown';
    }
  };

  const getNodeSubtitle = () => {
    switch (nodeType) {
      case 'manager':
        const managedTeams = node.managedTeams?.length || 0;
        const activeProjects = node.activeProjects?.length || 0;
        return `${managedTeams} teams • ${activeProjects} projects`;
      case 'team':
        const memberCount = node.memberCount || 0;
        const teamProjects = node.activeProjects?.length || 0;
        return `${memberCount} members • ${teamProjects} projects`;
      case 'employee':
        const activeTasks = node.activeTasks?.length || 0;
        const overdueTasks = node.overdueTasks?.length || 0;
        return `${activeTasks} tasks${overdueTasks > 0 ? ` • ${overdueTasks} overdue` : ''}`;
      case 'unassigned':
        return `${node.employees?.length || 0} employees`;
      default:
        return '';
    }
  };

  const getPerformanceIndicator = () => {
    if (nodeType === 'manager' && node.performanceAvg !== undefined) {
      const performance = node.performanceAvg;
      const color = performance >= 80 ? 'bg-green-500' : performance >= 60 ? 'bg-yellow-500' : 'bg-red-500';
      return (
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-xs text-muted-foreground">{performance}%</span>
        </div>
      );
    }
    
    if (nodeType === 'team' && node.teamPerformance !== undefined) {
      const performance = node.teamPerformance;
      const color = performance >= 80 ? 'bg-green-500' : performance >= 60 ? 'bg-yellow-500' : 'bg-red-500';
      return (
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-xs text-muted-foreground">{performance}%</span>
        </div>
      );
    }

    if (nodeType === 'employee' && node.utilization !== undefined) {
      const utilization = node.utilization;
      const color = utilization >= 80 ? 'bg-green-500' : utilization >= 50 ? 'bg-yellow-500' : 'bg-red-500';
      return (
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-xs text-muted-foreground">{utilization}%</span>
        </div>
      );
    }

    return null;
  };

  const hasChildren = children !== undefined && children !== null;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50",
          isSelected && "bg-primary/10 border border-primary/20",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={onClick}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
        
        {!hasChildren && <div className="w-4" />}
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getNodeIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{getNodeTitle()}</span>
              {getPerformanceIndicator()}
              {nodeType === 'employee' && node.overdueTasks?.length > 0 && (
                <AlertTriangle className="w-3 h-3 text-amber-500" />
              )}
            </div>
            {getNodeSubtitle() && (
              <p className="text-xs text-muted-foreground truncate">{getNodeSubtitle()}</p>
            )}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({ 
  data, 
  onNodeSelect, 
  selectedNode 
}) => {
  const { managers, teams, employees, unassignedEmployees } = data;

  // Group teams by manager
  const teamsByManager = teams.reduce((acc, team) => {
    const managerId = team.managerId;
    if (!acc[managerId]) {
      acc[managerId] = [];
    }
    acc[managerId].push(team);
    return acc;
  }, {} as Record<string, any[]>);

  // Group employees by team
  const employeesByTeam = employees.reduce((acc, employee) => {
    const teamId = employee.teamId;
    if (teamId) {
      if (!acc[teamId]) {
        acc[teamId] = [];
      }
      acc[teamId].push(employee);
    }
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-1">
      {/* Managers with their teams and employees */}
      {managers.map((manager) => {
        const managerTeams = teamsByManager[manager.id] || [];
        const isManagerSelected = selectedNode?.id === manager.id;
        
        return (
          <TreeNode
            key={`manager-${manager.id}`}
            node={manager}
            nodeType="manager"
            level={0}
            isSelected={isManagerSelected}
            onClick={() => onNodeSelect(manager, 'manager')}
          >
            {managerTeams.map((team) => {
              const teamEmployees = employeesByTeam[team.id] || [];
              const isTeamSelected = selectedNode?.id === team.id;
              
              return (
                <TreeNode
                  key={`team-${team.id}`}
                  node={team}
                  nodeType="team"
                  level={1}
                  isSelected={isTeamSelected}
                  onClick={() => onNodeSelect(team, 'team')}
                >
                  {teamEmployees.map((employee) => {
                    const isEmployeeSelected = selectedNode?.id === employee.id;
                    
                    return (
                      <TreeNode
                        key={`employee-${employee.id}`}
                        node={employee}
                        nodeType="employee"
                        level={2}
                        isSelected={isEmployeeSelected}
                        onClick={() => onNodeSelect(employee, 'employee')}
                      />
                    );
                  })}
                </TreeNode>
              );
            })}
          </TreeNode>
        );
      })}

      {/* Unassigned Pool */}
      {unassignedEmployees.length > 0 && (
        <TreeNode
          node={{ employees: unassignedEmployees }}
          nodeType="unassigned"
          level={0}
          isSelected={selectedNode?.nodeType === 'unassigned'}
          onClick={() => onNodeSelect({ employees: unassignedEmployees, nodeType: 'unassigned' }, 'unassigned')}
        >
          {unassignedEmployees.map((employee) => {
            const isEmployeeSelected = selectedNode?.id === employee.id;
            
            return (
              <TreeNode
                key={`unassigned-${employee.id}`}
                node={employee}
                nodeType="employee"
                level={1}
                isSelected={isEmployeeSelected}
                onClick={() => onNodeSelect(employee, 'employee')}
              />
            );
          })}
        </TreeNode>
      )}

      {/* Empty state */}
      {managers.length === 0 && unassignedEmployees.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No organizational structure found</p>
        </div>
      )}
    </div>
  );
}; 