import { ReactNode } from 'react';

interface SystemLayoutProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: boolean;
  className?: string;
  background?: 'default' | 'muted' | 'card';
}

export function SystemLayout({ 
  children, 
  maxWidth = 'full', 
  padding = true,
  className = '',
  background = 'default'
}: SystemLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/30',
    card: 'bg-card'
  };

  return (
    <div className={`
      ${backgroundClasses[background]}
      ${maxWidthClasses[maxWidth]} 
      mx-auto 
      ${padding ? 'container-padding' : ''} 
      ${className}
    `}>
      {children}
    </div>
  );
}

// Page Section Component
interface PageSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageSection({ children, title, subtitle, action, className = '' }: PageSectionProps) {
  return (
    <section className={`animate-slide-up ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            {title && (
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// Card Grid Component
interface CardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CardGrid({ children, columns = 3, gap = 'md', className = '' }: CardGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}