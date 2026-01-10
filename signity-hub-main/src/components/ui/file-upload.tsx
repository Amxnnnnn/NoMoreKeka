import * as React from "react";
import { Upload, X, File, Image, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export interface FileUploadFile {
  file: File;
  id: string;
  progress?: number;
  error?: string;
  url?: string;
}

export interface FileUploadProps {
  files?: FileUploadFile[];
  onFilesChange?: (files: FileUploadFile[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  dropzoneText?: string;
  browseText?: string;
  showPreview?: boolean;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    files = [],
    onFilesChange,
    onUpload,
    accept,
    multiple = true,
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5,
    disabled,
    className,
    dropzoneText = "Drag & drop files here, or click to browse",
    browseText = "Browse Files",
    showPreview = true,
  }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      handleFiles(selectedFiles);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleFiles = (newFiles: File[]) => {
      const validFiles: FileUploadFile[] = [];
      
      for (const file of newFiles) {
        // Check file size
        if (file.size > maxSize) {
          console.warn(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`);
          continue;
        }

        // Check max files limit
        if (files.length + validFiles.length >= maxFiles) {
          console.warn(`Maximum ${maxFiles} files allowed`);
          break;
        }

        // Check if file already exists
        const fileExists = files.some(f => f.file.name === file.name && f.file.size === file.size);
        if (fileExists) {
          console.warn(`File ${file.name} already exists`);
          continue;
        }

        validFiles.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          progress: 0,
        });
      }

      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles];
        onFilesChange?.(updatedFiles);
        
        // Auto-upload if onUpload is provided
        if (onUpload) {
          handleUpload(validFiles.map(f => f.file));
        }
      }
    };

    const handleUpload = async (filesToUpload: File[]) => {
      if (!onUpload) return;

      try {
        await onUpload(filesToUpload);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    };

    const removeFile = (fileId: string) => {
      const updatedFiles = files.filter(f => f.id !== fileId);
      onFilesChange?.(updatedFiles);
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) {
        return <Image className="h-4 w-4" />;
      } else if (file.type.includes('text') || file.type.includes('document')) {
        return <FileText className="h-4 w-4" />;
      }
      return <File className="h-4 w-4" />;
    };

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        {/* Dropzone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragOver && !disabled && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer hover:border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">{dropzoneText}</p>
          <Button variant="outline" size="sm" disabled={disabled}>
            {browseText}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Max file size: {formatFileSize(maxSize)} • Max files: {maxFiles}
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {/* File list */}
        {files.length > 0 && showPreview && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Files ({files.length})</h4>
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(fileItem.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                  </div>
                  {fileItem.error && (
                    <Badge variant="destructive" className="text-xs">
                      Error
                    </Badge>
                  )}
                  {typeof fileItem.progress === 'number' && fileItem.progress < 100 && (
                    <Badge variant="secondary" className="text-xs">
                      {fileItem.progress}%
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileItem.id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

export { FileUpload };