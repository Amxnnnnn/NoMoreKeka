import { useState } from "react";
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Users, 
  Clock, 
  Building2,
  TrendingUp,
  BarChart3,
  PieChart,
  Filter,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PreBuiltReport {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  lastGenerated?: string;
  frequency: string;
  format: string[];
  estimatedTime: string;
  popularity: number;
}

const preBuiltReports: PreBuiltReport[] = [
  {
    id: "employee-summary",
    name: "Employee Summary Report",
    description: "Comprehensive overview of all employees including roles, departments, and status",
    category: "HR",
    icon: Users,
    lastGenerated: "2024-01-15",
    frequency: "Monthly",
    format: ["PDF", "Excel", "CSV"],
    estimatedTime: "2-3 minutes",
    popularity: 95,
  },
  {
    id: "leave-analytics",
    name: "Leave Analytics Report",
    description: "Detailed analysis of leave patterns, trends, and department-wise breakdowns",
    category: "Leave Management",
    icon: Calendar,
    lastGenerated: "2024-01-14",
    frequency: "Weekly",
    format: ["PDF", "Excel"],
    estimatedTime: "1-2 minutes",
    popularity: 88,
  },
  {
    id: "attendance-tracking",
    name: "Attendance Tracking Report",
    description: "Employee attendance patterns, punctuality metrics, and time tracking analysis",
    category: "Time Tracking",
    icon: Clock,
    lastGenerated: "2024-01-13",
    frequency: "Daily",
    format: ["PDF", "Excel", "CSV"],
    estimatedTime: "3-4 minutes",
    popularity: 92,
  },
  {
    id: "department-performance",
    name: "Department Performance Report",
    description: "Performance metrics, productivity analysis, and resource utilization by department",
    category: "Performance",
    icon: Building2,
    lastGenerated: "2024-01-12",
    frequency: "Monthly",
    format: ["PDF", "PowerPoint"],
    estimatedTime: "4-5 minutes",
    popularity: 78,
  },
  {
    id: "payroll-summary",
    name: "Payroll Summary Report",
    description: "Comprehensive payroll breakdown including salaries, deductions, and benefits",
    category: "Finance",
    icon: TrendingUp,
    lastGenerated: "2024-01-11",
    frequency: "Monthly",
    format: ["PDF", "Excel"],
    estimatedTime: "2-3 minutes",
    popularity: 85,
  },
  {
    id: "recruitment-metrics",
    name: "Recruitment Metrics Report",
    description: "Hiring pipeline analysis, time-to-hire metrics, and recruitment effectiveness",
    category: "Recruitment",
    icon: Users,
    lastGenerated: "2024-01-10",
    frequency: "Quarterly",
    format: ["PDF", "Excel", "PowerPoint"],
    estimatedTime: "3-4 minutes",
    popularity: 72,
  },
  {
    id: "training-compliance",
    name: "Training & Compliance Report",
    description: "Employee training completion rates, compliance status, and certification tracking",
    category: "Training",
    icon: FileText,
    lastGenerated: "2024-01-09",
    frequency: "Monthly",
    format: ["PDF", "Excel"],
    estimatedTime: "2-3 minutes",
    popularity: 68,
  },
  {
    id: "employee-satisfaction",
    name: "Employee Satisfaction Survey",
    description: "Survey results analysis, satisfaction trends, and engagement metrics",
    category: "Engagement",
    icon: BarChart3,
    lastGenerated: "2024-01-08",
    frequency: "Quarterly",
    format: ["PDF", "PowerPoint"],
    estimatedTime: "5-6 minutes",
    popularity: 81,
  },
];

const categories = [
  "All Categories",
  "HR",
  "Leave Management", 
  "Time Tracking",
  "Performance",
  "Finance",
  "Recruitment",
  "Training",
  "Engagement"
];

export function PreBuiltReports() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());

  const filteredReports = preBuiltReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGenerateReport = async (reportId: string, format: string) => {
    setGeneratingReports(prev => new Set(prev).add(reportId));
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report generated successfully",
        description: `Your ${format} report is ready for download.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to generate report",
        description: error.message || "Please try again.",
      });
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handlePreviewReport = (reportId: string) => {
    toast({
      title: "Opening preview",
      description: "Report preview will open in a new window.",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "HR": return Users;
      case "Leave Management": return Calendar;
      case "Time Tracking": return Clock;
      case "Performance": return TrendingUp;
      case "Finance": return TrendingUp;
      case "Recruitment": return Users;
      case "Training": return FileText;
      case "Engagement": return BarChart3;
      default: return FileText;
    }
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 90) return "text-green-600";
    if (popularity >= 80) return "text-blue-600";
    if (popularity >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const IconComponent = report.icon;
          const isGenerating = generatingReports.has(report.id);
          
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {report.category}
                      </Badge>
                    </div>
                  </div>
                  <div className={`text-xs font-medium ${getPopularityColor(report.popularity)}`}>
                    {report.popularity}% ★
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {report.description}
                </CardDescription>
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span>{report.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Time:</span>
                    <span>{report.estimatedTime}</span>
                  </div>
                  {report.lastGenerated && (
                    <div className="flex justify-between">
                      <span>Last Generated:</span>
                      <span>{new Date(report.lastGenerated).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {report.format.map((format) => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewReport(report.id)}
                    className="flex-1 gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                  
                  <div className="flex gap-1">
                    {report.format.map((format) => (
                      <Button
                        key={format}
                        size="sm"
                        onClick={() => handleGenerateReport(report.id, format)}
                        disabled={isGenerating}
                        className="gap-1"
                      >
                        <Download className="w-3 h-3" />
                        {format}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No reports found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse different categories.
          </p>
        </div>
      )}
    </div>
  );
}