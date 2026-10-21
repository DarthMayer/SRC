import * as React from 'react';
import { motion } from 'framer-motion';
import { Package, BarChart3, Settings, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

type TabId = 'inventory' | 'analytics' | 'settings' | 'notifications';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface TabSystemProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabSystem: React.FC<TabSystemProps> = ({ activeTab, onTabChange }) => {
  const tabs: Tab[] = [
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="relative">
      {/* Tab container with glass effect */}
      <div className="inline-flex items-center gap-1 p-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/30 relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-xl" />
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-300 flex items-center gap-2',
                'z-10',
                isActive
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
              whileHover={{ scale: isActive ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active background with neon glow */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg glow-soft-indigo"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              
              {/* Icon and label */}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
              
              {/* Shimmer effect on active tab */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-lg" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
