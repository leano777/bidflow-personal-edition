import { Badge } from './ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle, Send, Eye, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface StatusBadgeProps {
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'pending' | 'in-review' | 'archived';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const { theme } = useTheme();

  const statusConfig = {
    draft: {
      label: 'Draft',
      icon: Clock,
      baseClasses: 'bg-muted text-muted-foreground border-border',
      tacticalClasses: 'bg-gray-800 text-gray-300 border-gray-600',
      darkGlassClasses: 'bg-white/10 text-foreground/80 border-white/20 backdrop-blur-sm',
      lightGlassClasses: 'bg-white/60 text-gray-700 border-gray-300/40 backdrop-blur-sm'
    },
    sent: {
      label: 'Sent',
      icon: Send,
      baseClasses: 'bg-blue-50 text-blue-700 border-blue-200',
      tacticalClasses: 'bg-white text-black border-white',
      darkGlassClasses: 'bg-blue-500/20 text-blue-300 border-blue-400/30 backdrop-blur-sm',
      lightGlassClasses: 'bg-blue-100/80 text-blue-800 border-blue-300/60 backdrop-blur-sm'
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle,
      baseClasses: 'bg-success-50 text-success border-success/20',
      tacticalClasses: 'bg-white text-black border-white',
      darkGlassClasses: 'bg-success/20 text-success border-success/30 backdrop-blur-sm',
      lightGlassClasses: 'bg-green-100/80 text-green-800 border-green-300/60 backdrop-blur-sm'
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      baseClasses: 'bg-destructive-50 text-destructive border-destructive/20',
      tacticalClasses: 'bg-gray-600 text-white border-gray-500',
      darkGlassClasses: 'bg-destructive/20 text-destructive border-destructive/30 backdrop-blur-sm',
      lightGlassClasses: 'bg-red-100/80 text-red-800 border-red-300/60 backdrop-blur-sm'
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      baseClasses: 'bg-warning-50 text-warning border-warning/20',
      tacticalClasses: 'bg-gray-700 text-gray-200 border-gray-500',
      darkGlassClasses: 'bg-warning/20 text-warning border-warning/30 backdrop-blur-sm',
      lightGlassClasses: 'bg-yellow-100/80 text-yellow-800 border-yellow-300/60 backdrop-blur-sm'
    },
    'in-review': {
      label: 'In Review',
      icon: Eye,
      baseClasses: 'bg-purple-50 text-purple-700 border-purple-200',
      tacticalClasses: 'bg-gray-700 text-white border-gray-500',
      darkGlassClasses: 'bg-purple-500/20 text-purple-300 border-purple-400/30 backdrop-blur-sm',
      lightGlassClasses: 'bg-purple-100/80 text-purple-800 border-purple-300/60 backdrop-blur-sm'
    },
    archived: {
      label: 'Archived',
      icon: AlertCircle,
      baseClasses: 'bg-gray-50 text-gray-500 border-gray-200',
      tacticalClasses: 'bg-gray-900 text-gray-400 border-gray-700',
      darkGlassClasses: 'bg-gray-500/20 text-gray-400 border-gray-500/30 backdrop-blur-sm',
      lightGlassClasses: 'bg-gray-100/80 text-gray-600 border-gray-300/60 backdrop-blur-sm'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Determine theme-specific classes
  const getThemeClasses = () => {
    switch (theme) {
      case 'tactical':
        return config.tacticalClasses;
      case 'dark-glass':
        return config.darkGlassClasses;
      case 'light-glass':
        return config.lightGlassClasses;
      default:
        return config.baseClasses;
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 h-5',
    md: 'text-xs px-2.5 py-1.5 h-6',
    lg: 'text-sm px-3 py-2 h-8'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5'
  };

  return (
    <Badge 
      className={`
        inline-flex items-center gap-1.5 font-semibold border transition-all duration-300
        ${sizeClasses[size]}
        ${getThemeClasses()}
        ${theme === 'tactical' ? 'font-bold' : ''}
        ${theme === 'dark-glass' || theme === 'light-glass' ? 'shadow-sm' : ''}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </Badge>
  );
}

// Enhanced status indicator with animation
export function AnimatedStatusBadge({ status, size = 'md', showIcon = true, animate = false }: StatusBadgeProps & { animate?: boolean }) {
  const { theme } = useTheme();
  
  return (
    <div className={`relative ${animate ? 'animate-pulse' : ''}`}>
      <StatusBadge status={status} size={size} showIcon={showIcon} />
      
      {/* Tactical theme enhancement - glowing effect for active states */}
      {theme === 'tactical' && (status === 'approved' || status === 'sent') && (
        <div className="absolute inset-0 bg-white/20 rounded-full blur-sm -z-10 animate-pulse" />
      )}
      
      {/* Dark glass theme enhancement - subtle glow */}
      {theme === 'dark-glass' && status === 'approved' && (
        <div className="absolute inset-0 bg-success/10 rounded-full blur-md -z-10" />
      )}
    </div>
  );
}

// Utility component for status with description
export function StatusWithDescription({ 
  status, 
  description, 
  size = 'md' 
}: { 
  status: StatusBadgeProps['status']; 
  description?: string; 
  size?: StatusBadgeProps['size'];
}) {
  const { theme } = useTheme();
  
  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} size={size} />
      {description && (
        <span className={`text-sm transition-colors duration-300 ${
          theme === 'tactical' 
            ? 'text-gray-300' 
            : theme === 'dark-glass'
            ? 'text-muted-foreground/80'
            : 'text-muted-foreground'
        }`}>
          {description}
        </span>
      )}
    </div>
  );
}