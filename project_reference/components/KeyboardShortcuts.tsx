import { useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { useProposal } from '../contexts/ProposalContext';

export interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  context?: 'global' | 'workspace' | 'editor';
}

interface KeyboardShortcutsProps {
  onSave?: () => void;
  onPrint?: () => void;
  onNew?: () => void;
  onHelp?: () => void;
  context?: 'global' | 'workspace' | 'editor';
  customShortcuts?: ShortcutDefinition[];
}

export function KeyboardShortcuts({
  onSave,
  onPrint,
  onNew,
  onHelp,
  context = 'global',
  customShortcuts = [],
}: KeyboardShortcutsProps) {
  const { state, actions } = useProposal();

  // Default shortcuts
  const defaultShortcuts: ShortcutDefinition[] = [
    // Global shortcuts
    {
      key: 's',
      ctrl: true,
      description: 'Save proposal',
      action: () => {
        if (onSave) {
          onSave();
        } else if (state.currentProposal) {
          actions.saveProposal();
        }
      },
      context: 'global',
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Print proposal',
      action: () => {
        if (onPrint) {
          onPrint();
        } else {
          window.print();
        }
      },
      context: 'global',
    },
    {
      key: 'n',
      ctrl: true,
      description: 'New proposal',
      action: () => {
        if (onNew) {
          onNew();
        } else {
          // Navigate to new proposal
          window.location.href = '/';
        }
      },
      context: 'global',
    },
    {
      key: '/',
      ctrl: true,
      description: 'Show help',
      action: () => {
        if (onHelp) {
          onHelp();
        } else {
          showShortcutsHelp();
        }
      },
      context: 'global',
    },
    {
      key: 'Escape',
      description: 'Close modals/dialogs',
      action: () => {
        // Close any open modals or dialogs
        const openModals = document.querySelectorAll('[role="dialog"]');
        openModals.forEach(modal => {
          const closeButton = modal.querySelector('[aria-label="Close"]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        });
      },
      context: 'global',
    },

    // Workspace shortcuts
    {
      key: 'z',
      ctrl: true,
      description: 'Undo',
      action: () => {
        if (state.canUndo) {
          actions.undo();
        } else {
          toast.info('Nothing to undo');
        }
      },
      context: 'workspace',
    },
    {
      key: 'y',
      ctrl: true,
      description: 'Redo',
      action: () => {
        if (state.canRedo) {
          actions.redo();
        } else {
          toast.info('Nothing to redo');
        }
      },
      context: 'workspace',
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Redo (alternative)',
      action: () => {
        if (state.canRedo) {
          actions.redo();
        } else {
          toast.info('Nothing to redo');
        }
      },
      context: 'workspace',
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Save draft',
      action: () => {
        actions.saveDraft();
      },
      context: 'workspace',
    },

    // Editor shortcuts
    {
      key: 'm',
      ctrl: true,
      description: 'Add material item',
      action: () => {
        actions.addScopeItem(false);
        toast.success('Material item added');
      },
      context: 'editor',
    },
    {
      key: 'l',
      ctrl: true,
      description: 'Add labor item',
      action: () => {
        actions.addScopeItem(true);
        toast.success('Labor item added');
      },
      context: 'editor',
    },
  ];

  // Combine default and custom shortcuts
  const allShortcuts = [...defaultShortcuts, ...customShortcuts];

  // Filter shortcuts by context
  const contextShortcuts = allShortcuts.filter(
    shortcut => !shortcut.context || shortcut.context === context || context === 'global'
  );

  const showShortcutsHelp = useCallback(() => {
    const shortcutsList = contextShortcuts
      .map(shortcut => {
        const keys = [];
        if (shortcut.ctrl) keys.push('Ctrl');
        if (shortcut.shift) keys.push('Shift');
        if (shortcut.alt) keys.push('Alt');
        keys.push(shortcut.key.toUpperCase());
        return `${keys.join(' + ')}: ${shortcut.description}`;
      })
      .join('\n');

    toast.info(
      `Keyboard Shortcuts:\n\n${shortcutsList}`,
      {
        duration: 10000,
        style: {
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '12px',
        },
      }
    );
  }, [contextShortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Allow some shortcuts even in inputs (like save)
        const allowedInInputs = ['s', 'p', '/'];
        if (!allowedInInputs.includes(event.key.toLowerCase()) || !event.ctrlKey) {
          return;
        }
      }

      // Find matching shortcut
      const matchingShortcut = contextShortcuts.find(shortcut => {
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
          matchingShortcut.action();
        } catch (error) {
          console.error('Shortcut action failed:', error);
          toast.error('Shortcut action failed');
        }
      }
    },
    [contextShortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // This component doesn't render anything
  return null;
}

// Hook for custom shortcuts
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description?: string;
    context?: 'global' | 'workspace' | 'editor';
  } = {}
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      // Skip if typing in inputs (unless explicitly allowed)
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const keyMatch = key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = options.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = options.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = options.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
          action();
        } catch (error) {
          console.error('Custom shortcut action failed:', error);
          toast.error('Shortcut action failed');
        }
      }
    },
    [key, action, options]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Helper component to show shortcuts help
export function ShortcutsHelpButton({ 
  shortcuts, 
  buttonText = "Show Shortcuts" 
}: { 
  shortcuts: ShortcutDefinition[];
  buttonText?: string;
}) {
  const showHelp = () => {
    const shortcutsList = shortcuts
      .map(shortcut => {
        const keys = [];
        if (shortcut.ctrl) keys.push('Ctrl');
        if (shortcut.shift) keys.push('Shift');
        if (shortcut.alt) keys.push('Alt');
        keys.push(shortcut.key.toUpperCase());
        return `${keys.join(' + ')}: ${shortcut.description}`;
      })
      .join('\n');

    toast.info(
      `Keyboard Shortcuts:\n\n${shortcutsList}`,
      {
        duration: 10000,
        style: {
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '12px',
        },
      }
    );
  };

  return (
    <button
      onClick={showHelp}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="Show keyboard shortcuts (Ctrl + /)"
    >
      {buttonText}
    </button>
  );
}