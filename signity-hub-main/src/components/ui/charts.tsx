import * as React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

export interface ChartData {
  [key: string]: string | number;
}

export interface ChartProps {
  data: ChartData[];
  className?: string;
  title?: string;
  description?: string;
  height?: number;
  loading?: boolean;
  config: ChartConfig;
}

export interface BarChartProps extends ChartProps {
  xAxisKey: string;
  yAxisKey: string;
  orientation?: "horizontal" | "vertical";
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: string[];
}

export interface LineChartProps extends ChartProps {
  xAxisKey: string;
  yAxisKey: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
  strokeWidth?: number;
  colors?: string[];
}

export interface PieChartProps extends ChartProps {
  dataKey: string;
  nameKey: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
}

export interface DonutChartProps extends PieChartProps {
  centerLabel?: string;
  centerValue?: string | number;
  onSectionClick?: (data: any) => void;
}

// Default color palette
const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Bar Chart Component
export const CustomBarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  ({
    data,
    xAxisKey,
    yAxisKey,
    className,
    title,
    description,
    height = 300,
    loading = false,
    orientation = "vertical",
    showGrid = true,
    showLegend = false,
    colors = DEFAULT_COLORS,
    config,
  }, ref) => {
    if (loading) {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
          )}
          <CardContent>
            <div className="flex items-center justify-center" style={{ height }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className} ref={ref}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <ChartContainer config={config} className="h-full w-full">
            <BarChart
              data={data}
              layout={orientation === "horizontal" ? "horizontal" : "vertical"}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={orientation === "horizontal" ? undefined : xAxisKey}
                type={orientation === "horizontal" ? "number" : "category"}
              />
              <YAxis 
                dataKey={orientation === "horizontal" ? yAxisKey : undefined}
                type={orientation === "horizontal" ? "category" : "number"}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {showLegend && <Legend />}
              <Bar 
                dataKey={yAxisKey} 
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }
);
CustomBarChart.displayName = "CustomBarChart";

// Line Chart Component
export const CustomLineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({
    data,
    xAxisKey,
    yAxisKey,
    className,
    title,
    description,
    height = 300,
    loading = false,
    showGrid = true,
    showLegend = false,
    showDots = true,
    strokeWidth = 2,
    colors = DEFAULT_COLORS,
    config,
  }, ref) => {
    if (loading) {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
          )}
          <CardContent>
            <div className="flex items-center justify-center" style={{ height }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className} ref={ref}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <ChartContainer config={config} className="h-full w-full">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey={yAxisKey} 
                stroke={colors[0]}
                strokeWidth={strokeWidth}
                dot={showDots}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }
);
CustomLineChart.displayName = "CustomLineChart";

// Pie Chart Component
export const CustomPieChart = React.forwardRef<HTMLDivElement, PieChartProps>(
  ({
    data,
    dataKey,
    nameKey,
    className,
    title,
    description,
    height = 300,
    loading = false,
    showLegend = true,
    innerRadius = 0,
    outerRadius = 80,
    colors = DEFAULT_COLORS,
    config,
  }, ref) => {
    if (loading) {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
          )}
          <CardContent>
            <div className="flex items-center justify-center" style={{ height }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className} ref={ref}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <ChartContainer config={config} className="h-full w-full">
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey={dataKey}
                nameKey={nameKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              {showLegend && <Legend />}
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }
);
CustomPieChart.displayName = "CustomPieChart";

