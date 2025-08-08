import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Palette, Sun, Moon, Zap, Target, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeSelectorProps {
  onThemeChange?: () => void;
}

export function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: 'simple',
      name: 'Simple UI',
      description: 'Clean and minimal design',
      icon: Sun,
      preview: {
        bg: 'bg-white',
        card: 'bg-gray-50',
        text: 'text-gray-900',
        accent: 'bg-blue-600'
      }
    },
    {
      id: 'light-glass',
      name: 'Light Glass',
      description: 'Modern glassmorphic design',
      icon: Palette,
      preview: {
        bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        card: 'bg-white/70 backdrop-blur-sm',
        text: 'text-gray-900',
        accent: 'bg-sky-500'
      }
    },
    {
      id: 'dark-glass',
      name: 'Dark Glass',
      description: 'Sophisticated dark glassmorphic',
      icon: Moon,
      preview: {
        bg: 'bg-gradient-to-br from-slate-900 to-slate-800',
        card: 'bg-slate-800/60 backdrop-blur-sm',
        text: 'text-slate-100',
        accent: 'bg-blue-400'
      }
    },
    {
      id: 'tactical',
      name: 'Tactical',
      description: 'High-contrast professional',
      icon: Target,
      preview: {
        bg: 'bg-black',
        card: 'bg-gray-900 border border-gray-700',
        text: 'text-white',
        accent: 'bg-white'
      }
    },
    {
      id: 'stealth',
      name: 'Stealth Mode',
      description: 'Ultra-low visibility dark',
      icon: EyeOff,
      preview: {
        bg: 'bg-gradient-to-br from-gray-950 to-black',
        card: 'bg-gray-900/60 border border-gray-800',
        text: 'text-gray-400',
        accent: 'bg-gray-600'
      }
    }
  ];

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId as any);
    onThemeChange?.();
  };

  return (
    <div className={`p-4 w-80 space-y-4 transition-all duration-300 ${
      theme === 'tactical' ? 'text-white' : theme === 'stealth' ? 'text-zinc-400' : ''
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-4 w-4" />
        <h3 className="font-semibold">Choose Theme</h3>
      </div>
      
      <div className="grid gap-3">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.id;
          
          return (
            <Button
              key={themeOption.id}
              variant="ghost"
              onClick={() => handleThemeSelect(themeOption.id)}
              className={`w-full p-0 h-auto transition-all duration-300 ${
                theme === 'tactical' 
                  ? 'hover:bg-gray-800 border border-gray-600' 
                  : theme === 'dark-glass'
                  ? 'hover:bg-white/10 border border-white/20'
                  : theme === 'stealth'
                  ? 'hover:bg-zinc-800/50 border border-zinc-600'
                  : ''
              }`}
            >
              <Card className={`w-full transition-all duration-300 ${
                isSelected 
                  ? theme === 'tactical'
                    ? 'ring-2 ring-white bg-gray-800'
                    : theme === 'dark-glass'
                    ? 'ring-2 ring-primary bg-white/20'
                    : theme === 'stealth'
                    ? 'ring-2 ring-zinc-500 bg-zinc-800/60'
                    : 'ring-2 ring-primary'
                  : theme === 'tactical'
                  ? 'bg-gray-900 border-gray-700 hover:bg-gray-800'
                  : theme === 'dark-glass'
                  ? 'bg-white/10 border-white/20 hover:bg-white/15'
                  : theme === 'stealth'
                  ? 'bg-zinc-900/60 border-zinc-700 hover:bg-zinc-800/60'
                  : 'hover:shadow-md'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 transition-colors duration-300 ${
                        theme === 'tactical' ? 'text-white' : theme === 'stealth' ? 'text-zinc-400' : ''
                      }`} />
                      <div className="text-left">
                        <div className={`font-semibold text-sm transition-colors duration-300 ${
                          theme === 'tactical' ? 'text-white' : theme === 'stealth' ? 'text-zinc-300' : ''
                        }`}>
                          {themeOption.name}
                        </div>
                        <div className={`text-xs transition-colors duration-300 ${
                          theme === 'tactical' 
                            ? 'text-gray-300' 
                            : theme === 'dark-glass'
                            ? 'text-muted-foreground/80'
                            : theme === 'stealth'
                            ? 'text-zinc-500'
                            : 'text-muted-foreground'
                        }`}>
                          {themeOption.description}
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 ${
                        theme === 'tactical' 
                          ? 'bg-white text-black' 
                          : theme === 'stealth'
                          ? 'bg-zinc-500 text-white'
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  
                  {/* Theme preview */}
                  <div className={`h-12 rounded-md overflow-hidden ${themeOption.preview.bg}`}>
                    <div className="flex h-full">
                      <div className={`flex-1 ${themeOption.preview.card} p-2 m-1 rounded`}>
                        <div className={`h-2 ${themeOption.preview.accent} rounded mb-1`}></div>
                        <div className={`h-1 ${themeOption.preview.text} opacity-20 rounded`}></div>
                      </div>
                      <div className={`w-8 ${themeOption.preview.accent} m-1 rounded`}></div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Badge 
                      className={`mt-2 w-full justify-center transition-all duration-300 ${
                        theme === 'tactical' 
                          ? 'bg-white text-black border-white' 
                          : theme === 'dark-glass'
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : theme === 'stealth'
                          ? 'bg-zinc-600 text-zinc-100 border-zinc-500'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      Active
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Button>
          );
        })}
      </div>
      
      <div className={`text-xs text-center pt-2 border-t transition-colors duration-300 ${
        theme === 'tactical' 
          ? 'text-gray-400 border-gray-600' 
          : theme === 'dark-glass'
          ? 'text-muted-foreground/70 border-white/20'
          : theme === 'stealth'
          ? 'text-zinc-500 border-zinc-700'
          : 'text-muted-foreground border-border'
      }`}>
        Theme changes apply instantly
      </div>
    </div>
  );
}