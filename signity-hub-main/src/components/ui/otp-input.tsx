import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
  placeholder?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = false,
  className,
  placeholder = '•'
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Focus management when value changes
  useEffect(() => {
    const nextIndex = Math.min(value.length, length - 1);
    if (inputRefs.current[nextIndex] && document.activeElement !== inputRefs.current[nextIndex]) {
      setActiveIndex(nextIndex);
    }
  }, [value, length]);

  const handleInputChange = (index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow numeric input
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    
    if (numericValue.length > 1) {
      // Handle paste or multiple character input
      handlePaste(numericValue, index);
      return;
    }

    // Update the value array
    const newValue = value.split('');
    newValue[index] = numericValue;
    
    // Trim to length and join
    const updatedValue = newValue.slice(0, length).join('');
    onChange(updatedValue);

    // Move to next input if current is filled
    if (numericValue && index < length - 1) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setActiveIndex(index + 1);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        if (value[index]) {
          // Clear current input
          const newValue = value.split('');
          newValue[index] = '';
          onChange(newValue.join(''));
        } else if (index > 0) {
          // Move to previous input and clear it
          const newValue = value.split('');
          newValue[index - 1] = '';
          onChange(newValue.join(''));
          const prevInput = inputRefs.current[index - 1];
          if (prevInput) {
            prevInput.focus();
            setActiveIndex(index - 1);
          }
        }
        break;

      case 'Delete':
        e.preventDefault();
        if (value[index]) {
          const newValue = value.split('');
          newValue[index] = '';
          onChange(newValue.join(''));
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          const prevInput = inputRefs.current[index - 1];
          if (prevInput) {
            prevInput.focus();
            setActiveIndex(index - 1);
          }
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (index < length - 1) {
          const nextInput = inputRefs.current[index + 1];
          if (nextInput) {
            nextInput.focus();
            setActiveIndex(index + 1);
          }
        }
        break;

      case 'Home':
        e.preventDefault();
        const firstInput = inputRefs.current[0];
        if (firstInput) {
          firstInput.focus();
          setActiveIndex(0);
        }
        break;

      case 'End':
        e.preventDefault();
        const lastInput = inputRefs.current[length - 1];
        if (lastInput) {
          lastInput.focus();
          setActiveIndex(length - 1);
        }
        break;

      default:
        // Allow only numeric keys
        if (!/^[0-9]$/.test(e.key) && !['Tab', 'Shift'].includes(e.key)) {
          e.preventDefault();
        }
        break;
    }
  };

  const handlePaste = (pastedValue: string, startIndex: number = 0) => {
    if (disabled) return;

    // Extract only numeric characters
    const numericValue = pastedValue.replace(/[^0-9]/g, '');
    
    // Create new value array
    const newValue = value.split('');
    
    // Fill from start index
    for (let i = 0; i < numericValue.length && (startIndex + i) < length; i++) {
      newValue[startIndex + i] = numericValue[i];
    }
    
    const updatedValue = newValue.slice(0, length).join('');
    onChange(updatedValue);

    // Focus the next empty input or the last input
    const nextEmptyIndex = Math.min(startIndex + numericValue.length, length - 1);
    const targetInput = inputRefs.current[nextEmptyIndex];
    if (targetInput) {
      targetInput.focus();
      setActiveIndex(nextEmptyIndex);
    }
  };

  const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePaste(pastedData, index);
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
  };

  const handleClick = (index: number) => {
    setActiveIndex(index);
    const input = inputRefs.current[index];
    if (input) {
      input.focus();
    }
  };

  return (
    <div className={cn('flex gap-2 justify-center', className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePasteEvent(e, index)}
          onFocus={() => handleFocus(index)}
          onClick={() => handleClick(index)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            // Base styles
            'w-12 h-12 text-center text-lg font-semibold',
            'border-2 rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            
            // Normal state
            'border-input bg-background text-foreground',
            'hover:border-primary/50',
            
            // Focus state
            'focus:border-primary focus:ring-primary/20',
            
            // Active state (currently focused input)
            activeIndex === index && !disabled && 'border-primary ring-2 ring-primary/20',
            
            // Error state
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed bg-muted',
            
            // Filled state
            value[index] && 'border-primary/70 bg-primary/5'
          )}
          aria-label={`OTP digit ${index + 1}`}
          aria-describedby={error ? 'otp-error' : undefined}
        />
      ))}
    </div>
  );
};

export default OTPInput;