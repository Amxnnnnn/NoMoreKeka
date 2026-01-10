import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Play,
  Eye,
  Download,
  Loader2,
  Database,
  Filter,
  BarChart3,
  Table,
  PieChart,
  LineChart,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface DataSource {
  id: string;
  name: string;
  type: string;
  fields: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

interface ReportField {
  id: string;
  name: string;
  type: string;
  aggregation?: string;
  filter?: string;
  sort?: 'asc' | 'desc';
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'table';
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
}

const reportBuilderSchema = z.object({
  name: z.string().min(2, "Report name must be at least 2 characters"),
  description: z.string().optional(),
  dataSource: z.string().min(1, "Please select a data source"),
  outputFormat: z.array(z.string()).min(1, "Select at least one output format"),
  includeCharts: z.boolean(),
  chartType: z.string().optional(),
  schedulingEnabled: z.boolean(),
  frequency: z.string().optional(),
});

type ReportBuilderFormData = z.infer<typeof reportBuilderSchema>;

// Mock data sources
const dataSources: DataSource[] = [
  {
    id: "employees",
    name: "Employees",
    type: "table",
    fields: [
      { name: "id", type: "number", description: "Employee ID" },
      { name: "name", type: "string", description: "Full Name" },
      { name: "email", type: "string", description: "Email Address" },
      { name: "role", type: "string", description: "Job Role" },
      { name: "department", type: "string", description: "Department" },
      { name: "hire_date", type: "date", description: "Hire Date" },
      { name: "salary", type: "number", description: "Salary" },
      { name: "status", type: "string", description: "Employment Status" },
    ],
  },
  {
    id: "leaves",
    name: "Leave Records",
    type: "table",
    fields: [
      { name: "id", type: "number", description: "Leave ID" },
      { name: "employee_id", type: "number", description: "Employee ID" },
      { name: "leave_type", type: "string", description: "Type of Leave" },
      { name: "start_date", type: "date", description: "Start Date" },
      { name: "end_date", type: "date", description: "End Date" },
      { name: "days", type: "number", description: "Number of Days" },
      { name: "status", type: "string", description: "Approval Status" },
      { name: "applied_at", type: "date", description: "Application Date" },
    ],
  },
  {
    id: "worklogs",
    name: "Work Logs",
    type: "table",
    fields: [
      { name: "id", type: "number", description: "Work Log ID" },
      { name: "employee_id", type: "number", description: "Employee ID" },
      { name: "project_id", type: "number", description: "Project ID" },
      { name: "date", type: "date", description: "Work Date" },
      { name: "hours", type: "number", description: "Hours Worked" },
      { name: "description", type: "string", description: "Work Description" },
      { name: "status", type: "string", description: "Approval Status" },
    ],
  },
];

const outputFormats = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
];

const chartTypes = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChart },
  { value: "pie", label: "Pie Chart", icon: PieChart },
  { value: "table", label: "Data Table", icon: Table },
];

const aggregationTypes = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
];

