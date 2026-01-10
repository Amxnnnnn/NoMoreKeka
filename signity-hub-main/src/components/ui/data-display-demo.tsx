import * as React from "react";
import { 
  DataTable, 
  createSortableColumn, 
  createActionsColumn,
  createStatusColumn,
  CustomBarChart,
  CustomLineChart,
  CustomPieChart,
  CustomDonutChart,
  EventCalendar,
  Timeline,
  Statistics,
  CircularProgress,
  MultiStepProgress,
  ProgressCard
} from "@/components/ui";
import { Progress } from "@/components/ui/enhanced-progress";

// Sample data for demonstrations
const sampleTableData = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "active", role: "Employee" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "inactive", role: "Manager" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "active", role: "HR" },
];

const sampleChartData = [
  { name: "Jan", value: 400, sales: 240, revenue: 2400 },
  { name: "Feb", value: 300, sales: 139, revenue: 2210 },
  { name: "Mar", value: 200, sales: 980, revenue: 2290 },
  { name: "Apr", value: 278, sales: 390, revenue: 2000 },
  { name: "May", value: 189, sales: 480, revenue: 2181 },
];

const samplePieData = [
  { name: "Desktop", value: 400 },
  { name: "Mobile", value: 300 },
  { name: "Tablet", value: 200 },
];

const sampleEvents = [
  {
    id: "1",
    title: "Team Meeting",
    description: "Weekly team sync",
    date: new Date(),
    type: "meeting" as const,
    status: "confirmed" as const,
  },
  {
    id: "2", 
    title: "Project Deadline",
    description: "Final submission",
    date: new Date(Date.now() + 86400000),
    type: "deadline" as const,
    status: "pending" as const,
  },
];

const sampleTimelineItems = [
  {
    id: "1",
    title: "Project Started",
    description: "Initial project setup completed",
    timestamp: new Date(Date.now() - 86400000 * 7),
    status: "completed" as const,
  },
  {
    id: "2",
    title: "Development Phase",
    description: "Currently in active development",
    timestamp: new Date(),
    status: "current" as const,
  },
  {
    id: "3",
    title: "Testing Phase",
    description: "Quality assurance testing",
    timestamp: new Date(Date.now() + 86400000 * 7),
    status: "upcoming" as const,
  },
];

const sampleStatistics = [
  {
    id: "1",
    label: "Total Users",
    value: "1,234",
    change: { value: 12, type: "increase" as const, period: "last month" },
  },
  {
    id: "2",
    label: "Revenue",
    value: "$45,678",
    change: { value: 8, type: "increase" as const, period: "last month" },
  },
  {
    id: "3",
    label: "Active Projects",
    value: "23",
    change: { value: 3, type: "decrease" as const, period: "last week" },
  },
];

const sampleSteps = [
  { id: "1", title: "Planning", description: "Project planning phase", status: "completed" as const },
  { id: "2", title: "Development", description: "Active development", status: "current" as const },
  { id: "3", title: "Testing", description: "Quality assurance", status: "upcoming" as const },
  { id: "4", title: "Deployment", description: "Production deployment", status: "upcoming" as const },
];

// Chart config for the new chart components
const chartConfig = {
  value: { label: "Value", color: "hsl(var(--chart-1))" },
  sales: { label: "Sales", color: "hsl(var(--chart-2))" },
  revenue: { label: "Revenue", color: "hsl(var(--chart-3))" },
};

export const DataDisplayDemo = () => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const tableColumns = [
    createSortableColumn("name", "Name"),
    createSortableColumn("email", "Email"),
    createStatusColumn("status", "Status", {
      active: { label: "Active", variant: "default" },
      inactive: { label: "Inactive", variant: "secondary" },
    }),
    createSortableColumn("role", "Role"),
    createActionsColumn([
      { label: "Edit", onClick: (row) => console.log("Edit", row) },
      { label: "Delete", onClick: (row) => console.log("Delete", row), variant: "destructive" },
    ]),
  ];

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold">Data Display Components Demo</h1>
      
      {/* DataTable Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Enhanced DataTable</h2>
        <DataTable
          columns={tableColumns}
          data={sampleTableData}
          searchKey="name"
          searchPlaceholder="Search users..."
          showRowSelection={true}
        />
      </section>

      {/* Charts Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Chart Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CustomBarChart
            data={sampleChartData}
            xAxisKey="name"
            yAxisKey="value"
            title="Monthly Values"
            config={chartConfig}
          />
          <CustomLineChart
            data={sampleChartData}
            xAxisKey="name"
            yAxisKey="sales"
            title="Sales Trend"
            config={chartConfig}
          />
          <CustomPieChart
            data={samplePieData}
            dataKey="value"
            nameKey="name"
            title="Device Usage"
            config={chartConfig}
          />
          <CustomDonutChart
            data={samplePieData}
            dataKey="value"
            nameKey="name"
            title="Traffic Sources"
            centerLabel="Total"
            centerValue="900"
            config={chartConfig}
          />
        </div>
      </section>

      {/* Calendar Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Event Calendar</h2>
        <EventCalendar
          events={sampleEvents}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onEventClick={(event) => console.log("Event clicked:", event)}
          onAddEvent={(date) => console.log("Add event for:", date)}
        />
      </section>

      {/* Timeline Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Timeline</h2>
        <Timeline
          items={sampleTimelineItems}
          title="Project Timeline"
          variant="detailed"
        />
      </section>

      {/* Statistics Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Statistics</h2>
        <Statistics items={sampleStatistics} />
      </section>

      {/* Progress Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Progress Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Linear Progress</h3>
            <Progress
              value={75}
              label="Project Completion"
              showPercentage={true}
              variant="success"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Circular Progress</h3>
            <CircularProgress
              value={60}
              variant="default"
              showPercentage={true}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Progress Card</h3>
            <ProgressCard
              title="Task Completion"
              description="Current sprint progress"
              value={80}
              variant="success"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Multi-Step Progress</h3>
          <MultiStepProgress steps={sampleSteps} />
        </div>
      </section>
    </div>
  );
};