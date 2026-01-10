import React from 'react';
import { AlertTriangle, RefreshCw, MessageCircle, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * COMPREHENSIVE ERROR RECOVERY COMPONENT
 * 
 * Provides user-friendly error displays with actionable recovery options
 * Supports different error types with appropriate guidance and actions
 */

export interface ErrorRecoveryProps {
  error: {
    type: 'network' | 'api' | 'validation' | 'authentication' | 'system' | 'otp';
    message: string;
    guidance?: string;
    errorCode?: string;
    retryable?: boolean;
    canContact?: boolean;
  };
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onGoBack,
  onContactSupport,
  className = '',
  compact = false
}) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="w-5 h-5" />;
      case 'authentication':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Connection Problem';
      case 'api':
        return 'Service Error';
      case 'validation':
        return 'Invalid Input';
      case 'authentication':
        return 'Authentication Required';
      case 'system':
        return 'System Error';
      case 'otp':
        return 'Verification Issue';
      default:
        return 'Error';
    }
  };

  const getErrorVariant = () => {
    switch (error.type) {
      case 'network':
        return 'destructive' as const;
      case 'authentication':
        return 'destructive' as const;
      case 'validation':
        return 'default' as const;
      default:
        return 'destructive' as const;
    }
  };

  const getDefaultGuidance = () => {
    switch (error.type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'api':
        return 'Our servers are experiencing issues. Please try again in a few moments.';
      case 'validation':
        return 'Please check your input and try again.';
      case 'authentication':
        return 'Please log in again to continue.';
      case 'system':
        return 'Something unexpected happened. Our team has been notified.';
      case 'otp':
        return 'Please check your verification code and try again.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

  if (compact) {
    return (
      <Alert variant={getErrorVariant()} className={className}>
        {getErrorIcon()}
        <AlertTitle>{getErrorTitle()}</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <p>{error.message}</p>
            {error.guidance && (
              <p className="text-sm opacity-90">{error.guidance}</p>
            )}
            <div className="flex gap-2 mt-3">
              {error.retryable && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
              {onGoBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onGoBack}
                  className="h-8"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Go Back
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          {getErrorIcon()}
        </div>
        <CardTitle className="text-lg">{getErrorTitle()}</CardTitle>
        <CardDescription className="text-base">
          {error.message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Guidance Section */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {error.guidance || getDefaultGuidance()}
          </p>
        </div>

        {/* Error Code (for debugging) */}
        {error.errorCode && (
          <div className="text-xs text-muted-foreground text-center">
            Error Code: {error.errorCode}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {error.retryable && onRetry && (
            <Button
              onClick={onRetry}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <div className="flex gap-2">
            {onGoBack && (
              <Button
                onClick={onGoBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
            
            {(error.canContact !== false) && onContactSupport && (
              <Button
                onClick={onContactSupport}
                variant="outline"
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            )}
          </div>
        </div>

        {/* Network Status Indicator */}
        {error.type === 'network' && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {navigator.onLine ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                Connected to Internet
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                No Internet Connection
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Hook for creating error objects with consistent structure
 */
export const useErrorRecovery = () => {
  const createError = (
    type: ErrorRecoveryProps['error']['type'],
    message: string,
    options: Partial<ErrorRecoveryProps['error']> = {}
  ): ErrorRecoveryProps['error'] => {
    return {
      type,
      message,
      retryable: true,
      canContact: true,
      ...options
    };
  };

  const createNetworkError = (message?: string) => createError(
    'network',
    message || 'Connection problem. Please check your internet and try again.',
    { retryable: true }
  );

  const createAPIError = (message?: string, errorCode?: string) => createError(
    'api',
    message || 'Service temporarily unavailable. Please try again.',
    { errorCode, retryable: true }
  );

  const createValidationError = (message: string, guidance?: string) => createError(
    'validation',
    message,
    { guidance, retryable: false, canContact: false }
  );

  const createAuthError = (message?: string) => createError(
    'authentication',
    message || 'Your session has expired. Please log in again.',
    { retryable: false }
  );

  const createOTPError = (message: string, guidance?: string, retryable = true) => createError(
    'otp',
    message,
    { guidance, retryable }
  );

  const createSystemError = (message?: string) => createError(
    'system',
    message || 'Something went wrong. Our team has been notified.',
    { retryable: true }
  );

  return {
    createError,
    createNetworkError,
    createAPIError,
    createValidationError,
    createAuthError,
    createOTPError,
    createSystemError
  };
};

export default ErrorRecovery;