import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Clock,
  Building2,
  UserCheck,
  UserX,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// Mock data - replace with actual API calls
const employeeMetrics = {
  totalEmployees: 156,
  activeEmployees: 142,
  newHires: 8,
  departures: 3,
  growthRate: 3.2,
};

const leaveData = [
  { month: "Jan", approved: 45, pending: 8, rejected: 2 },
  { month: "Feb", approved: 52, pending: 12, rejected: 3 },
  { month: "Mar", approved: 38, pending: 6, rejected: 1 },
  { month: "Apr", approved: 61, pending: 15, rejected: 4 },
  { month: "May", approved: 49, pending: 9, rejected: 2 },
  { month: "Jun", approved: 55, pending: 11, rejected: 3 },
];

const departmentData = [
  { name: "Engineering", employees: 45, color: "#3b82f6" },
  { name: "Sales", employees: 32, color: "#10b981" },
  { name: "Marketing", employees: 28, color: "#f59e0b" },
  { name: "HR", employees: 12, color: "#ef4444" },
  { name: "Finance", employees: 18, color: "#8b5cf6" },
  { name: "Operations", employees: 21, color: "#ec4899" },
];

const worklogTrends = [
  { week: "Week 1", hours: 1680, productivity: 85 },
  { week: "Week 2", hours: 1720, productivity: 88 },
  { week: "Week 3", hours: 1650, productivity: 82 },
  { week: "Week 4", hours: 1780, productivity: 91 },
  { week: "Week 5", hours: 1690, productivity: 86 },
  { week: "Week 6", hours: 1750, productivity: 89 },
];

const leaveTypeData = [
  { name: "Annual Leave", value: 45, color: "#3b82f6" },
  { name: "Sick Leave", value: 28, color: "#ef4444" },
  { name: "Personal Leave", value: 15, color: "#f59e0b" },
  { name: "Maternity/Paternity", value: 8, color: "#10b981" },
  { name: "Emergency Leave", value: 4, color: "#8b5cf6" },
];

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    to: new Date(),
  });
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics Overview</h3>
        <div className="flex items-center gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentData.map((dept) => (
                <SelectItem key={dept.name} value={dept.name.toLowerCase()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employeeMetrics.totalEmployees}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">+{employeeMetrics.growthRate}%</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold">{employeeMetrics.activeEmployees}</p>
                <div className="flex items-center gap-1 mt-1">
                  <UserCheck className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round((employeeMetrics.activeEmployees / employeeMetrics.totalEmployees) * 100)}% active
                  </span>
                </div>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Hires</p>
                <p className="text-2xl font-bold">{employeeMetrics.newHires}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">This month</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departures</p>
                <p className="text-2xl font-bold">{employeeMetrics.departures}</p>
                <div className="flex items-center gap-1 mt-1">
                  <UserX className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-muted-foreground">This month</span>
                </div>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Leave Requests Trend
            </CardTitle>
            <CardDescription>
              Monthly leave request status over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leaveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="approved" fill="#10b981" name="Approved" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Department Distribution
            </CardTitle>
            <CardDescription>
              Employee distribution across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="employees"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Log Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Work Hours & Productivity
            </CardTitle>
            <CardDescription>
              Weekly work hours and productivity trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={worklogTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="hours"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Hours"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="productivity"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Productivity %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Leave Types Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of leave types taken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={leaveTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leaveTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2">
                {leaveTypeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Key Insights & Alerts
          </CardTitle>
          <CardDescription>
            Automated insights and recommendations based on your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Positive Trend</h4>
                <p className="text-sm text-blue-700">
                  Employee productivity has increased by 12% over the last month. 
                  Work hours remain stable while output has improved.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Attention Required</h4>
                <p className="text-sm text-amber-700">
                  Leave requests in Engineering department are 25% higher than average. 
                  Consider reviewing workload distribution.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <Users className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Hiring Success</h4>
                <p className="text-sm text-green-700">
                  New hire retention rate is at 95% for the past quarter. 
                  Onboarding process is performing well.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}