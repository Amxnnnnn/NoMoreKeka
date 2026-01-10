import * as React from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  Filter,
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { worklogService, WorkLogQueryParams } from "@/services/worklog.service";
import { useAuthStore } from "@/stores/authStore";

interface WorkLogExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId?: string;
  userId?: string;
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  startDate?: Date;
  endDate?: Date;
  includeApproved: boolean;
  includePending: boolean;
  includeProjects: boolean;
  includeTasks: boolean;
  groupBy: 'user' | 'project' | 'date' | 'none';
  timePeriod: 'custom' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month';
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

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV File', icon: FileText, description: 'Comma-separated values for spreadsheet applications' },
  { value: 'excel', label: 'Excel File', icon: FileSpreadsheet, description: 'Microsoft Excel format with formatting' },
  { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Formatted report for printing and sharing' },
];

export const WorkLogExport: React.FC<WorkLogExportProps> = ({
  open,
  onOpenChange,
  teamId,
  userId,
}) => {
  const [exportOptions, setExportOptions] = React.useState<ExportOptions>({
    format: 'csv',
    includeApproved: true,
    includePending: true,
    includeProjects: true,
    includeTasks: true,
    groupBy: 'user',
    timePeriod: 'this_month',
  });
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportPreview, setExportPreview] = React.useState<any>(null);

  const { user } = useAuthStore();

  const getDateRange = (period: string): { startDate: Date; endDate: Date } => {
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
        startDate = exportOptions.startDate || subDays(now, 7);
        endDate = exportOptions.endDate || now;
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return { startDate, endDate };
  };

  const generatePreview = React.useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRange(exportOptions.timePeriod);
      
      const params: WorkLogQueryParams = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        limit: 5, // Preview only first 5 records
      };

      // Add approval status filters
      if (exportOptions.includeApproved && !exportOptions.includePending) {
        params.isApproved = true;
      } else if (!exportOptions.includeApproved && exportOptions.includePending) {
        params.isApproved = false;
      }

      const result = teamId || userId
        ? await worklogService.getTeamWorkLogs(params)
        : await worklogService.getWorkLogs(params);

      if (result.success) {
        setExportPreview({
          data: result.data,
          totalRecords: result.data.length,
          dateRange: { startDate, endDate },
        });
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  }, [exportOptions, teamId, userId]);

  React.useEffect(() => {
    if (open) {
      generatePreview();
    }
  }, [open, generatePreview]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { startDate, endDate } = getDateRange(exportOptions.timePeriod);
      
      const params: WorkLogQueryParams = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        limit: 1000, // Export up to 1000 records
      };

      // Add approval status filters
      if (exportOptions.includeApproved && !exportOptions.includePending) {
        params.isApproved = true;
      } else if (!exportOptions.includeApproved && exportOptions.includePending) {
        params.isApproved = false;
      }

      const result = teamId || userId
        ? await worklogService.getTeamWorkLogs(params)
        : await worklogService.getWorkLogs(params);

      if (result.success) {
        await downloadExport(result.data, exportOptions);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to export work logs:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExport = async (data: any[], options: ExportOptions) => {
    const { startDate, endDate } = getDateRange(options.timePeriod);
    const filename = `worklog-export-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}`;

    switch (options.format) {
      case 'csv':
        downloadCSV(data, filename, options);
        break;
      case 'excel':
        downloadExcel(data, filename, options);
        break;
      case 'pdf':
        downloadPDF(data, filename, options);
        break;
    }
  };

  const downloadCSV = (data: any[], filename: string, options: ExportOptions) => {
    const headers = ['Date', 'Employee', 'Hours', 'Description', 'Type', 'Status'];
    if (options.includeProjects) headers.push('Project');
    if (options.includeTasks) headers.push('Task');

    const csvContent = [
      headers.join(','),
      ...data.map(row => {
        const values = [
          format(new Date(row.date), 'yyyy-MM-dd'),
          `"${row.user?.name || 'Unknown'}"`,
          row.hoursWorked,
          `"${row.description.replace(/"/g, '""')}"`,
          row.logType,
          row.isApproved ? 'Approved' : 'Pending'
        ];
        
        if (options.includeProjects) {
          values.push(`"${row.project?.name || '-'}"`);
        }
        if (options.includeTasks) {
          values.push(`"${row.task?.title || '-'}"`);
        }
        
        return values.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const downloadExcel = (data: any[], filename: string, options: ExportOptions) => {
    // For now, we'll use CSV format as Excel export would require additional libraries
    // In a real implementation, you'd use libraries like xlsx or exceljs
    downloadCSV(data, filename, options);
  };

  const downloadPDF = (data: any[], filename: string, options: ExportOptions) => {
    // For now, we'll create a simple HTML report and print it
    // In a real implementation, you'd use libraries like jsPDF or puppeteer
    const { startDate, endDate } = getDateRange(options.timePeriod);
    
    const htmlContent = `
      <html>
        <head>
          <title>Work Log Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Work Log Report</h1>
          <div class="summary">
            <p><strong>Period:</strong> ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}</p>
            <p><strong>Total Records:</strong> ${data.length}</p>
            <p><strong>Total Hours:</strong> ${data.reduce((sum, row) => sum + row.hoursWorked, 0).toFixed(2)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Hours</th>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
                ${options.includeProjects ? '<th>Project</th>' : ''}
                ${options.includeTasks ? '<th>Task</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  <td>${format(new Date(row.date), 'MMM dd, yyyy')}</td>
                  <td>${row.user?.name || 'Unknown'}</td>
                  <td>${row.hoursWorked}</td>
                  <td>${row.description}</td>
                  <td>${row.logType}</td>
                  <td>${row.isApproved ? 'Approved' : 'Pending'}</td>
                  ${options.includeProjects ? `<td>${row.project?.name || '-'}</td>` : ''}
                  ${options.includeTasks ? `<td>${row.task?.title || '-'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatHours = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Work Logs</span>
          </DialogTitle>
          <DialogDescription>
            Configure export settings and download work log data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Export Format</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {EXPORT_FORMATS.map((format) => (
                <Card
                  key={format.value}
                  className={`cursor-pointer transition-colors ${
                    exportOptions.format === format.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <format.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-muted-foreground">{format.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Time Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select
                value={exportOptions.timePeriod}
                onValueChange={(value) => 
                  setExportOptions(prev => ({ ...prev, timePeriod: value as any }))
                }
              >
                <SelectTrigger>
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
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Group By</label>
              <Select
                value={exportOptions.groupBy}
                onValueChange={(value) => 
                  setExportOptions(prev => ({ ...prev, groupBy: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="user">Group by Employee</SelectItem>
                  <SelectItem value="project">Group by Project</SelectItem>
                  <SelectItem value="date">Group by Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {exportOptions.timePeriod === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <DatePicker
                  date={exportOptions.startDate}
                  onDateChange={(date) => 
                    setExportOptions(prev => ({ ...prev, startDate: date }))
                  }
                  placeholder="Select start date"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <DatePicker
                  date={exportOptions.endDate}
                  onDateChange={(date) => 
                    setExportOptions(prev => ({ ...prev, endDate: date }))
                  }
                  placeholder="Select end date"
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Filter Options */}
          <div>
            <label className="text-sm font-medium mb-3 block">Include in Export</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeApproved"
                    checked={exportOptions.includeApproved}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeApproved: checked as boolean }))
                    }
                  />
                  <label htmlFor="includeApproved" className="text-sm">
                    Approved work logs
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePending"
                    checked={exportOptions.includePending}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includePending: checked as boolean }))
                    }
                  />
                  <label htmlFor="includePending" className="text-sm">
                    Pending work logs
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeProjects"
                    checked={exportOptions.includeProjects}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeProjects: checked as boolean }))
                    }
                  />
                  <label htmlFor="includeProjects" className="text-sm">
                    Project information
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTasks"
                    checked={exportOptions.includeTasks}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeTasks: checked as boolean }))
                    }
                  />
                  <label htmlFor="includeTasks" className="text-sm">
                    Task information
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Preview */}
          {exportPreview && (
            <div>
              <label className="text-sm font-medium mb-3 block">Export Preview</label>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Preview Data</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>
                        Period: {format(exportPreview.dateRange.startDate, 'MMM dd')} - {format(exportPreview.dateRange.endDate, 'MMM dd, yyyy')}
                      </span>
                      <span>
                        Records: {exportPreview.totalRecords}
                      </span>
                      <span>
                        Total Hours: {formatHours(exportPreview.data.reduce((sum: number, row: any) => sum + row.hoursWorked, 0))}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exportPreview.data.slice(0, 3).map((row: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium">
                            {format(new Date(row.date), 'MMM dd')}
                          </span>
                          <span className="text-sm">{row.user?.name || 'Unknown'}</span>
                          <Badge variant="outline">{formatHours(row.hoursWorked)}</Badge>
                          <Badge variant={row.isApproved ? 'default' : 'secondary'}>
                            {row.isApproved ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />Approved</>
                            ) : (
                              <><AlertCircle className="h-3 w-3 mr-1" />Pending</>
                            )}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {row.description}
                        </div>
                      </div>
                    ))}
                    {exportPreview.data.length > 3 && (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        ... and {exportPreview.data.length - 3} more records
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || (!exportOptions.includeApproved && !exportOptions.includePending)}
          >
            {isExporting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </div>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};