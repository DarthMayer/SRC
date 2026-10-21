import * as React from 'react';
import { motion } from 'framer-motion';
import { Package, BarChart3, Settings, Bot } from 'lucide-react';
import { cn } from '../lib/utils';

export type TabId = 'inventory' | 'analytics' | 'settings' | 'assistant';

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
}

const tabs: Tab[] = [
  { id: 'inventory', label: 'Inventory', shortLabel: 'Items', icon: Package, color: 'purple' },
  { id: 'analytics', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3, color: 'violet' },
  { id: 'assistant', label: 'AI Assistant', shortLabel: 'AI', icon: Bot, color: 'pink' },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings, color: 'indigo' },
];

const colorClasses: Record<string, { bg: string; glow: string; text: string; neonGlow: string }> = {
  purple: {
    bg: 'from-purple-500 to-violet-500',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.5)]',
    text: 'text-purple-400',
    neonGlow: 'rgba(168,85,247,0.5)',
  },
  violet: {
    bg: 'from-violet-500 to-indigo-500',
    glow: 'shadow-[0_0_25px_rgba(139,92,246,0.5)]',
    text: 'text-violet-400',
    neonGlow: 'rgba(139,92,246,0.5)',
  },
  pink: {
    bg: 'from-pink-500 to-rose-500',
    glow: 'shadow-[0_0_25px_rgba(236,72,153,0.5)]',
    text: 'text-pink-400',
    neonGlow: 'rgba(236,72,153,0.5)',
  },
  indigo: {
    bg: 'from-indigo-500 to-purple-500',
    glow: 'shadow-[0_0_25px_rgba(99,102,241,0.5)]',
    text: 'text-indigo-400',
    neonGlow: 'rgba(99,102,241,0.5)',
  },
};

interface TabLayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
}

export const TabLayout: React.FC<TabLayoutProps> = ({ activeTab, onTabChange, children }) => {
  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="px-3 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
        <div className={cn(
          "flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl",
          "bg-slate-900/60 backdrop-blur-xl",
          "border border-purple-500/20",
          "shadow-[0_0_30px_rgba(168,85,247,0.08),inset_0_1px_0_rgba(255,255,255,0.05)]"
        )}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const colors = colorClasses[tab.color];
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium',
                  'transition-all duration-300 flex-1 sm:flex-none',
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                )}
                whileHover={{ scale: isActive ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={cn(
                      'absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r',
                      colors.bg,
                      colors.glow,
                      'border border-white/10'
                    )}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon 
                  className={cn('w-4 h-4 relative z-10', !isActive && colors.text)} 
                  style={!isActive ? { filter: `drop-shadow(0 0 4px currentColor)` } : undefined}
                />
                {/* Show short label on small screens, full label on medium+ */}
                <span className="relative z-10 hidden xs:inline sm:hidden">{tab.shortLabel}</span>
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
};
