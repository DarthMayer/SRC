import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import type { StatusType } from '../types';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  'opt-due': {
    label: 'Due',
    className: 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-lg shadow-rose-500/20',
    dotClassName: 'bg-rose-400 shadow-lg shadow-rose-500/50',
  },
  'opt-upcoming': {
    label: 'Upcoming',
    className: 'bg-amber-500/20 text-amber-200 border-amber-400/40 shadow-lg shadow-amber-500/20',
    dotClassName: 'bg-amber-300 shadow-lg shadow-amber-400/50',
  },
  'opt-completed': {
    label: 'Completed',
    className: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 shadow-lg shadow-emerald-500/20',
    dotClassName: 'bg-emerald-300 shadow-lg shadow-emerald-400/50',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border-2 backdrop-blur-md',
        config.className,
        className
      )}
    >
      <motion.span
        className={cn('w-2 h-2 rounded-full', config.dotClassName)}
        animate={{
          scale: status === 'opt-due' ? [1, 1.3, 1] : 1,
          opacity: status === 'opt-due' ? [1, 0.7, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: status === 'opt-due' ? Infinity : 0,
        }}
      />
      {config.label}
    </motion.div>
  );
};