export function ReportBuilder() {
  const { toast } = useToast();
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [selectedFields, setSelectedFields] = useState<ReportField[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({ type: 'table' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ReportBuilderFormData>({
    resolver: zodResolver(reportBuilderSchema),
    defaultValues: {
      name: "",
      description: "",
      dataSource: "",
      outputFormat: ["pdf"],
      includeCharts: false,
      chartType: "table",
      schedulingEnabled: false,
      frequency: "weekly",
    },
  });

  const handleDataSourceChange = (dataSourceId: string) => {
    const dataSource = dataSources.find(ds => ds.id === dataSourceId);
    setSelectedDataSource(dataSource || null);
    setSelectedFields([]);
    form.setValue("dataSource", dataSourceId);
  };

  const handleAddField = (field: { name: string; type: string; description: string }) => {
    const newField: ReportField = {
      id: `${field.name}_${Date.now()}`,
      name: field.name,
      type: field.type,
    };
    setSelectedFields(prev => [...prev, newField]);
  };

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<ReportField>) => {
    setSelectedFields(prev => prev.map(f => 
      f.id === fieldId ? { ...f, ...updates } : f
    ));
  };

  const handleGenerateReport = async () => {
    if (selectedFields.length === 0) {
      toast({
        variant: "destructive",
        title: "No fields selected",
        description: "Please select at least one field for your report.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Report generated successfully",
        description: "Your custom report is ready for download.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to generate report",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = async (data: ReportBuilderFormData) => {
    setIsSaving(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report template saved",
        description: `Template "${data.name}" has been saved successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save template",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Report Builder</h3>
          <p className="text-sm text-muted-foreground">
            Create custom reports with drag-and-drop interface and flexible data visualization.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => form.handleSubmit(handleSaveTemplate)()}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Template
              </>
            )}
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || selectedFields.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Custom Report" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the report..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Source</FormLabel>
                        <Select onValueChange={handleDataSourceChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <Database className="w-4 h-4 mr-2" />
                              <SelectValue placeholder="Select data source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dataSources.map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="outputFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Output Formats</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-2">
                            {outputFormats.map((format) => (
                              <label key={format.value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value.includes(format.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...field.value, format.value]);
                                    } else {
                                      field.onChange(field.value.filter(f => f !== format.value));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{format.label}</span>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeCharts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Include Charts</FormLabel>
                          <FormDescription>
                            Add data visualizations to the report
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("includeCharts") && (
                    <FormField
                      control={form.control}
                      name="chartType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chart Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select chart type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {chartTypes.map((chart) => (
                                <SelectItem key={chart.value} value={chart.value}>
                                  <div className="flex items-center gap-2">
                                    <chart.icon className="w-4 h-4" />
                                    {chart.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Available Fields */}
          {selectedDataSource && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Available Fields
                </CardTitle>
                <CardDescription>
                  Drag fields to add them to your report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedDataSource.fields.map((field) => (
                    <div
                      key={field.name}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleAddField(field)}
                    >
                      <div>
                        <p className="font-medium text-sm">{field.name}</p>
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Report Builder Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Selected Fields & Configuration
              </CardTitle>
              <CardDescription>
                Configure your selected fields with aggregations, filters, and sorting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No fields selected</p>
                  <p className="text-sm">Select a data source and add fields to start building your report</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{field.name}</span>
                          <Badge variant="outline">{field.type}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {field.type === 'number' && (
                          <Select
                            value={field.aggregation || ""}
                            onValueChange={(value) => handleFieldUpdate(field.id, { aggregation: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Aggregation" />
                            </SelectTrigger>
                            <SelectContent>
                              {aggregationTypes.map((agg) => (
                                <SelectItem key={agg.value} value={agg.value}>
                                  {agg.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        <Input
                          placeholder="Filter condition"
                          value={field.filter || ""}
                          onChange={(e) => handleFieldUpdate(field.id, { filter: e.target.value })}
                        />
                        
                        <Select
                          value={field.sort || ""}
                          onValueChange={(value) => handleFieldUpdate(field.id, { sort: value as 'asc' | 'desc' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sort order" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Report Preview
              </CardTitle>
              <CardDescription>
                Preview of your report structure and data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No preview available</p>
                  <p className="text-sm">Add fields to see a preview of your report</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 border-b">
                      <h4 className="font-medium">Report Structure</h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {selectedFields.map((field) => (
                          <div key={field.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <span className="text-sm font-medium">{field.name}</span>
                            {field.aggregation && (
                              <Badge variant="secondary" className="text-xs">
                                {field.aggregation}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>• Data Source: {selectedDataSource?.name}</p>
                    <p>• Fields: {selectedFields.length}</p>
                    <p>• Output Formats: {form.watch("outputFormat").join(", ")}</p>
                    {form.watch("includeCharts") && (
                      <p>• Chart Type: {form.watch("chartType")}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}