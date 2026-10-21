import * as React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

export const AnimatedLogo: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3"
    >
      <motion.div
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full" />
        <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50">
          <Package className="w-6 h-6 text-white" />
        </div>
      </motion.div>
      
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent"
          style={{
            backgroundSize: '200% auto',
          }}
        >
          Inventory
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-slate-600 dark:text-slate-400"
        >
          Smart Management
        </motion.p>
      </div>
    </motion.div>
  );
};
