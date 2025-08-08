import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  Settings, 
  Bell,
  User,
  FileText,
  BarChart3,
  HelpCircle,
  Palette,
  Save,
  Eye
} from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { useTheme } from '../contexts/ThemeContext';

interface AppHeaderProps {
  currentView: 'dashboard' | 'workspace';
  workspaceState?: {
    proposal: any;
    mode: 'create' | 'edit' | 'version';
    baseProposal?: any;
  } | null;
  onReturnToDashboard?: () => void;
}

export function AppHeader({ currentView, workspaceState, onReturnToDashboard }: AppHeaderProps) {
  const { theme } = useTheme();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const settingsRef = useRef<HTMLDivElement>(null);
  const themeSelectorRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(() => {
    // This would trigger save in the workspace
    console.log('Header save triggered');
  }, []);

  const handlePreview = useCallback(() => {
    // This would switch to preview mode
    console.log('Header preview triggered');
  }, []);

  // Close other dropdowns when one opens
  const handleThemeSelectorToggle = useCallback(() => {
    setShowThemeSelector(prev => !prev);
    setShowSettings(false);
    setShowNotifications(false);
  }, []);

  const handleNotificationsToggle = useCallback(() => {
    setShowNotifications(prev => !prev);
    setShowSettings(false);
    setShowThemeSelector(false);
  }, []);

  const handleSettingsToggle = useCallback(() => {
    setShowSettings(prev => !prev);
    setShowThemeSelector(false);
    setShowNotifications(false);
  }, []);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target as Node)) {
        setShowThemeSelector(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettings(false);
        setShowThemeSelector(false);
        setShowNotifications(false);
      }
      // Ctrl + T for theme selector
      if (event.ctrlKey && event.key === 't') {
        event.preventDefault();
        handleThemeSelectorToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleThemeSelectorToggle]);

  return (
    <header className={`modern-header sticky top-0 z-50 transition-all duration-300 ${
      theme === 'tactical' ? 'border-b-2' : 'border-b'
    }`}>
      <div className="container-padding py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and navigation */}
          <div className="flex items-center gap-4">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                theme === 'tactical' 
                  ? 'bg-white text-black border-2 border-white' 
                  : theme === 'dark-glass'
                  ? 'bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm'
                  : 'bg-primary text-primary-foreground'
              }`}>
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className={`font-bold text-lg transition-colors duration-300 ${
                  theme === 'tactical' ? 'text-white' : ''
                }`}>
                  Lineage Builders
                </h1>
                <div className={`text-xs transition-colors duration-300 ${
                  theme === 'tactical' 
                    ? 'text-gray-300' 
                    : theme === 'dark-glass'
                    ? 'text-muted-foreground/80'
                    : 'text-muted-foreground'
                }`}>
                  Professional Proposal System
                </div>
              </div>
            </div>

            {/* Workspace navigation */}
            {currentView === 'workspace' && (
              <>
                <Separator orientation="vertical" className={`h-8 transition-colors duration-300 ${
                  theme === 'tactical' ? 'bg-gray-600' : ''
                }`} />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReturnToDashboard}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    theme === 'tactical' 
                      ? 'text-white hover:bg-gray-800 border border-gray-600 hover:border-gray-500' 
                      : theme === 'dark-glass'
                      ? 'text-foreground hover:bg-white/10 border border-white/20 backdrop-blur-sm'
                      : ''
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>

                {workspaceState && (
                  <div className="flex items-center gap-2">
                    <div className={`transition-colors duration-300 ${
                      theme === 'tactical' ? 'text-white' : ''
                    }`}>
                      <div className="font-semibold text-sm">
                        {workspaceState.proposal?.projectTitle || 'New Proposal'}
                      </div>
                      <div className={`text-xs flex items-center gap-2 ${
                        theme === 'tactical' 
                          ? 'text-gray-300' 
                          : theme === 'dark-glass'
                          ? 'text-muted-foreground/80'
                          : 'text-muted-foreground'
                      }`}>
                        <Badge 
                          variant="outline" 
                          className={`text-xs transition-all duration-300 ${
                            theme === 'tactical' 
                              ? 'bg-gray-900 border-gray-600 text-white hover:bg-gray-800' 
                              : theme === 'dark-glass'
                              ? 'bg-white/10 border-white/20 text-foreground backdrop-blur-sm'
                              : ''
                          }`}
                        >
                          {workspaceState.mode === 'create' ? 'Creating' : 
                           workspaceState.mode === 'version' ? 'New Version' : 'Editing'}
                        </Badge>
                        {workspaceState.proposal?.version && (
                          <span>v{workspaceState.proposal.version}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right side - Actions and controls */}
          <div className="flex items-center gap-2">
            {/* Workspace actions */}
            {currentView === 'workspace' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className={`hidden sm:flex items-center gap-2 transition-all duration-300 ${
                    theme === 'tactical' 
                      ? 'bg-gray-900 border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500' 
                      : theme === 'dark-glass'
                      ? 'bg-white/10 border-white/20 text-foreground hover:bg-white/20 backdrop-blur-sm'
                      : ''
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleSave}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    theme === 'tactical' 
                      ? 'bg-white text-black hover:bg-gray-200 border-2 border-white' 
                      : theme === 'dark-glass'
                      ? 'bg-primary/90 text-primary-foreground hover:bg-primary shadow-lg shadow-primary/25 backdrop-blur-sm'
                      : 'contractor-button-primary'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                
                <Separator orientation="vertical" className={`h-6 transition-colors duration-300 ${
                  theme === 'tactical' ? 'bg-gray-600' : ''
                }`} />
              </>
            )}

            {/* Theme selector */}
            <div className="relative" ref={themeSelectorRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleThemeSelectorToggle}
                className={`transition-all duration-300 ${
                  theme === 'tactical' 
                    ? 'text-white hover:bg-gray-800 border border-gray-600 hover:border-gray-500' 
                    : theme === 'dark-glass'
                    ? 'text-foreground hover:bg-white/10 border border-white/20 backdrop-blur-sm'
                    : theme === 'stealth'
                    ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-600'
                    : ''
                }`}
                title="Change Theme"
              >
                <Palette className="h-4 w-4" />
              </Button>
              
              {showThemeSelector && (
                <div className={`absolute right-0 top-full mt-2 z-50 transition-all duration-300 ${
                  theme === 'tactical' 
                    ? 'glass-panel bg-black border-gray-600' 
                    : theme === 'dark-glass'
                    ? 'glass-panel backdrop-blur-xl'
                    : theme === 'stealth'
                    ? 'glass-panel bg-zinc-900/95 border-zinc-600'
                    : 'glass-panel'
                }`}>
                  <ThemeSelector onThemeChange={() => setShowThemeSelector(false)} />
                </div>
              )}
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotificationsToggle}
              className={`relative transition-all duration-300 ${
                theme === 'tactical' 
                  ? 'text-white hover:bg-gray-800 border border-gray-600 hover:border-gray-500' 
                  : theme === 'dark-glass'
                  ? 'text-foreground hover:bg-white/10 border border-white/20 backdrop-blur-sm'
                  : theme === 'stealth'
                  ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-600'
                  : ''
              }`}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full transition-all duration-300 ${
                theme === 'tactical' ? 'bg-white' : theme === 'stealth' ? 'bg-zinc-400' : 'bg-primary'
              }`}></span>
            </Button>

            {/* Settings/Profile */}
            <div className="relative" ref={settingsRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettingsToggle}
                className={`transition-all duration-300 ${
                  theme === 'tactical' 
                    ? 'text-white hover:bg-gray-800 border border-gray-600 hover:border-gray-500' 
                    : theme === 'dark-glass'
                    ? 'text-foreground hover:bg-white/10 border border-white/20 backdrop-blur-sm'
                    : theme === 'stealth'
                    ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-600'
                    : ''
                }`}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {showSettings && (
                <div className={`absolute right-0 top-full mt-2 w-64 z-50 transition-all duration-300 ${
                  theme === 'tactical' 
                    ? 'glass-panel bg-black border-gray-600' 
                    : theme === 'dark-glass'
                    ? 'glass-panel backdrop-blur-xl'
                    : theme === 'stealth'
                    ? 'glass-panel bg-zinc-900/95 border-zinc-600'
                    : 'glass-panel'
                }`}>
                  <div className="p-4">
                    <h3 className={`font-semibold mb-3 transition-colors duration-300 ${
                      theme === 'tactical' ? 'text-white' : theme === 'stealth' ? 'text-zinc-300' : ''
                    }`}>
                      Settings
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowThemeSelector(!showThemeSelector);
                          setShowSettings(false);
                        }}
                        className={`w-full justify-start transition-all duration-300 ${
                          theme === 'tactical' 
                            ? 'text-white hover:bg-gray-800 border border-gray-700' 
                            : theme === 'dark-glass'
                            ? 'text-foreground hover:bg-white/10'
                            : theme === 'stealth'
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                            : ''
                        }`}
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        Change Theme
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Opening preferences');
                          setShowSettings(false);
                        }}
                        className={`w-full justify-start transition-all duration-300 ${
                          theme === 'tactical' 
                            ? 'text-white hover:bg-gray-800 border border-gray-700' 
                            : theme === 'dark-glass'
                            ? 'text-foreground hover:bg-white/10'
                            : theme === 'stealth'
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                            : ''
                        }`}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Preferences
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Opening help');
                          setShowSettings(false);
                        }}
                        className={`w-full justify-start transition-all duration-300 ${
                          theme === 'tactical' 
                            ? 'text-white hover:bg-gray-800 border border-gray-700' 
                            : theme === 'dark-glass'
                            ? 'text-foreground hover:bg-white/10'
                            : theme === 'stealth'
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                            : ''
                        }`}
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Help & Support
                      </Button>
                      
                      <div className={`my-2 border-t ${
                        theme === 'tactical' ? 'border-gray-700' : theme === 'stealth' ? 'border-zinc-700' : 'border-border'
                      }`} />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Show keyboard shortcuts help
                          const shortcuts = 'Keyboard Shortcuts:\n\n' +
                            'Ctrl + S - Save proposal\n' +
                            'Ctrl + N - New proposal\n' +
                            'Ctrl + P - Print/Preview\n' +
                            'Ctrl + / - Show this help\n' +
                            'Ctrl + T - Change theme\n' +
                            'Escape - Close dialogs';
                          alert(shortcuts);
                          setShowSettings(false);
                        }}
                        className={`w-full justify-start transition-all duration-300 ${
                          theme === 'tactical' 
                            ? 'text-white hover:bg-gray-800 border border-gray-700' 
                            : theme === 'dark-glass'
                            ? 'text-foreground hover:bg-white/10'
                            : theme === 'stealth'
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                            : ''
                        }`}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Keyboard Shortcuts
                      </Button>
                      
                      <div className={`pt-2 text-xs ${
                        theme === 'tactical' ? 'text-gray-400' : theme === 'stealth' ? 'text-zinc-500' : 'text-muted-foreground'
                      }`}>
                        Version 2.2 • Lineage Builders
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              className={`transition-all duration-300 ${
                theme === 'tactical' 
                  ? 'text-white hover:bg-gray-800 border border-gray-600 hover:border-gray-500' 
                  : theme === 'dark-glass'
                  ? 'text-foreground hover:bg-white/10 border border-white/20 backdrop-blur-sm'
                  : ''
              }`}
              title="Help & Shortcuts"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notification dropdown */}
        {showNotifications && (
          <div 
            ref={notificationsRef}
            className={`absolute right-4 top-full mt-2 w-80 z-50 transition-all duration-300 ${
              theme === 'tactical' 
                ? 'glass-panel bg-gray-900 border-gray-600' 
                : theme === 'dark-glass'
                ? 'glass-panel backdrop-blur-xl'
                : theme === 'stealth'
                ? 'glass-panel bg-zinc-900/95 border-zinc-600'
                : 'glass-panel'
            }`}>
            <div className="p-4">
              <h3 className={`font-semibold mb-3 transition-colors duration-300 ${
                theme === 'tactical' ? 'text-white' : theme === 'stealth' ? 'text-zinc-300' : ''
              }`}>
                Notifications
              </h3>
              <div className="space-y-2">
                <div className={`p-3 rounded-md border transition-all duration-300 ${
                  theme === 'tactical' 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : theme === 'dark-glass'
                    ? 'bg-white/10 border-white/20 backdrop-blur-sm'
                    : theme === 'stealth'
                    ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                    : 'bg-muted border-border'
                }`}>
                  <div className="text-sm font-medium">Proposal Update</div>
                  <div className={`text-xs transition-colors duration-300 ${
                    theme === 'tactical' 
                      ? 'text-gray-300' 
                      : theme === 'stealth'
                      ? 'text-zinc-500'
                      : 'text-muted-foreground'
                  }`}>
                    Auto-saved 2 minutes ago
                  </div>
                </div>
                <div className={`p-3 rounded-md border transition-all duration-300 ${
                  theme === 'tactical' 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : theme === 'dark-glass'
                    ? 'bg-white/10 border-white/20 backdrop-blur-sm'
                    : theme === 'stealth'
                    ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                    : 'bg-muted border-border'
                }`}>
                  <div className="text-sm font-medium">System Status</div>
                  <div className={`text-xs transition-colors duration-300 ${
                    theme === 'tactical' 
                      ? 'text-gray-300' 
                      : theme === 'stealth'
                      ? 'text-zinc-500'
                      : 'text-muted-foreground'
                  }`}>
                    All systems operational
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}