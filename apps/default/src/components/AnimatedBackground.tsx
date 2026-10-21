import * as React from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-900">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/4 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-1/3 w-96 h-96 bg-sage-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -80, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Geometric grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <motion.path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-emerald-500/30"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 border border-emerald-500/20 rotate-45"
        animate={{
          rotate: [45, 135, 45],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-2/3 right-1/4 w-24 h-24 border border-teal-500/20"
        animate={{
          rotate: [0, 180, 360],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 left-1/2 w-20 h-20 border border-sage-500/20 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Hexagon pattern */}
      <svg className="absolute top-1/2 right-1/3 w-40 h-40 opacity-10">
        <motion.polygon
          points="30,0 60,15 60,45 30,60 0,45 0,15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-emerald-400"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </svg>

      {/* Additional geometric shapes */}
      <motion.div
        className="absolute top-1/3 right-1/2 w-28 h-28 border border-teal-500/15"
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
        animate={{
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 left-1/4 w-36 h-36 border border-sage-500/15 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/3 w-24 h-24 border border-emerald-500/20"
        style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
        animate={{
          rotate: [0, 72, 144, 216, 288, 360],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <svg className="absolute bottom-1/4 right-1/4 w-32 h-32 opacity-10">
        <motion.circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-teal-400"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      <motion.div
        className="absolute top-3/4 left-2/3 w-20 h-20 border border-sage-500/20"
        style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
        animate={{
          rotate: [0, -360],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Diagonal lines */}
      <svg className="absolute inset-0 w-full h-full opacity-5">
        <defs>
          <pattern
            id="diagonals"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="100"
              stroke="currentColor"
              strokeWidth="1"
              className="text-emerald-500"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagonals)" />
      </svg>

      {/* Animated dots - increased from 20 to 60 */}
      {[...Array(60)].map((_, i) => {
        const size = Math.random() > 0.7 ? 2 : 1;
        const colors = ['emerald', 'teal', 'cyan', 'sage'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        return (
          <motion.div
            key={`dot-${i}`}
            className={`absolute w-${size} h-${size} bg-${color}-400/30 rounded-full`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.8, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Floating triangles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`triangle-${i}`}
          className="absolute border border-emerald-500/15"
          style={{
            width: `${20 + Math.random() * 30}px`,
            height: `${20 + Math.random() * 30}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          }}
          animate={{
            rotate: [0, 360],
            y: [0, -30, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Small squares */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`square-${i}`}
          className="absolute border border-teal-500/20"
          style={{
            width: `${15 + Math.random() * 25}px`,
            height: `${15 + Math.random() * 25}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Hexagons */}
      {[...Array(6)].map((_, i) => (
        <svg
          key={`hexagon-${i}`}
          className="absolute opacity-10"
          style={{
            width: `${30 + Math.random() * 40}px`,
            height: `${30 + Math.random() * 40}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          <motion.polygon
            points="30,0 60,15 60,45 30,60 0,45 0,15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-cyan-400"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 25 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
            }}
          />
        </svg>
      ))}

      {/* Circles with different sizes */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute border border-sage-500/15 rounded-full"
          style={{
            width: `${25 + Math.random() * 50}px`,
            height: `${25 + Math.random() * 50}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.35, 0.15],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 18 + Math.random() * 12,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute border border-emerald-500/20"
          style={{
            width: `${20 + Math.random() * 30}px`,
            height: `${20 + Math.random() * 30}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 22 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`glow-${i}`}
          className="absolute rounded-full blur-sm"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, rgba(16, 185, 129, ${0.3 + Math.random() * 0.3}) 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Connecting lines effect */}
      <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.line
            key={`line-${i}`}
            x1={`${Math.random() * 100}%`}
            y1={`${Math.random() * 100}%`}
            x2={`${Math.random() * 100}%`}
            y2={`${Math.random() * 100}%`}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-emerald-400"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
};
