import * as React from 'react';
import { motion } from 'framer-motion';

export const AnimatedGrid: React.FC = () => {
  const gridSize = 12;
  const [flashingSquares, setFlashingSquares] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newFlashing = new Set<number>();
      const count = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < count; i++) {
        newFlashing.add(Math.floor(Math.random() * gridSize * gridSize));
      }
      
      setFlashingSquares(newFlashing);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern
            id="grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-indigo-400/20 dark:text-indigo-400/10"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Flashing squares */}
      <div className="absolute inset-0 grid grid-cols-12 gap-0">
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const isFlashing = flashingSquares.has(index);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{
                opacity: isFlashing ? [0, 0.8, 0] : 0,
                scale: isFlashing ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
              }}
              className="relative"
            >
              {isFlashing && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 blur-xl" />
                  <div className="absolute inset-2 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-sm" />
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Floating orbs */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-64 h-64 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${
              i === 0
                ? 'rgba(99, 102, 241, 0.15)'
                : i === 1
                ? 'rgba(168, 85, 247, 0.15)'
                : 'rgba(236, 72, 153, 0.15)'
            } 0%, transparent 70%)`,
          }}
          animate={{
            x: [
              `${20 + i * 30}%`,
              `${50 + i * 20}%`,
              `${10 + i * 25}%`,
              `${20 + i * 30}%`,
            ],
            y: [
              `${30 + i * 20}%`,
              `${60 + i * 15}%`,
              `${20 + i * 30}%`,
              `${30 + i * 20}%`,
            ],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
