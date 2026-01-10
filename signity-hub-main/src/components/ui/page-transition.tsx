import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PAGE TRANSITION COMPONENT
 * 
 * Provides smooth transitions between pages with loading states
 */

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transition?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
  showLoader?: boolean;
  loaderDelay?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  transition = 'fade',
  duration = 0.3,
  showLoader = true,
  loaderDelay = 200
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoaderState, setShowLoaderState] = useState(false);

  useEffect(() => {
    if (!showLoader) return;

    setIsLoading(true);
    setShowLoaderState(false);

    // Show loader after delay to avoid flash for fast transitions
    const loaderTimer = setTimeout(() => {
      if (isLoading) {
        setShowLoaderState(true);
      }
    }, loaderDelay);

    // Hide loader after transition
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
      setShowLoaderState(false);
    }, duration * 1000);

    return () => {
      clearTimeout(loaderTimer);
      clearTimeout(hideTimer);
    };
  }, [location.pathname, showLoader, loaderDelay, duration, isLoading]);

  const getTransitionVariants = () => {
    switch (transition) {
      case 'slide':
        return {
          initial: { x: 20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -20, opacity: 0 }
        };
      case 'scale':
        return {
          initial: { scale: 0.95, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.05, opacity: 0 }
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'none':
      default:
        return {
          initial: {},
          animate: {},
          exit: {}
        };
    }
  };

  const variants = getTransitionVariants();

  if (transition === 'none') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Loading Overlay */}
      <AnimatePresence>
        {showLoaderState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{
            duration,
            ease: 'easeInOut'
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/**
 * ROUTE TRANSITION WRAPPER
 * 
 * Higher-order component for wrapping routes with transitions
 */

interface RouteTransitionWrapperProps {
  children: React.ReactNode;
  transition?: 'fade' | 'slide' | 'scale' | 'none';
  className?: string;
}

export const RouteTransitionWrapper: React.FC<RouteTransitionWrapperProps> = ({
  children,
  transition = 'fade',
  className = ''
}) => {
  return (
    <PageTransition 
      transition={transition} 
      className={cn('min-h-screen', className)}
      showLoader={false} // Disable loader for route transitions
    >
      {children}
    </PageTransition>
  );
};

/**
 * LOADING TRANSITION COMPONENT
 * 
 * For showing loading states during data fetching
 */

interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
  minLoadingTime?: number;
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  isLoading,
  children,
  loadingComponent,
  className = '',
  minLoadingTime = 300
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      setMinTimeElapsed(false);
      
      const timer = setTimeout(() => {
        setMinTimeElapsed(true);
      }, minLoadingTime);

      return () => clearTimeout(timer);
    } else if (minTimeElapsed) {
      setShowLoading(false);
    }
  }, [isLoading, minTimeElapsed, minLoadingTime]);

  useEffect(() => {
    if (!isLoading && minTimeElapsed) {
      setShowLoading(false);
    }
  }, [isLoading, minTimeElapsed]);

  const defaultLoadingComponent = (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {showLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loadingComponent || defaultLoadingComponent}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * STAGGERED ANIMATION COMPONENT
 * 
 * For animating lists or grids of items
 */

interface StaggeredAnimationProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  animation?: 'fadeUp' | 'fadeIn' | 'slideIn';
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  animation = 'fadeUp'
}) => {
  const getAnimationVariants = () => {
    switch (animation) {
      case 'fadeUp':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        };
      case 'slideIn':
        return {
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 }
        };
      case 'fadeIn':
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={variants}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PageTransition;