import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { DataTable, createActionsColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  defaultDays: number;
  isActive: boolean;
  color?: string;
  requiresApproval: boolean;
  maxConsecutiveDays?: number;
  minAdvanceNotice?: number; // days
  createdAt: string;
  updatedAt: string;
}

interface LeaveTypeManagementProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

const leaveTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  defaultDays: z.number().min(0, "Default days must be 0 or greater").max(365, "Default days cannot exceed 365"),
  isActive: z.boolean(),
  color: z.string().optional(),
  requiresApproval: z.boolean(),
  maxConsecutiveDays: z.number().min(1, "Must be at least 1 day").max(365, "Cannot exceed 365 days").optional(),
  minAdvanceNotice: z.number().min(0, "Must be 0 or greater").max(365, "Cannot exceed 365 days").optional(),
});

type LeaveTypeFormData = z.infer<typeof leaveTypeSchema>;

// Mock data - replace with actual API calls
const mockLeaveTypes: LeaveType[] = [
  {
    id: "1",
    name: "Annual Leave",
    description: "Yearly vacation days",
    defaultDays: 20,
    isActive: true,
    color: "#3b82f6",
    requiresApproval: true,
    maxConsecutiveDays: 10,
    minAdvanceNotice: 7,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Sick Leave",
    description: "Medical leave for illness",
    defaultDays: 10,
    isActive: true,
    color: "#ef4444",
    requiresApproval: false,
    maxConsecutiveDays: 5,
    minAdvanceNotice: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Maternity Leave",
    description: "Leave for new mothers",
    defaultDays: 90,
    isActive: true,
    color: "#f59e0b",
    requiresApproval: true,
    maxConsecutiveDays: 90,
    minAdvanceNotice: 30,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

const colorOptions = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#10b981" },
  { label: "Yellow", value: "#f59e0b" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Pink", value: "#ec4899" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Gray", value: "#6b7280" },
];

export function LeaveTypeManagement({ onUnsavedChanges }: LeaveTypeManagementProps) {
  const { toast } = useToast();
  
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(mockLeaveTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<LeaveType | null>(null);

  const form = useForm<LeaveTypeFormData>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultDays: 0,
      isActive: true,
      color: "#3b82f6",
      requiresApproval: true,
      maxConsecutiveDays: undefined,
      minAdvanceNotice: undefined,
    },
  });

  // Handle form changes for unsaved changes tracking
  useEffect(() => {
    const subscription = form.watch(() => {
      onUnsavedChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form, onUnsavedChanges]);

  const handleAddLeaveType = () => {
    setEditingLeaveType(null);
    form.reset({
      name: "",
      description: "",
      defaultDays: 0,
      isActive: true,
      color: "#3b82f6",
      requiresApproval: true,
      maxConsecutiveDays: undefined,
      minAdvanceNotice: undefined,
    });
    setShowDialog(true);
  };

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    form.reset({
      name: leaveType.name,
      description: leaveType.description || "",
      defaultDays: leaveType.defaultDays,
      isActive: leaveType.isActive,
      color: leaveType.color || "#3b82f6",
      requiresApproval: leaveType.requiresApproval,
      maxConsecutiveDays: leaveType.maxConsecutiveDays,
      minAdvanceNotice: leaveType.minAdvanceNotice,
    });
    setShowDialog(true);
  };

  const handleDeleteLeaveType = (leaveType: LeaveType) => {
    setLeaveTypeToDelete(leaveType);
    setShowDeleteDialog(true);
  };

  const onSubmit = async (data: LeaveTypeFormData) => {
    setIsLoading(true);

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingLeaveType) {
        // Update existing leave type
        const updatedLeaveType: LeaveType = {
          ...editingLeaveType,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        
        setLeaveTypes(prev => prev.map(lt => 
          lt.id === editingLeaveType.id ? updatedLeaveType : lt
        ));
        
        toast({
          title: "Leave type updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        // Create new leave type
        const newLeaveType: LeaveType = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setLeaveTypes(prev => [...prev, newLeaveType]);
        
        toast({
          title: "Leave type created",
          description: `${data.name} has been created successfully.`,
        });
      }

      setShowDialog(false);
      onUnsavedChanges(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save leave type",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteLeaveType = async () => {
    if (!leaveTypeToDelete) return;

    try {
      setIsLoading(true);
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLeaveTypes(prev => prev.filter(lt => lt.id !== leaveTypeToDelete.id));
      
      toast({
        title: "Leave type deleted",
        description: `${leaveTypeToDelete.name} has been deleted successfully.`,
      });
      
      setShowDeleteDialog(false);
      setLeaveTypeToDelete(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete leave type",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Table columns
  const columns: ColumnDef<LeaveType>[] = [
    {
      accessorKey: "name",
      header: "Leave Type",
      cell: ({ row }) => {
        const leaveType = row.original;
        return (
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: leaveType.color || "#3b82f6" }}
            />
            <div>
              <p className="font-medium">{leaveType.name}</p>
              {leaveType.description && (
                <p className="text-sm text-muted-foreground">{leaveType.description}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "defaultDays",
      header: "Default Days",
      cell: ({ getValue }) => {
        const days = getValue() as number;
        return <span className="font-medium">{days} days</span>;
      },
    },
    {
      accessorKey: "requiresApproval",
      header: "Approval",
      cell: ({ getValue }) => {
        const requiresApproval = getValue() as boolean;
        return (
          <Badge variant={requiresApproval ? "default" : "secondary"}>
            {requiresApproval ? "Required" : "Not Required"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "maxConsecutiveDays",
      header: "Max Consecutive",
      cell: ({ getValue }) => {
        const maxDays = getValue() as number | undefined;
        return maxDays ? `${maxDays} days` : "No limit";
      },
    },
    {
      accessorKey: "minAdvanceNotice",
      header: "Advance Notice",
      cell: ({ getValue }) => {
        const minNotice = getValue() as number | undefined;
        return minNotice ? `${minNotice} days` : "No requirement";
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    createActionsColumn<LeaveType>([
      {
        label: "Edit",
        onClick: handleEditLeaveType,
      },
      {
        label: "Delete",
        onClick: handleDeleteLeaveType,
        variant: "destructive",
      },
    ]),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Leave Types</h3>
          <p className="text-sm text-muted-foreground">
            Manage different types of leave available to employees.
          </p>
        </div>
        <Button onClick={handleAddLeaveType} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Leave Type
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={leaveTypes}
        searchKey="name"
        searchPlaceholder="Search leave types..."
        emptyMessage="No leave types found."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              {editingLeaveType ? "Edit Leave Type" : "Add Leave Type"}
            </DialogTitle>
            <DialogDescription>
              {editingLeaveType 
                ? "Update the leave type information below."
                : "Create a new leave type for your organization."
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Annual Leave" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Days</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="20" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this leave type..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: field.value }}
                          />
                          <select 
                            className="flex-1 px-3 py-2 border rounded-md"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {colorOptions.map(color => (
                              <option key={color.value} value={color.value}>
                                {color.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxConsecutiveDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Consecutive Days (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minAdvanceNotice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Advance Notice (Days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="7" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requiresApproval"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Requires Approval</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingLeaveType ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              Delete Leave Type
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{leaveTypeToDelete?.name}"? 
              This action cannot be undone and may affect existing leave records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteLeaveType}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}