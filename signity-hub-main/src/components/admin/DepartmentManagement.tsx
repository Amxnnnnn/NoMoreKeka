import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Loader2,
  AlertTriangle,
  Users,
  User
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment, Department } from "@/services/department.service";
import { getAllUsers } from "@/services/user.service";

interface ExtendedDepartment extends Department {
  employeeCount: number;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
}

interface DepartmentManagementProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

const departmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export function DepartmentManagement({ onUnsavedChanges }: DepartmentManagementProps) {
  const { toast } = useToast();
  
  const [departments, setDepartments] = useState<ExtendedDepartment[]>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ExtendedDepartment | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<ExtendedDepartment | null>(null);

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: "",
      isActive: true,
    },
  });

  // Handle form changes for unsaved changes tracking
  useEffect(() => {
    const subscription = form.watch(() => {
      onUnsavedChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form, onUnsavedChanges]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch departments and users in parallel
        const [departmentsResult, usersResult] = await Promise.all([
          getAllDepartments(),
          getAllUsers()
        ]);
        
        // Transform departments with employee count and manager info
        const transformedDepartments: ExtendedDepartment[] = departmentsResult.departments?.map(dept => {
          const departmentUsers = usersResult.users?.filter(user => user.departmentId === dept.id) || [];
          const employeeCount = departmentUsers.length;
          
          // Find a manager in this department (if any user has MANAGER role)
          const manager = departmentUsers.find(user => user.role === 'MANAGER');
          
          return {
            ...dept,
            employeeCount,
            manager: manager ? {
              id: manager.id,
              name: manager.name,
              email: manager.email,
            } : undefined,
          };
        }) || [];
        
        setDepartments(transformedDepartments);
        
        // Set potential managers (users with MANAGER or HR role)
        const potentialManagers = usersResult.users?.filter(user => 
          user.role === 'MANAGER' || user.role === 'HR' || user.role === 'ADMIN'
        ).map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
        })) || [];
        
        setManagers(potentialManagers);
        
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: "destructive",
          title: "Failed to load departments",
          description: error.message || "Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    form.reset({
      name: "",
      description: "",
      managerId: "",
      isActive: true,
    });
    setShowDialog(true);
  };

  const handleEditDepartment = (department: ExtendedDepartment) => {
    setEditingDepartment(department);
    form.reset({
      name: department.name,
      description: department.description || "",
      managerId: department.manager?.id || "",
      isActive: department.isActive,
    });
    setShowDialog(true);
  };

  const handleDeleteDepartment = (department: ExtendedDepartment) => {
    setDepartmentToDelete(department);
    setShowDeleteDialog(true);
  };

  const onSubmit = async (data: DepartmentFormData) => {
    setIsSaving(true);

    try {
      const departmentData = {
        name: data.name,
        description: data.description || undefined,
        managerId: data.managerId || undefined,
        isActive: data.isActive,
      };

      if (editingDepartment) {
        // Update existing department
        const result = await updateDepartment(editingDepartment.id, departmentData);
        
        if (result.success) {
          const manager = data.managerId 
            ? managers.find(m => m.id === data.managerId)
            : undefined;
          
          const updatedDepartment: ExtendedDepartment = {
            ...editingDepartment,
            ...result.department,
            manager,
          };
          
          setDepartments(prev => prev.map(dept => 
            dept.id === editingDepartment.id ? updatedDepartment : dept
          ));
          
          toast({
            title: "Department updated",
            description: `${data.name} has been updated successfully.`,
          });
        }
      } else {
        // Create new department
        const result = await createDepartment(departmentData);
        
        if (result.success) {
          const manager = data.managerId 
            ? managers.find(m => m.id === data.managerId)
            : undefined;
          
          const newDepartment: ExtendedDepartment = {
            ...result.department,
            employeeCount: 0,
            manager,
          };
          
          setDepartments(prev => [...prev, newDepartment]);
          
          toast({
            title: "Department created",
            description: `${data.name} has been created successfully.`,
          });
        }
      }

      setShowDialog(false);
      onUnsavedChanges(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save department",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      setIsSaving(true);
      
      const result = await deleteDepartment(departmentToDelete.id);
      
      if (result.success) {
        setDepartments(prev => prev.filter(dept => dept.id !== departmentToDelete.id));
        
        toast({
          title: "Department deleted",
          description: `${departmentToDelete.name} has been deleted successfully.`,
        });
      }
      
      setShowDeleteDialog(false);
      setDepartmentToDelete(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete department",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Table columns
  const columns: ColumnDef<ExtendedDepartment>[] = [
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">{department.name}</p>
              {department.description && (
                <p className="text-sm text-muted-foreground">{department.description}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "manager",
      header: "Manager",
      cell: ({ row }) => {
        const manager = row.original.manager;
        return manager ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
              {manager.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{manager.name}</p>
              <p className="text-xs text-muted-foreground">{manager.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">No manager assigned</span>
        );
      },
    },
    {
      accessorKey: "employeeCount",
      header: "Employees",
      cell: ({ getValue }) => {
        const count = getValue() as number;
        return (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{count}</span>
          </div>
        );
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
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return <span>{new Date(date).toLocaleDateString()}</span>;
      },
    },
    createActionsColumn<ExtendedDepartment>([
      {
        label: "Edit",
        onClick: handleEditDepartment,
      },
      {
        label: "Delete",
        onClick: handleDeleteDepartment,
        variant: "destructive",
        disabled: (department) => department.employeeCount > 0,
      },
    ]),
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 bg-muted rounded w-32 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Departments</h3>
          <p className="text-sm text-muted-foreground">
            Manage organizational departments and their structure.
          </p>
        </div>
        <Button onClick={handleAddDepartment} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Department
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={departments}
        searchKey="name"
        searchPlaceholder="Search departments..."
        emptyMessage="No departments found."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              {editingDepartment ? "Edit Department" : "Add Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment 
                ? "Update the department information below."
                : "Create a new department for your organization."
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering" {...field} />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this department..."
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
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Manager (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <User className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Manager</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                  {manager.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{manager.name}</p>
                                  <p className="text-xs text-muted-foreground">{manager.email}</p>
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

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between pt-6">
                      <FormLabel>Active Department</FormLabel>
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
            </form>
          </Form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
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
                  {editingDepartment ? "Update" : "Create"}
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
              Delete Department
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{departmentToDelete?.name}"? 
              {departmentToDelete?.employeeCount && departmentToDelete.employeeCount > 0 ? (
                <span className="text-destructive font-medium">
                  <br />This department has {departmentToDelete.employeeCount} employee(s). 
                  Please reassign them before deleting.
                </span>
              ) : (
                " This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteDepartment}
              disabled={isSaving || (departmentToDelete?.employeeCount || 0) > 0}
              className="gap-2"
            >
              {isSaving ? (
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