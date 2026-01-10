import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isToday, isFuture } from "date-fns";
import { Clock, Play, Square, Timer, AlertCircle, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { worklogService, CreateWorkLogData } from "@/services/worklog.service";
import { projectService, Project } from "@/services/project.service";
import { taskService, Task } from "@/services/task.service";
import { useDataStore } from "@/stores/dataStore";

const workLogSchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
  hoursWorked: z.number().min(0.25, "Minimum 15 minutes (0.25 hours)").max(24, "Maximum 24 hours per day"),
  description: z.string().min(10, "Please provide a detailed description (minimum 10 characters)"),
  logType: z.enum(['DAILY', 'WEEKLY', 'PROJECT', 'TASK'], {
    required_error: "Please select a log type",
  }),
}).refine((data) => {
  if (data.logType === 'PROJECT' && !data.projectId) {
    return false;
  }
  if (data.logType === 'TASK' && !data.taskId) {
    return false;
  }
  return true;
}, {
  message: "Project is required for project logs, Task is required for task logs",
  path: ["projectId"],
});

type WorkLogFormData = z.infer<typeof workLogSchema>;

interface WorkLogEntryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  initialData?: Partial<WorkLogFormData>;
}

// Work log templates for common activities
const WORK_LOG_TEMPLATES = [
  {
    id: 'meeting',
    name: 'Team Meeting',
    description: 'Attended team meeting to discuss project progress and upcoming milestones.',
    logType: 'DAILY' as const,
    estimatedHours: 1,
  },
  {
    id: 'development',
    name: 'Development Work',
    description: 'Worked on feature development including coding, testing, and documentation.',
    logType: 'PROJECT' as const,
    estimatedHours: 4,
  },
  {
    id: 'review',
    name: 'Code Review',
    description: 'Reviewed code changes and provided feedback to team members.',
    logType: 'DAILY' as const,
    estimatedHours: 1,
  },
  {
    id: 'planning',
    name: 'Sprint Planning',
    description: 'Participated in sprint planning session to estimate and prioritize tasks.',
    logType: 'DAILY' as const,
    estimatedHours: 2,
  },
];

export const WorkLogEntryForm: React.FC<WorkLogEntryFormProps> = ({
  onSuccess,
  onCancel,
  className,
  initialData,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [timerStart, setTimerStart] = React.useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

  const form = useForm<WorkLogFormData>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      date: new Date(),
      hoursWorked: 0,
      description: "",
      logType: 'DAILY',
      ...initialData,
    },
  });

  const watchedValues = form.watch();

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timerStart) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - timerStart.getTime()) / (1000 * 60 * 60); // Convert to hours
        setElapsedTime(elapsed);
        form.setValue('hoursWorked', Math.round(elapsed * 4) / 4); // Round to nearest 15 minutes
      }, 15000); // Update every 15 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timerStart, form]);

  // Load projects on component mount
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        const result = await projectService.getMyProjects();
        if (result.success) {
          setProjects(result.data);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      }
    };

    loadProjects();
  }, []);

  // Load tasks when project changes
  React.useEffect(() => {
    const loadTasks = async () => {
      if (watchedValues.projectId) {
        try {
          const result = await taskService.getTasks({ projectId: watchedValues.projectId });
          if (result.success) {
            setTasks(result.data);
          }
        } catch (error) {
          console.error("Failed to load tasks:", error);
        }
      } else {
        setTasks([]);
      }
    };

    loadTasks();
  }, [watchedValues.projectId]);

  // Update selected project
  React.useEffect(() => {
    if (watchedValues.projectId) {
      const project = projects.find(p => p.id === watchedValues.projectId);
      setSelectedProject(project || null);
    } else {
      setSelectedProject(null);
    }
  }, [watchedValues.projectId, projects]);

  const startTimer = () => {
    setTimerStart(new Date());
    setIsTimerRunning(true);
    setElapsedTime(0);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerStart(null);
  };

  const applyTemplate = (template: typeof WORK_LOG_TEMPLATES[0]) => {
    form.setValue('description', template.description);
    form.setValue('logType', template.logType);
    form.setValue('hoursWorked', template.estimatedHours);
  };

  const onSubmit = async (data: WorkLogFormData) => {
    setIsSubmitting(true);
    
    try {
      const workLogData: CreateWorkLogData = {
        projectId: data.projectId,
        taskId: data.taskId,
        date: format(data.date, "yyyy-MM-dd"),
        hoursWorked: data.hoursWorked,
        description: data.description,
        logType: data.logType,
      };

      const result = await worklogService.logWork(workLogData);
      
      if (result.success) {
        form.reset();
        stopTimer();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to create work log:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatElapsedTime = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const canSelectFutureDate = !isFuture(watchedValues.date) || isToday(watchedValues.date);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Log Work Time</span>
          {isTimerRunning && (
            <Badge variant="secondary" className="ml-auto">
              <Timer className="h-3 w-3 mr-1" />
              {formatElapsedTime(elapsedTime)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Timer Controls */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium">Time Tracker</div>
                  <div className="text-muted-foreground">
                    {isTimerRunning ? `Running: ${formatElapsedTime(elapsedTime)}` : 'Not running'}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {!isTimerRunning ? (
                  <Button type="button" variant="outline" size="sm" onClick={startTimer}>
                    <Play className="h-4 w-4 mr-1" />
                    Start Timer
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={stopTimer}>
                    <Square className="h-4 w-4 mr-1" />
                    Stop Timer
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {WORK_LOG_TEMPLATES.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Work Date</FormLabel>
                  <DatePicker
                    date={field.value}
                    onDateChange={field.onChange}
                    placeholder="Select work date"
                  />
                  {isFuture(field.value) && !isToday(field.value) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Cannot log work for future dates.
                      </AlertDescription>
                    </Alert>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Log Type Selection */}
            <FormField
              control={form.control}
              name="logType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Log Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select log type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily Work</SelectItem>
                      <SelectItem value="PROJECT">Project Work</SelectItem>
                      <SelectItem value="TASK">Task Work</SelectItem>
                      <SelectItem value="WEEKLY">Weekly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Selection (for PROJECT and TASK log types) */}
            {(watchedValues.logType === 'PROJECT' || watchedValues.logType === 'TASK') && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{project.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {project.status}
                              </Badge>
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

            {/* Task Selection (for TASK log type) */}
            {watchedValues.logType === 'TASK' && watchedValues.projectId && (
              <FormField
                control={form.control}
                name="taskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{task.title}</span>
                              <div className="flex space-x-1 ml-2">
                                <Badge variant="outline" size="sm">
                                  {task.status}
                                </Badge>
                                <Badge variant="secondary" size="sm">
                                  {task.priority}
                                </Badge>
                              </div>
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

            {/* Hours Worked */}
            <FormField
              control={form.control}
              name="hoursWorked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Worked</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="24"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Work Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work you performed..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of the work performed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Work Summary */}
            {watchedValues.hoursWorked > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Work Log Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{formatElapsedTime(watchedValues.hoursWorked)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <span className="ml-2 font-medium">
                      {format(watchedValues.date, "MMM dd, yyyy")}
                    </span>
                  </div>
                  {selectedProject && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Project:</span>
                      <span className="ml-2 font-medium">{selectedProject.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting || !canSelectFutureDate}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Work Log"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};