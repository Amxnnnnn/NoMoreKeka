import React from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

/**
 * COMPREHENSIVE ERROR HANDLING SYSTEM
 * 
 * Centralized error management with user-friendly messaging,
 * logging, and recovery mechanisms for debugging and UX.
 */

export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SYSTEM = 'system'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  component: string;
  action: string;
  user?: {
    id: string;
    role: string;
    email: string;
  };
  timestamp: Date;
  stackTrace?: string;
  additionalData?: any;
  url?: string;
  userAgent?: string;
}

export interface ErrorRecovery {
  retry: () => Promise<void>;
  fallback: () => void;
  report: () => void;
  dismiss: () => void;
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string | number;
  context: ErrorContext;
  recovery?: Partial<ErrorRecovery>;
  originalError?: Error;
}

class ErrorHandler {
  private errorLog: AppError[] = [];
  private maxLogSize = 100;
  private isOnline = navigator.onLine;

  constructor() {
    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleNetworkRestore();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleNetworkLoss();
    });

    // Global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  /**
   * Handle API errors with automatic classification and user feedback
   */
  handleAPIError(error: any, context: Partial<ErrorContext> = {}): AppError {
    const appError: AppError = {
      type: ErrorType.API,
      severity: this.getAPISeverity(error.response?.status),
      message: error.message || 'API request failed',
      userMessage: this.getAPIUserMessage(error),
      code: error.response?.data?.errorCode || error.response?.status,
      context: {
        component: 'API',
        action: 'request',
        timestamp: new Date(),
        url: error.config?.url,
        ...context
      },
      originalError: error,
      recovery: {
        retry: async () => {
          if (error.config) {
            const { default: axios } = await import('axios');
            return axios.request(error.config);
          }
        },
        report: () => this.reportError(appError),
        dismiss: () => this.dismissError(appError)
      }
    };

    this.logError(appError);
    this.showErrorToast(appError);
    
    return appError;
  }

  /**
   * Handle validation errors with field-specific feedback
   */
  handleValidationError(errors: any[], context: Partial<ErrorContext> = {}): AppError {
    const appError: AppError = {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      message: 'Validation failed',
      userMessage: 'Please check the highlighted fields and try again.',
      context: {
        component: 'Form',
        action: 'validation',
        timestamp: new Date(),
        additionalData: { errors },
        ...context
      },
      recovery: {
        dismiss: () => this.dismissError(appError)
      }
    };

    this.logError(appError);
    
    // Show field-specific errors
    errors.forEach(error => {
      if (error.field && error.message) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `${error.field}: ${error.message}`,
        });
      }
    });

    return appError;
  }

  /**
   * Handle network errors with offline detection
   */
  handleNetworkError(error: Error, context: Partial<ErrorContext> = {}): AppError {
    const appError: AppError = {
      type: ErrorType.NETWORK,
      severity: this.isOnline ? ErrorSeverity.HIGH : ErrorSeverity.CRITICAL,
      message: error.message || 'Network request failed',
      userMessage: this.isOnline 
        ? 'Connection problem. Please check your internet and try again.'
        : 'You appear to be offline. Some features may not work.',
      context: {
        component: 'Network',
        action: 'request',
        timestamp: new Date(),
        additionalData: { isOnline: this.isOnline },
        ...context
      },
      originalError: error,
      recovery: {
        retry: async () => {
          // Wait for network to be available
          await this.waitForNetwork();
        },
        fallback: () => this.enableOfflineMode(),
        dismiss: () => this.dismissError(appError)
      }
    };

    this.logError(appError);
    this.showErrorToast(appError);
    
    return appError;
  }

  /**
   * Handle authentication errors with automatic logout
   */
  handleAuthError(error: Error, context: Partial<ErrorContext> = {}): AppError {
    const appError: AppError = {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      message: error.message || 'Authentication failed',
      userMessage: 'Your session has expired. Please log in again.',
      context: {
        component: 'Auth',
        action: 'authenticate',
        timestamp: new Date(),
        ...context
      },
      originalError: error,
      recovery: {
        fallback: () => {
          // Redirect to login
          window.location.href = '/auth/login';
        },
        dismiss: () => this.dismissError(appError)
      }
    };

    this.logError(appError);
    this.showErrorToast(appError);
    
    return appError;
  }

  /**
   * Handle system errors with detailed logging
   */
  handleSystemError(error: Error, context: Partial<ErrorContext> = {}): AppError {
    const appError: AppError = {
      type: ErrorType.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      message: error.message || 'System error occurred',
      userMessage: 'Something went wrong. Our team has been notified.',
      context: {
        component: 'System',
        action: 'unknown',
        timestamp: new Date(),
        stackTrace: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      },
      originalError: error,
      recovery: {
        report: () => this.reportError(appError),
        fallback: () => window.location.reload(),
        dismiss: () => this.dismissError(appError)
      }
    };

    this.logError(appError);
    this.showErrorToast(appError);
    
    return appError;
  }

  /**
   * Show user-friendly error toast with actions
   */
  showErrorToast(error: AppError): void {
    const toastConfig: any = {
      variant: "destructive",
      title: this.getErrorTitle(error.type),
      description: error.userMessage,
    };

    // Add action buttons if recovery options exist
    if (error.recovery?.retry || error.recovery?.report) {
      const actionHandler = error.recovery?.retry || error.recovery?.report;
      const actionLabel = error.recovery?.retry ? 'Retry' : 'Report';
      
      toastConfig.action = React.createElement(
        ToastAction,
        {
          altText: actionLabel,
          onClick: actionHandler
        },
        actionLabel
      );
    }

    toast(toastConfig);
  }

  /**
   * Log error with context for debugging
   */
  logError(error: AppError): void {
    // Add to in-memory log
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop();
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.type.toUpperCase()} ERROR`);
      console.error('Message:', error.message);
      console.error('User Message:', error.userMessage);
      console.error('Context:', error.context);
      if (error.originalError) {
        console.error('Original Error:', error.originalError);
      }
      console.groupEnd();
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && error.severity === ErrorSeverity.CRITICAL) {
      this.sendToMonitoring(error);
    }
  }

  /**
   * Get error logs for debugging
   */
  getErrorLogs(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error logs
   */
  clearErrorLogs(): void {
    this.errorLog = [];
  }

  /**
   * Report error to support team
   */
  private reportError(error: AppError): void {
    // Implementation would send error to support system
    console.log('Reporting error to support:', error);
    
    toast({
      title: "Error Reported",
      description: "Thank you for reporting this issue. Our team will investigate.",
    });
  }

  /**
   * Dismiss error (remove from active errors)
   */
  private dismissError(error: AppError): void {
    // Implementation would remove from active error state
    console.log('Dismissing error:', error.message);
  }

  /**
   * Handle global JavaScript errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    this.handleSystemError(new Error(event.message), {
      component: 'Global',
      action: 'runtime',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.handleSystemError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        component: 'Promise',
        action: 'rejection'
      }
    );
  }

  /**
   * Handle network restoration
   */
  private handleNetworkRestore(): void {
    toast({
      title: "Connection Restored",
      description: "You're back online. Syncing data...",
    });
  }

  /**
   * Handle network loss
   */
  private handleNetworkLoss(): void {
    toast({
      variant: "destructive",
      title: "Connection Lost",
      description: "You're offline. Some features may not work.",
    });
  }

  /**
   * Wait for network to be available
   */
  private async waitForNetwork(): Promise<void> {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve();
        return;
      }
      
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      
      window.addEventListener('online', handleOnline);
    });
  }

  /**
   * Enable offline mode
   */
  private enableOfflineMode(): void {
    // Implementation would enable offline functionality
    console.log('Enabling offline mode');
  }

  /**
   * Send error to monitoring service
   */
  private async sendToMonitoring(error: AppError): Promise<void> {
    try {
      // Implementation would send to service like Sentry, LogRocket, etc.
      console.log('Sending to monitoring service:', error);
    } catch (e) {
      console.error('Failed to send error to monitoring:', e);
    }
  }

  /**
   * Get API error severity based on status code
   */
  private getAPISeverity(status?: number): ErrorSeverity {
    if (!status) return ErrorSeverity.HIGH;
    
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status === 401 || status === 403) return ErrorSeverity.HIGH;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * Get user-friendly API error message
   */
  private getAPIUserMessage(error: any): string {
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode;
    
    // Use existing error code mapping
    if (errorCode) {
      try {
        const { getErrorMessage } = require('./api');
        return getErrorMessage(errorCode);
      } catch (e) {
        // Fallback if api module can't be loaded (e.g., in test environment)
        // This is expected in Jest environment due to import.meta limitations
      }
    }
    
    // Fallback based on status code
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  /**
   * Get error title based on type
   */
  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Connection Problem';
      case ErrorType.API:
        return 'Request Failed';
      case ErrorType.VALIDATION:
        return 'Invalid Input';
      case ErrorType.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.SYSTEM:
        return 'System Error';
      default:
        return 'Error';
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Convenience functions for common error types
export const handleAPIError = (error: any, context?: Partial<ErrorContext>) => 
  errorHandler.handleAPIError(error, context);

export const handleValidationError = (errors: any[], context?: Partial<ErrorContext>) => 
  errorHandler.handleValidationError(errors, context);

export const handleNetworkError = (error: Error, context?: Partial<ErrorContext>) => 
  errorHandler.handleNetworkError(error, context);

export const handleAuthError = (error: Error, context?: Partial<ErrorContext>) => 
  errorHandler.handleAuthError(error, context);

export const handleSystemError = (error: Error, context?: Partial<ErrorContext>) => 
  errorHandler.handleSystemError(error, context);

export const showErrorToast = (message: string, type: ErrorType = ErrorType.SYSTEM) => {
  const error: AppError = {
    type,
    severity: ErrorSeverity.MEDIUM,
    message,
    userMessage: message,
    context: {
      component: 'Manual',
      action: 'toast',
      timestamp: new Date()
    }
  };
  errorHandler.showErrorToast(error);
};

export const getErrorLogs = () => errorHandler.getErrorLogs();
export const clearErrorLogs = () => errorHandler.clearErrorLogs();