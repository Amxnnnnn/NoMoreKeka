import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { routeGuardService } from '@/services/route-guard.service';
import { cn } from '@/lib/utils';

/**
 * BREADCRUMB NAVIGATION COMPONENT
 * 
 * Provides hierarchical navigation with automatic breadcrumb generation
 * based on current route
 */

interface BreadcrumbNavProps {
  className?: string;
  showHome?: boolean;
  maxItems?: number;
  separator?: React.ReactNode;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  className = '',
  showHome = true,
  maxItems = 5,
  separator = <ChevronRight className="h-4 w-4" />
}) => {
  const location = useLocation();
  const breadcrumbs = routeGuardService.generateBreadcrumbs(location.pathname);

  // Limit breadcrumbs if maxItems is specified
  const displayBreadcrumbs = breadcrumbs.length > maxItems 
    ? [
        ...breadcrumbs.slice(0, 1),
        { label: '...', path: '', isActive: false },
        ...breadcrumbs.slice(-maxItems + 2)
      ]
    : breadcrumbs;

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {showHome && (
        <>
          <Link
            to="/dashboard"
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
          {breadcrumbs.length > 0 && (
            <span className="text-muted-foreground/50">
              {separator}
            </span>
          )}
        </>
      )}

      {displayBreadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={`${breadcrumb.path}-${index}`}>
          {index > 0 && (
            <span className="text-muted-foreground/50">
              {separator}
            </span>
          )}
          
          {breadcrumb.label === '...' ? (
            <span className="text-muted-foreground/50">...</span>
          ) : breadcrumb.isActive ? (
            <span className="font-medium text-foreground">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

/**
 * BREADCRUMB ITEM COMPONENT
 * 
 * Individual breadcrumb item for custom breadcrumb implementations
 */

interface BreadcrumbItemProps {
  label: string;
  path?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  label,
  path,
  isActive = false,
  onClick,
  className = ''
}) => {
  const content = (
    <span className={cn(
      'transition-colors',
      isActive 
        ? 'font-medium text-foreground' 
        : 'text-muted-foreground hover:text-foreground',
      className
    )}>
      {label}
    </span>
  );

  if (isActive) {
    return content;
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="text-left"
      >
        {content}
      </button>
    );
  }

  if (path) {
    return (
      <Link to={path}>
        {content}
      </Link>
    );
  }

  return content;
};

/**
 * CUSTOM BREADCRUMB COMPONENT
 * 
 * For cases where automatic breadcrumb generation isn't suitable
 */

interface CustomBreadcrumbProps {
  items: Array<{
    label: string;
    path?: string;
    isActive?: boolean;
    onClick?: () => void;
  }>;
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
}

export const CustomBreadcrumb: React.FC<CustomBreadcrumbProps> = ({
  items,
  className = '',
  separator = <ChevronRight className="h-4 w-4" />,
  showHome = true
}) => {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      {showHome && (
        <>
          <Link
            to="/dashboard"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
          {items.length > 0 && (
            <span className="text-muted-foreground/50">
              {separator}
            </span>
          )}
        </>
      )}

      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-muted-foreground/50">
              {separator}
            </span>
          )}
          
          <BreadcrumbItem
            label={item.label}
            path={item.path}
            isActive={item.isActive}
            onClick={item.onClick}
          />
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;