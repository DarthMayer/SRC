import * as React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {/* Interlocking Gears */}
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20">
        {/* Ambient glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 blur-xl sm:blur-2xl bg-gradient-to-br from-emerald-400/50 to-teal-400/50 rounded-full"
        />
        
        {/* Large Gear (Bottom-Left) - Clockwise */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-0 left-0"
          style={{ zIndex: 1 }}
        >
          <Settings 
            className="w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.9)] sm:drop-shadow-[0_0_20px_rgba(52,211,153,0.9)]" 
            strokeWidth={2.5}
          />
        </motion.div>
        
        {/* Small Gear (Top-Right) - Counter-clockwise */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0"
          style={{ zIndex: 2 }}
        >
          <Settings 
            className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-teal-300 drop-shadow-[0_0_10px_rgba(94,234,212,0.9)] sm:drop-shadow-[0_0_15px_rgba(94,234,212,0.9)]" 
            strokeWidth={2.5}
          />
        </motion.div>
      </div>
      
      {/* Text */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl sm:text-2xl lg:text-3xl font-light tracking-wide"
          style={{
            fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          <span className="text-white/90">Maintenance</span>
          {' '}
          <span className="font-semibold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Tracker
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-emerald-200/60 mt-0.5 sm:mt-1.5 text-[10px] sm:text-xs lg:text-sm font-medium tracking-wide uppercase hidden sm:block"
          style={{
            letterSpacing: '0.15em',
          }}
        >
          Monitor • Manage • Maintain
        </motion.p>
      </div>
    </div>
  );
};
