'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle() {
  const { theme, setTheme, toggleTheme, resolvedTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System';
    }
    return resolvedTheme === 'dark' ? 'Light' : 'Dark';
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleTheme}
        className="btn-ghost flex items-center space-x-2"
        title={`Switch to ${getLabel()} theme`}
      >
        {getIcon()}
        <span className="hidden sm:inline text-sm">{getLabel()}</span>
      </button>
      
      {/* Theme selector dropdown */}
      <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => setTheme('light')}
          className={`p-1.5 rounded transition-colors ${
            theme === 'light' 
              ? 'bg-background shadow-sm' 
              : 'hover:bg-background/50'
          }`}
          title="Light theme"
        >
          <Sun className="w-3 h-3" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-1.5 rounded transition-colors ${
            theme === 'dark' 
              ? 'bg-background shadow-sm' 
              : 'hover:bg-background/50'
          }`}
          title="Dark theme"
        >
          <Moon className="w-3 h-3" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`p-1.5 rounded transition-colors ${
            theme === 'system' 
              ? 'bg-background shadow-sm' 
              : 'hover:bg-background/50'
          }`}
          title="System theme"
        >
          <Monitor className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
