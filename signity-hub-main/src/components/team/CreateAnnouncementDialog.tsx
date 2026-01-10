import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onAnnouncementCreated: (announcement: any) => void;
}

interface AnnouncementData {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  isPinned: boolean;
  tags: string[];
}

export function CreateAnnouncementDialog({ 
  open, 
  onOpenChange, 
  onAnnouncementCreated 
}: CreateAnnouncementDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AnnouncementData>({
    title: "",
    content: "",
    priority: "medium",
    isPinned: false,
    tags: []
  });
  const [newTag, setNewTag] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and content are required.",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Mock API call - in real implementation, call announcement service
      const newAnnouncement = {
        id: Date.now().toString(),
        title: formData.title,
        content: formData.content,
        author: { id: 'current-user', name: 'You' },
        createdAt: new Date(),
        priority: formData.priority,
        isPinned: formData.isPinned,
        readBy: ['current-user'],
        tags: formData.tags
      };
      
      onAnnouncementCreated(newAnnouncement);
      
      // Reset form
      setFormData({
        title: "",
        content: "",
        priority: "medium",
        isPinned: false,
        tags: []
      });
      setNewTag("");
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create announcement",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AnnouncementData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Team Announcement</DialogTitle>
          <DialogDescription>
            Share important information with your team members.
          </DialogDescription>
        </DialogHeader>
        
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter announcement title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Write your announcement content here..."
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              disabled={isLoading}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      Low Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                      Medium Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      High Priority
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="pinned"
                  checked={formData.isPinned}
                  onCheckedChange={(checked) => handleInputChange("isPinned", checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="pinned" className="flex items-center space-x-1 cursor-pointer">
                  <Pin className="w-4 h-4" />
                  <span>Pin announcement</span>
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex space-x-2">
              <Input
                id="tags"
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={isLoading || !newTag.trim()}
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="text-sm text-muted-foreground mb-2">Preview:</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{formData.title || "Announcement Title"}</h4>
                <Badge className={`text-xs ${getPriorityColor(formData.priority)}`}>
                  {formData.priority}
                </Badge>
                {formData.isPinned && <Pin className="w-3 h-3 text-blue-500" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {formData.content || "Announcement content will appear here..."}
              </p>
              {formData.tags.length > 0 && (
                <div className="flex space-x-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Announcement
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}