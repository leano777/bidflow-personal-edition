import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for monitoring (you could send to error tracking service)
    this.logErrorToService(error, errorInfo);

    // Show user notification
    toast.error('Something went wrong. Please try refreshing the page.');
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real application, you would send this to an error tracking service
    // like Sentry, LogRocket, or Bugsnag
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      // Store in localStorage for now (in production, send to monitoring service)
      const existingErrors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      existingErrors.push(errorData);
      // Keep only last 10 errors
      localStorage.setItem('app-errors', JSON.stringify(existingErrors.slice(-10)));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  copyErrorInfo = () => {
    const errorText = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      toast.success('Error information copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy error information');
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen dashboard-bg flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full glass-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Oops! Something went wrong
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                We apologize for the inconvenience. An unexpected error occurred while processing your request.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Error Details</span>
                </div>
                <div className="text-sm font-mono text-destructive bg-destructive/5 p-3 rounded border">
                  {this.state.error?.message || 'Unknown error occurred'}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Error ID: {this.state.errorId}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {/* Development Mode Details */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
                    Show Technical Details (Development Mode)
                  </summary>
                  <div className="bg-muted/30 p-3 rounded border font-mono text-xs overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                    {this.state.error?.stack && (
                      <div>
                        <strong>Error Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Copy Error Info Button */}
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={this.copyErrorInfo}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Copy Error Information for Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Smaller error boundary for individual components
export function ComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: ReactNode; 
  componentName: string; 
}) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Error in {componentName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This component failed to load. Please refresh the page.
            </p>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}