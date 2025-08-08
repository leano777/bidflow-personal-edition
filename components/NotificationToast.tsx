import { toast } from 'sonner@2.0.3';
import { Check, AlertCircle, X, Info, Sparkles } from 'lucide-react';

interface NotificationConfig {
  title: string;
  description?: string;
  duration?: number;
}

class NotificationService {
  success(config: NotificationConfig | string) {
    const options = typeof config === 'string' ? { title: config } : config;
    toast.success(options.title, {
      description: options.description,
      duration: options.duration || 4000,
      icon: <Check className="w-5 h-5 text-green-600" />,
      className: 'bg-green-50 border-green-200 text-green-900',
    });
  }

  error(config: NotificationConfig | string) {
    const options = typeof config === 'string' ? { title: config } : config;
    toast.error(options.title, {
      description: options.description,
      duration: options.duration || 5000,
      icon: <X className="w-5 h-5 text-red-600" />,
      className: 'bg-red-50 border-red-200 text-red-900',
    });
  }

  warning(config: NotificationConfig | string) {
    const options = typeof config === 'string' ? { title: config } : config;
    toast.warning(options.title, {
      description: options.description,
      duration: options.duration || 4500,
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
      className: 'bg-amber-50 border-amber-200 text-amber-900',
    });
  }

  info(config: NotificationConfig | string) {
    const options = typeof config === 'string' ? { title: config } : config;
    toast.info(options.title, {
      description: options.description,
      duration: options.duration || 4000,
      icon: <Info className="w-5 h-5 text-blue-600" />,
      className: 'bg-blue-50 border-blue-200 text-blue-900',
    });
  }

  aiSuccess(config: NotificationConfig | string) {
    const options = typeof config === 'string' ? { title: config } : config;
    toast.success(options.title, {
      description: options.description,
      duration: options.duration || 5000,
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      className: 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-900',
    });
  }

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: 4000,
    });
  }
}

export const notify = new NotificationService();

// Usage examples:
// notify.success('Proposal saved successfully!');
// notify.error({ title: 'Save failed', description: 'Please check your connection and try again.' });
// notify.aiSuccess('AI has generated your proposal successfully!');
// notify.promise(saveProposal(), {
//   loading: 'Saving proposal...',
//   success: 'Proposal saved!',
//   error: 'Failed to save proposal'
// });