// Donut Chart Component
export const CustomDonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  ({
    data,
    dataKey,
    nameKey,
    className,
    title,
    description,
    height = 300,
    loading = false,
    showLegend = true,
    innerRadius = 60,
    outerRadius = 80,
    colors = DEFAULT_COLORS,
    centerLabel,
    centerValue,
    onSectionClick,
    config,
  }, ref) => {
    const total = React.useMemo(() => {
      return data.reduce((sum, item) => sum + (item[dataKey] as number), 0);
    }, [data, dataKey]);

    if (loading) {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
          )}
          <CardContent>
            <div className="flex items-center justify-center" style={{ height }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className} ref={ref}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <div className="relative">
            <ChartContainer config={config} className="h-full w-full">
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={2}
                  dataKey={dataKey}
                  nameKey={nameKey}
                  onClick={onSectionClick}
                  style={{ cursor: onSectionClick ? 'pointer' : 'default' }}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={(entry as any).color || colors[index % colors.length]}
                      style={{ cursor: onSectionClick ? 'pointer' : 'default' }}
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const percentage = total > 0 ? ((data.value as number) / total * 100).toFixed(1) : '0';
                      
                      // Get contextual description based on the data type
                      const getDescription = (name: string) => {
                        switch (name) {
                          case 'Employees':
                            return 'Total registered employees in the company';
                          case 'Active Projects':
                            return 'Projects currently in progress or planning';
                          case 'Active Tasks':
                            return 'Tasks that are not yet completed';
                          default:
                            return 'Company health metric';
                        }
                      };
                      
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[250px]">
                          <div className="flex items-center gap-2 mb-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: data.color || data.fill }}
                            />
                            <span className="font-semibold text-foreground text-base">{data.name}</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground text-xs mb-2">
                              {getDescription(data.name as string)}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Count:</span>
                              <span className="font-semibold text-lg">{(data.value as number).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Percentage:</span>
                              <span className="font-medium">{percentage}%</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-xs">Total Health:</span>
                                <span className="font-medium text-xs">{total.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 text-center">
                              💡 Click to navigate to {String(data.name).toLowerCase()} management
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showLegend && <Legend />}
              </PieChart>
            </ChartContainer>
            
            {/* Center Label */}
            {(centerLabel || centerValue) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {centerValue && (
                    <div className="text-2xl font-bold">
                      {typeof centerValue === 'number' ? centerValue.toLocaleString() : centerValue}
                    </div>
                  )}
                  {centerLabel && (
                    <div className="text-sm text-muted-foreground">{centerLabel}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
CustomDonutChart.displayName = "CustomDonutChart";

// Multi-series Bar Chart
export interface MultiBarChartProps extends ChartProps {
  xAxisKey: string;
  series: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  orientation?: "horizontal" | "vertical";
  showGrid?: boolean;
  showLegend?: boolean;
}

export const MultiBarChart = React.forwardRef<HTMLDivElement, MultiBarChartProps>(
  ({
    data,
    xAxisKey,
    series,
    className,
    title,
    description,
    height = 300,
    loading = false,
    orientation = "vertical",
    showGrid = true,
    showLegend = true,
    config,
  }, ref) => {
    if (loading) {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
          )}
          <CardContent>
            <div className="flex items-center justify-center" style={{ height }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className} ref={ref}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <ChartContainer config={config} className="h-full w-full">
            <BarChart
              data={data}
              layout={orientation === "horizontal" ? "horizontal" : "vertical"}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={orientation === "horizontal" ? undefined : xAxisKey}
                type={orientation === "horizontal" ? "number" : "category"}
              />
              <YAxis 
                type={orientation === "horizontal" ? "category" : "number"}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {showLegend && <Legend />}
              {series.map((s, index) => (
                <Bar 
                  key={s.key}
                  dataKey={s.key} 
                  name={s.name}
                  fill={s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }
);
MultiBarChart.displayName = "MultiBarChart";

// Multi-series Line Chart
export interface MultiLineChartProps extends ChartProps {
  xAxisKey: string;
  series: Array<{
    key: string;
    name: string;
    color?: string;
    strokeWidth?: number;
  }>;
  showGrid?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
}

export const MultiLineChart = React.forwardRef<HTMLDivElement, MultiLineChartProps>(
  ({
    data,
    xAxisKey,
    series,
    className,
    title,
    description,
    height = 300,
    loading = false,
    showGrid = true,
    showLegend = true,
    showDots = true,
    config,
  }, ref) => {
    if (loading) {
      return (
        <Card className={className} ref={ref}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
          )}
          <CardContent>
            <div className="flex items-center justify-center" style={{ height }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className} ref={ref}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <ChartContainer config={config} className="h-full w-full">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {showLegend && <Legend />}
              {series.map((s, index) => (
                <Line 
                  key={s.key}
                  type="monotone" 
                  dataKey={s.key} 
                  name={s.name}
                  stroke={s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  strokeWidth={s.strokeWidth || 2}
                  dot={showDots}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }
);
MultiLineChart.displayName = "MultiLineChart";