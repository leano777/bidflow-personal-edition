import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Types
export interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  progress: number;
  operation: string | null;
  error: string | null;
  operations: {
    [key: string]: {
      status: 'pending' | 'loading' | 'success' | 'error';
      message: string;
      progress?: number;
      startTime?: number;
    };
  };
}

interface LoadingContextType {
  state: LoadingState;
  startLoading: (operation: string, message: string) => void;
  updateProgress: (operation: string, progress: number, message?: string) => void;
  finishLoading: (operation: string, success?: boolean, message?: string) => void;
  setError: (operation: string, error: string) => void;
  clearOperation: (operation: string) => void;
  clearAll: () => void;
}

// Context
const LoadingContext = createContext<LoadingContextType | null>(null);

// Provider
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    loadingMessage: '',
    progress: 0,
    operation: null,
    error: null,
    operations: {},
  });

  const startLoading = (operation: string, message: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      operation,
      loadingMessage: message,
      progress: 0,
      error: null,
      operations: {
        ...prev.operations,
        [operation]: {
          status: 'loading',
          message,
          progress: 0,
          startTime: Date.now(),
        },
      },
    }));
  };

  const updateProgress = (operation: string, progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: prev.operation === operation ? progress : prev.progress,
      loadingMessage: prev.operation === operation && message ? message : prev.loadingMessage,
      operations: {
        ...prev.operations,
        [operation]: {
          ...prev.operations[operation],
          progress,
          message: message || prev.operations[operation]?.message || '',
        },
      },
    }));
  };

  const finishLoading = (operation: string, success = true, message?: string) => {
    setState(prev => {
      const newOperations = {
        ...prev.operations,
        [operation]: {
          ...prev.operations[operation],
          status: success ? 'success' as const : 'error' as const,
          message: message || prev.operations[operation]?.message || '',
          progress: 100,
        },
      };

      // Check if this was the active operation
      const isActiveOperation = prev.operation === operation;
      const hasActiveOperations = Object.values(newOperations).some(op => op.status === 'loading');

      return {
        ...prev,
        isLoading: hasActiveOperations,
        operation: isActiveOperation && !hasActiveOperations ? null : prev.operation,
        progress: isActiveOperation && !hasActiveOperations ? 100 : prev.progress,
        error: !success && isActiveOperation ? message || 'Operation failed' : prev.error,
        operations: newOperations,
      };
    });

    // Auto-clear successful operations after 3 seconds
    if (success) {
      setTimeout(() => {
        clearOperation(operation);
      }, 3000);
    }
  };

  const setError = (operation: string, error: string) => {
    finishLoading(operation, false, error);
  };

  const clearOperation = (operation: string) => {
    setState(prev => {
      const newOperations = { ...prev.operations };
      delete newOperations[operation];

      const isActiveOperation = prev.operation === operation;
      const hasActiveOperations = Object.values(newOperations).some(op => op.status === 'loading');

      return {
        ...prev,
        isLoading: hasActiveOperations,
        operation: isActiveOperation ? null : prev.operation,
        loadingMessage: isActiveOperation ? '' : prev.loadingMessage,
        progress: isActiveOperation ? 0 : prev.progress,
        error: isActiveOperation ? null : prev.error,
        operations: newOperations,
      };
    });
  };

  const clearAll = () => {
    setState({
      isLoading: false,
      loadingMessage: '',
      progress: 0,
      operation: null,
      error: null,
      operations: {},
    });
  };

  return (
    <LoadingContext.Provider
      value={{
        state,
        startLoading,
        updateProgress,
        finishLoading,
        setError,
        clearOperation,
        clearAll,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

// Hook
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Loading overlay component
export function LoadingOverlay() {
  const { state } = useLoading();

  if (!state.isLoading || !state.operation) {
    return null;
  }

  const operation = state.operations[state.operation];
  const duration = operation?.startTime ? Date.now() - operation.startTime : 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-96 glass-card shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {state.loadingMessage}
              </h3>
              {duration > 1000 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(duration / 1000)}s elapsed
                </p>
              )}
            </div>
          </div>
          
          {state.progress > 0 && (
            <div className="mb-2">
              <Progress value={state.progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round(state.progress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Operation status indicator
export function OperationStatus({ operation }: { operation: string }) {
  const { state } = useLoading();
  const operationState = state.operations[operation];

  if (!operationState) {
    return null;
  }

  const getIcon = () => {
    switch (operationState.status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (operationState.status) {
      case 'loading':
        return 'text-primary';
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'pending':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <span className={`text-sm ${getStatusColor()}`}>
        {operationState.message}
      </span>
      {operationState.status === 'loading' && operationState.progress !== undefined && (
        <span className="text-xs text-muted-foreground">
          ({Math.round(operationState.progress)}%)
        </span>
      )}
    </div>
  );
}

// Operations panel for debugging/monitoring
export function OperationsPanel() {
  const { state, clearOperation, clearAll } = useLoading();
  const [isExpanded, setIsExpanded] = useState(false);

  const operations = Object.entries(state.operations);

  if (operations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="glass-card shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Operations</h4>
            <div className="flex gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {operations.map(([key, operation]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <OperationStatus operation={key} />
                  <button
                    onClick={() => clearOperation(key)}
                    className="text-muted-foreground hover:text-foreground ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {!isExpanded && operations.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {operations.filter(([, op]) => op.status === 'loading').length} active,{' '}
              {operations.length} total
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Higher-order component for async operations
export function withLoading<T extends object>(
  Component: React.ComponentType<T>,
  operation: string,
  loadingMessage: string
) {
  return function LoadingWrappedComponent(props: T) {
    const { state } = useLoading();
    const isLoading = state.operations[operation]?.status === 'loading';

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-muted-foreground">{loadingMessage}</span>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for async operations with loading
export function useAsyncOperation() {
  const { startLoading, updateProgress, finishLoading, setError } = useLoading();

  const executeAsync = async <T,>(
    operation: string,
    asyncFn: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
    initialMessage: string = 'Processing...'
  ): Promise<T> => {
    startLoading(operation, initialMessage);

    try {
      const result = await asyncFn((progress, message) => {
        updateProgress(operation, progress, message);
      });
      
      finishLoading(operation, true, 'Completed successfully');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      setError(operation, errorMessage);
      throw error;
    }
  };

  return { executeAsync };
}