'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Upload,
  BarChart3,
  FileText,
  X,
  Sparkles,
  Search,
  Lightbulb,
  User,
  TestTube
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Database, label: 'Datasets', href: '/datasets' },
    { icon: Search, label: 'Queries', href: '/queries' },
    { icon: Lightbulb, label: 'Insights', href: '/insights' },
    { icon: MessageSquare, label: 'Chat', href: '/chat' },
    { icon: TrendingUp, label: 'Forecasting', href: '/forecasting' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Upload, label: 'Upload Data', href: '/upload' },
    { icon: FileText, label: 'Reports', href: '/reports' },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-nexus-500 rounded-lg flex items-center justify-center hover-lift">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Nexus</span>
                <span className="font-light text-muted-foreground ml-1">Intelligence</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost lg:hidden p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 custom-scrollbar overflow-y-auto">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`
                    sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}
                    scale-in
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-nexus-500 rounded-full animate-pulse"></div>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Version 1.0.0</span>
                <span>© 2024</span>
              </div>
              <div className="text-xs text-center">
                <span className="text-nexus-500 font-medium">Nexus Intelligence</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
