import * as React from 'react';
import { motion } from 'framer-motion';
import { Box, Sparkles, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface AppHeaderProps {
  onQuickAdd?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onQuickAdd }) => {
  return (
    <header className={cn(
      "border-b border-purple-500/20",
      "bg-slate-900/60 backdrop-blur-xl",
      "shadow-[0_4px_30px_rgba(0,0,0,0.3),0_0_20px_rgba(168,85,247,0.08)]",
      "safe-area-top"
    )}>
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2 sm:gap-3 min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg sm:rounded-xl blur-lg opacity-60" />
              <div className={cn(
                "relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl",
                "bg-gradient-to-br from-purple-500 to-violet-500",
                "shadow-[0_0_25px_rgba(168,85,247,0.5)]",
                "border border-purple-400/30"
              )}>
                <Box className="w-5 h-5 sm:w-6 sm:h-6 text-white" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }} />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className={cn(
                "text-base sm:text-xl font-bold truncate",
                "bg-gradient-to-r from-white via-purple-200 to-violet-200 bg-clip-text text-transparent"
              )}
              style={{ textShadow: '0 0 30px rgba(168,85,247,0.3)' }}
              >
                <span className="hidden sm:inline">Inventory Management</span>
                <span className="sm:hidden">Inventory</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block truncate">Track and manage your stock efficiently</p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
          >
            <motion.button
              onClick={onQuickAdd}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl relative overflow-hidden',
                'bg-gradient-to-r from-purple-500 to-violet-500',
                'text-white font-semibold text-xs sm:text-sm',
                'transition-all duration-300',
                'flex items-center gap-1.5 sm:gap-2',
                'border border-purple-400/30',
                'shadow-[0_0_25px_rgba(168,85,247,0.4),0_4px_15px_rgba(0,0,0,0.2)]',
                'hover:shadow-[0_0_35px_rgba(168,85,247,0.6),0_4px_20px_rgba(0,0,0,0.3)]'
              )}
            >
              <Plus className="w-4 h-4 sm:hidden" />
              <Sparkles className="w-4 h-4 hidden sm:block" />
              <span className="hidden sm:inline">Quick Add</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </header>
  );
};
