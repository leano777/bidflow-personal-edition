import { Button } from './ui/button';
import { FileX, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}: EmptyStateProps) {
  const defaultIcon = <FileX className="w-12 h-12 text-gray-400" />;

  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      <div className="mb-4 p-3 rounded-full bg-gray-100">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-sm">
        {description}
      </p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} className="min-w-[140px]">
              <Plus className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button 
              variant="outline" 
              onClick={onSecondaryAction}
              className="min-w-[140px]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}