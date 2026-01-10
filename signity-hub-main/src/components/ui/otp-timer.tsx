import React, { useState, useEffect, useCallback } from 'react';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OTPTimerProps {
  /** Expiration time as Date object */
  expirationTime: Date;
  /** Callback when timer expires */
  onExpired: () => void;
  /** Callback for resend OTP */
  onResend?: () => void;
  /** Whether resend is currently loading */
  isResending?: boolean;
  /** Resend cooldown in seconds */
  resendCooldown?: number;
  /** Custom className */
  className?: string;
  /** Whether to show progress bar */
  showProgress?: boolean;
}

export const OTPTimer: React.FC<OTPTimerProps> = ({
  expirationTime,
  onExpired,
  onResend,
  isResending = false,
  resendCooldown = 0,
  className,
  showProgress = true
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [hasExpiredCallbackFired, setHasExpiredCallbackFired] = useState(false);

  // Calculate initial duration (10 minutes = 600 seconds)
  const totalDuration = 600;

  // Update time left every second
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const timeDiff = Math.max(0, Math.floor((expirationTime.getTime() - now.getTime()) / 1000));
      
      setTimeLeft(timeDiff);
      
      if (timeDiff === 0 && !hasExpiredCallbackFired) {
        setIsExpired(true);
        setHasExpiredCallbackFired(true);
        onExpired();
      }
    };

    // Update immediately
    updateTimer();

    // Set up interval
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [expirationTime, onExpired, hasExpiredCallbackFired]);

  // Reset expired state when expiration time changes (new OTP)
  useEffect(() => {
    setIsExpired(false);
    setHasExpiredCallbackFired(false);
  }, [expirationTime]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = ((totalDuration - timeLeft) / totalDuration) * 100;

  // Handle resend click
  const handleResend = () => {
    if (onResend && !isResending) {
      onResend();
    }
  };

  // Get timer color based on time left
  const getTimerColor = () => {
    if (isExpired) return 'text-destructive';
    if (timeLeft <= 60) return 'text-orange-500'; // Last minute warning
    if (timeLeft <= 180) return 'text-yellow-500'; // Last 3 minutes warning
    return 'text-foreground';
  };

  const canResend = isExpired && resendCooldown === 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Timer Display */}
      <div className="flex items-center justify-center gap-2">
        <Clock className={cn('w-4 h-4', getTimerColor())} />
        <span className={cn('font-mono text-lg font-semibold', getTimerColor())}>
          {isExpired ? 'Expired' : formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress Bar */}
      {showProgress && !isExpired && (
        <div className="space-y-2">
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            OTP expires in {formatTime(timeLeft)}
          </p>
        </div>
      )}

      {/* Expiration Warning */}
      {!isExpired && timeLeft <= 60 && timeLeft > 0 && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700">
            Your OTP will expire in less than a minute. Please enter it soon.
          </p>
        </div>
      )}

      {/* Expired State */}
      {isExpired && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">
              Your OTP has expired. Please request a new one to continue.
            </p>
          </div>

          {/* Resend Button */}
          {onResend && (
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={handleResend}
                disabled={!canResend || isResending}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Sending new OTP...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Send new OTP
                  </>
                )}
              </Button>
              
              {resendCooldown > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  You can request a new OTP in {resendCooldown} seconds
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Time Remaining Info (when not expired) */}
      {!isExpired && timeLeft > 60 && (
        <p className="text-xs text-muted-foreground text-center">
          Enter your 6-digit verification code within {formatTime(timeLeft)}
        </p>
      )}
    </div>
  );
};

export default OTPTimer;