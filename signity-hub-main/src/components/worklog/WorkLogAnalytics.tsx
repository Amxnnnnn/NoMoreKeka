import * as React from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/StatCard";
import { CustomBarChart, CustomDonutChart } from "@/components/ui/charts";

import { worklogService } from "@/services/worklog.service";
import { projectService } from "@/services/project.service";
import { teamService } from "@/services/team.service";

interface WorkLogAnalyticsProps {
  className?: string;
  teamId?: string;
  userId?: string;
}

interface AnalyticsData {
  totalHours: number;
  averageHoursPerDay: number;
  totalEntries: number;
  approvedEntries: number;
  pendingEntries: number;
  projectBreakdown: Array<{
    projectId: string;
    projectName: string;
    hours: number;
    percentage: number;
  }>;
  dailyHours: Array<{
    date: string;
    hours: number;
    entries: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    hours: number;
    productivity: number;
  }>;
  logTypeBreakdown: Array<{
    type: string;
    hours: number;
    count: number;
  }>;
}

const TIME_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

export const WorkLogAnalytics: React.FC<WorkLogAnalyticsProps> = ({
  className,
  teamId,
  userId,
}) => {
  const [analyticsData, setAnalyticsData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [timePeriod, setTimePeriod] = React.useState('this_week');
  const [customStartDate, setCustomStartDate] = React.useState<Date>();
  const [customEndDate, setCustomEndDate] = React.useState<Date>();

  const getDateRange = (period: string): { startDate: string; endDate: string } => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'today':
        startDate = endDate = now;
        break;
      case 'yesterday':
        startDate = endDate = subDays(now, 1);
        break;
      case 'this_week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'last_week':
        const lastWeek = subWeeks(now, 1);
        startDate = startOfWeek(lastWeek);
        endDate = endOfWeek(lastWeek);
        break;
      case 'this_month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'custom':
        startDate = customStartDate || subDays(now, 7);
        endDate = customEndDate || now;
        break;
      default:
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  };

  const loadAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(timePeriod);
      
      // Get work log summary
      const summaryResult = await worklogService.getWorkLogSummary(startDate, endDate);
      
      if (summaryResult.success) {
        // Transform the data into our analytics format
        const data: AnalyticsData = {
          totalHours: summaryResult.data.totalHours || 0,
          averageHoursPerDay: summaryResult.data.averageHoursPerDay || 0,
          totalEntries: summaryResult.data.totalEntries || 0,
          approvedEntries: summaryResult.data.approvedEntries || 0,
          pendingEntries: summaryResult.data.pendingEntries || 0,
          projectBreakdown: summaryResult.data.projectBreakdown || [],
          dailyHours: summaryResult.data.dailyHours || [],
          weeklyTrends: summaryResult.data.weeklyTrends || [],
          logTypeBreakdown: summaryResult.data.logTypeBreakdown || [],
        };
        
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timePeriod, customStartDate, customEndDate]);

  React.useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatHours = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const getApprovalRate = () => {
    if (!analyticsData || analyticsData.totalEntries === 0) return 0;
    return Math.round((analyticsData.approvedEntries / analyticsData.totalEntries) * 100);
  };

  const handleExport = async () => {
    try {
      const { startDate, endDate } = getDateRange(timePeriod);
      // This would typically generate and download a report
      console.log("Exporting analytics report:", { startDate, endDate, teamId, userId });
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Data Available</h3>
              <p className="text-muted-foreground">No work log data found for the selected period.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Work Log Analytics</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Time Period Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Period:</span>
            </div>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {timePeriod === 'custom' && (
              <div className="flex items-center space-x-2">
                <DatePicker
                  date={customStartDate}
                  onDateChange={setCustomStartDate}
                  placeholder="Start date"
                />
                <span className="text-muted-foreground">to</span>
                <DatePicker
                  date={customEndDate}
                  onDateChange={setCustomEndDate}
                  placeholder="End date"
                />
              </div>
            )}
          </div>

          <Separator className="mb-6" />

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Hours"
              value={formatHours(analyticsData.totalHours)}
              icon={Clock}
              trend={analyticsData.totalHours > 0 ? { value: analyticsData.totalHours, isPositive: true } : undefined}
            />
            <StatCard
              title="Daily Average"
              value={formatHours(analyticsData.averageHoursPerDay)}
              icon={TrendingUp}
            />
            <StatCard
              title="Total Entries"
              value={analyticsData.totalEntries.toString()}
              icon={Calendar}
            />
            <StatCard
              title="Approval Rate"
              value={`${getApprovalRate()}%`}
              icon={Users}
              trend={getApprovalRate() >= 80 ? { value: getApprovalRate(), isPositive: true } : 
                     getApprovalRate() >= 60 ? undefined : 
                     { value: getApprovalRate(), isPositive: false }}
            />
          </div>

          {/* Approval Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approval Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Approved</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {analyticsData.approvedEntries}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.totalEntries > 0 
                          ? Math.round((analyticsData.approvedEntries / analyticsData.totalEntries) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={analyticsData.totalEntries > 0 
                      ? (analyticsData.approvedEntries / analyticsData.totalEntries) * 100
                      : 0
                    } 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {analyticsData.pendingEntries}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.totalEntries > 0 
                          ? Math.round((analyticsData.pendingEntries / analyticsData.totalEntries) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={analyticsData.totalEntries > 0 
                      ? (analyticsData.pendingEntries / analyticsData.totalEntries) * 100
                      : 0
                    } 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.logTypeBreakdown.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.count} entries
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatHours(item.hours)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomBarChart
                  data={analyticsData.dailyHours.map(item => ({
                    date: format(new Date(item.date), 'MMM dd'),
                    hours: item.hours
                  }))}
                  xAxisKey="date"
                  yAxisKey="hours"
                  height={300}
                  config={{
                    hours: {
                      label: "Hours",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Project Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.projectBreakdown.length > 0 ? (
                  <CustomDonutChart
                    data={analyticsData.projectBreakdown.map(item => ({
                      name: item.projectName,
                      value: item.hours,
                      percentage: item.percentage
                    }))}
                    dataKey="value"
                    nameKey="name"
                    height={300}
                    config={{
                      value: {
                        label: "Hours",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    centerLabel="Total Hours"
                    centerValue={analyticsData.projectBreakdown.reduce((sum, item) => sum + item.hours, 0)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No project data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Details Table */}
          {analyticsData.projectBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.projectBreakdown.map((project) => (
                    <div key={project.projectId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{project.projectName}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.percentage.toFixed(1)}% of total time
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatHours(project.hours)}</div>
                        <Progress value={project.percentage} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};