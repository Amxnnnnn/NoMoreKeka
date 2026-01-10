import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp, Calendar, Clock, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { LeaveBalance, leaveService } from "@/services/leave.service";
import { useDataStore } from "@/stores/dataStore";

interface LeaveBalanceChartProps {
  className?: string;
}

export const LeaveBalanceChart: React.FC<LeaveBalanceChartProps> = ({
  className,
}) => {
  const [leaveBalance, setLeaveBalance] = React.useState<LeaveBalance[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { leaveBalance: storeBalance } = useDataStore();

  // Load leave balance data
  React.useEffect(() => {
    const loadLeaveBalance = async () => {
      setLoading(true);
      try {
        const result = await leaveService.getLeaveBalance();
        if (result.success) {
          setLeaveBalance(result.data);
        }
      } catch (error) {
        console.error("Failed to load leave balance:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeBalance.length > 0) {
      setLeaveBalance(storeBalance);
    } else {
      loadLeaveBalance();
    }
  }, [storeBalance]);

  // Prepare data for charts
  const pieChartData = leaveBalance.map((balance, index) => ({
    name: balance.leaveType.name,
    used: balance.usedDays,
    remaining: balance.remainingDays,
    total: balance.totalDays,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
  }));

  const barChartData = leaveBalance.map(balance => ({
    name: balance.leaveType.name.length > 10 
      ? balance.leaveType.name.substring(0, 10) + '...' 
      : balance.leaveType.name,
    fullName: balance.leaveType.name,
    used: balance.usedDays,
    remaining: balance.remainingDays,
    total: balance.totalDays,
  }));

  const totalLeaves = leaveBalance.reduce((acc, balance) => ({
    total: acc.total + balance.totalDays,
    used: acc.used + balance.usedDays,
    remaining: acc.remaining + balance.remainingDays,
  }), { total: 0, used: 0, remaining: 0 });

  const getBalanceStatus = (balance: LeaveBalance) => {
    const percentage = (balance.remainingDays / balance.totalDays) * 100;
    if (percentage > 50) return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage > 20) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const lowBalanceLeaves = leaveBalance.filter(balance => 
    (balance.remainingDays / balance.totalDays) * 100 < 20
  );

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        fullName: string;
        used: number;
        remaining: number;
        total: number;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm text-blue-600">Used: {data.used} days</p>
          <p className="text-sm text-green-600">Remaining: {data.remaining} days</p>
          <p className="text-sm text-gray-600">Total: {data.total} days</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLeaves.total}</p>
                  <p className="text-sm text-muted-foreground">Total Leave Days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLeaves.used}</p>
                  <p className="text-sm text-muted-foreground">Days Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLeaves.remaining}</p>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Balance Alert */}
        {lowBalanceLeaves.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Low Leave Balance Warning</p>
                <p className="text-sm">
                  You have low balance for: {lowBalanceLeaves.map(l => l.leaveType.name).join(', ')}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leaveBalance.map((balance) => {
            const status = getBalanceStatus(balance);
            const percentage = (balance.remainingDays / balance.totalDays) * 100;
            
            return (
              <Card key={balance.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{balance.leaveType.name}</CardTitle>
                    <Badge variant={status.status === 'good' ? 'default' : 
                                   status.status === 'warning' ? 'secondary' : 'destructive'}>
                      {balance.remainingDays} days left
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Used: {balance.usedDays} days</span>
                        <span>Total: {balance.totalDays} days</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-red-600">{balance.usedDays}</p>
                        <p className="text-xs text-muted-foreground">Used</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-green-600">{balance.remainingDays}</p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-blue-600">{balance.totalDays}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="remaining"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} days`, 'Remaining']}
                      labelFormatter={(label) => `${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {pieChartData.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Usage Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="used" fill="#ef4444" name="Used" />
                    <Bar dataKey="remaining" fill="#22c55e" name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};