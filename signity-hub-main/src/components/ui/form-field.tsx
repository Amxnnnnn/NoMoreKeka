import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
}

const FormFieldWrapper = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    label,
    description,
    error,
    required,
    children,
    className,
    labelClassName,
    descriptionClassName,
    errorClassName,
  }, ref) => {
    const fieldId = React.useId();

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive",
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          {React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            'aria-describedby': description ? `${fieldId}-description` : undefined,
            'aria-invalid': !!error,
          })}
        </div>

        {description && (
          <p
            id={`${fieldId}-description`}
            className={cn(
              "text-sm text-muted-foreground",
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}

        {error && (
          <p
            className={cn(
              "text-sm font-medium text-destructive",
              errorClassName
            )}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormFieldWrapper.displayName = "FormFieldWrapper";

export { FormFieldWrapper };