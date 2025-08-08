import { ChevronRight, Home } from 'lucide-react';
import { Button } from './ui/button';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface NavigationBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function NavigationBreadcrumbs({ items, className = '' }: NavigationBreadcrumbsProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />
            )}
            
            {index === 0 && (
              <Home className="w-4 h-4 mr-2 text-gray-500" />
            )}
            
            {item.onClick && index !== items.length - 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 px-2 py-1 h-auto font-medium transition-colors duration-200"
              >
                {item.label}
              </Button>
            ) : (
              <span 
                className={`px-2 py-1 rounded-md font-medium ${
                  index === items.length - 1 
                    ? 'text-gray-900 bg-gray-100/60' 
                    : 'text-gray-600'
                }`}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}