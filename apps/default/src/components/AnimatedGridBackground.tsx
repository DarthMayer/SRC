import * as React from 'react';
import { motion } from 'framer-motion';

interface GridSquare {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  color: string;
}

const GRID_SIZE = 60;
const COLORS = [
  'rgba(168, 85, 247, 0.25)',
  'rgba(139, 92, 246, 0.22)',
  'rgba(192, 132, 252, 0.20)',
  'rgba(236, 72, 153, 0.18)',
  'rgba(99, 102, 241, 0.18)',
];

// Memoized floating shape to prevent re-renders
const FloatingShape = React.memo<{
  className?: string;
  style?: React.CSSProperties;
  animate: object;
  transition: object;
  children?: React.ReactNode;
}>(({ className, style, animate, transition, children }) => (
  <motion.div
    className={className}
    style={{ ...style, willChange: 'transform' }}
    animate={animate}
    transition={transition}
  >
    {children}
  </motion.div>
));
FloatingShape.displayName = 'FloatingShape';

// Memoized grid square
const GridSquareItem = React.memo<{ square: GridSquare }>(({ square }) => (
  <motion.div
    className="absolute rounded-sm"
    style={{
      left: square.x,
      top: square.y,
      width: GRID_SIZE - 2,
      height: GRID_SIZE - 2,
      boxShadow: `0 0 20px ${square.color}`,
      willChange: 'transform, opacity',
    }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0, 0.9, 0],
      scale: [0.8, 1, 0.8],
      backgroundColor: ['transparent', square.color, 'transparent'],
    }}
    transition={{
      duration: square.duration,
      delay: square.delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
));
GridSquareItem.displayName = 'GridSquareItem';

export const AnimatedGridBackground: React.FC = React.memo(() => {
  const [squares, setSquares] = React.useState<GridSquare[]>([]);

  React.useEffect(() => {
    const generateSquares = () => {
      const cols = Math.ceil(window.innerWidth / GRID_SIZE);
      const rows = Math.ceil(window.innerHeight / GRID_SIZE);
      const totalSquares = cols * rows;
      const animatedCount = Math.floor(totalSquares * 0.04); // Reduced from 0.06
      const newSquares: GridSquare[] = [];
      
      for (let i = 0; i < animatedCount; i++) {
        const col = Math.floor(Math.random() * cols);
        const row = Math.floor(Math.random() * rows);
        newSquares.push({
          id: i,
          x: col * GRID_SIZE,
          y: row * GRID_SIZE,
          delay: Math.random() * 8,
          duration: 4 + Math.random() * 3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
      
      setSquares(newSquares);
    };

    generateSquares();
    
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(generateSquares, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base grid pattern - purple tinted */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      />
      
      {/* Animated flashing squares */}
      {squares.map((square) => (
        <GridSquareItem key={square.id} square={square} />
      ))}
      
      {/* Large Purple Orb - Primary */}
      <FloatingShape
        className="absolute w-[500px] h-[500px] rounded-full opacity-40 dark:opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(139, 92, 246, 0.3) 40%, transparent 70%)',
          filter: 'blur(80px)',
          boxShadow: '0 0 120px rgba(168, 85, 247, 0.4)',
        }}
        animate={{
          x: ['-10%', '25%', '-10%'],
          y: ['5%', '50%', '5%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Pink/Magenta Orb */}
      <FloatingShape
        className="absolute w-[400px] h-[400px] rounded-full opacity-35 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, rgba(192, 132, 252, 0.3) 50%, transparent 70%)',
          filter: 'blur(70px)',
          right: '5%',
          boxShadow: '0 0 100px rgba(236, 72, 153, 0.3)',
        }}
        animate={{
          x: ['15%', '-25%', '15%'],
          y: ['50%', '15%', '50%'],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Violet/Indigo Orb */}
      <FloatingShape
        className="absolute w-[350px] h-[350px] rounded-full opacity-30 dark:opacity-18"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, rgba(139, 92, 246, 0.3) 50%, transparent 70%)',
          filter: 'blur(60px)',
          bottom: '10%',
          left: '25%',
          boxShadow: '0 0 80px rgba(99, 102, 241, 0.35)',
        }}
        animate={{
          x: ['-5%', '35%', '-5%'],
          y: ['0%', '-25%', '0%'],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating Geometric Shapes with Neon Glow */}
      
      {/* Large Glowing Circle - Top Right */}
      <FloatingShape
        className="absolute w-36 h-36 rounded-full"
        style={{
          top: '8%',
          right: '12%',
          border: '2px solid rgba(168, 85, 247, 0.4)',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.1)',
        }}
        animate={{
          y: [0, -35, 0],
          x: [0, 25, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Medium Glowing Square - Left Side */}
      <FloatingShape
        className="absolute w-28 h-28 rounded-xl"
        style={{
          top: '35%',
          left: '6%',
          border: '2px solid rgba(139, 92, 246, 0.4)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          boxShadow: '0 0 35px rgba(139, 92, 246, 0.35), inset 0 0 15px rgba(139, 92, 246, 0.1)',
        }}
        animate={{
          y: [0, 50, 0],
          x: [0, -20, 0],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Small Glowing Circle - Bottom Right */}
      <FloatingShape
        className="absolute w-20 h-20 rounded-full"
        style={{
          bottom: '12%',
          right: '22%',
          border: '2px solid rgba(236, 72, 153, 0.45)',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
          boxShadow: '0 0 25px rgba(236, 72, 153, 0.4), inset 0 0 12px rgba(236, 72, 153, 0.15)',
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glowing Triangle - Top Left */}
      <FloatingShape
        className="absolute w-24 h-24"
        style={{
          top: '22%',
          left: '18%',
          filter: 'drop-shadow(0 0 15px rgba(192, 132, 252, 0.5))',
        }}
        animate={{
          y: [0, 40, 0],
          x: [0, -25, 0],
          rotate: [0, 120, 240, 360],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,10 90,90 10,90"
            fill="rgba(192, 132, 252, 0.08)"
            stroke="rgba(192, 132, 252, 0.45)"
            strokeWidth="2"
          />
        </svg>
      </FloatingShape>

      {/* Glowing Hexagon - Middle Right */}
      <FloatingShape
        className="absolute w-32 h-32"
        style={{
          top: '45%',
          right: '8%',
          filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))',
        }}
        animate={{
          y: [0, -45, 0],
          x: [0, 15, 0],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 90,25 90,75 50,95 10,75 10,25"
            fill="rgba(99, 102, 241, 0.1)"
            stroke="rgba(99, 102, 241, 0.45)"
            strokeWidth="2"
          />
        </svg>
      </FloatingShape>

      {/* Glowing Diamond - Top Center */}
      <FloatingShape
        className="absolute w-16 h-16 rotate-45 rounded-md"
        style={{
          top: '15%',
          left: '42%',
          border: '2px solid rgba(168, 85, 247, 0.5)',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          boxShadow: '0 0 25px rgba(168, 85, 247, 0.4), inset 0 0 10px rgba(168, 85, 247, 0.15)',
        }}
        animate={{
          y: [0, 35, 0],
          rotate: [45, 225, 405],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Large Glowing Ring - Bottom Left */}
      <FloatingShape
        className="absolute w-24 h-24 rounded-full"
        style={{
          bottom: '20%',
          left: '10%',
          border: '3px solid rgba(139, 92, 246, 0.35)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.4), inset 0 0 25px rgba(139, 92, 246, 0.1)',
        }}
        animate={{
          y: [0, -40, 0],
          x: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glowing Small Square - Middle */}
      <FloatingShape
        className="absolute w-16 h-16 rounded-lg"
        style={{
          top: '55%',
          left: '32%',
          border: '2px solid rgba(236, 72, 153, 0.4)',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
          boxShadow: '0 0 20px rgba(236, 72, 153, 0.35), inset 0 0 10px rgba(236, 72, 153, 0.1)',
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -15, 0],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Large Glowing Rounded Square - Bottom Center */}
      <FloatingShape
        className="absolute w-40 h-40 rounded-2xl"
        style={{
          bottom: '8%',
          left: '48%',
          border: '2px solid rgba(168, 85, 247, 0.3)',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.08)',
        }}
        animate={{
          y: [0, -25, 0],
          x: [0, 35, 0],
          rotate: [0, -45, 0],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Pulsing Dot Cluster - Top Right Area */}
      <div
        className="absolute"
        style={{
          top: '30%',
          right: '28%',
        }}
      >
        <div className="relative w-12 h-12">
          <motion.div 
            className="absolute w-3 h-3 rounded-full top-0 left-0"
            style={{ 
              backgroundColor: 'rgba(168, 85, 247, 0.5)',
              boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)',
              willChange: 'transform, opacity',
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <motion.div 
            className="absolute w-3 h-3 rounded-full top-0 right-0"
            style={{ 
              backgroundColor: 'rgba(236, 72, 153, 0.5)',
              boxShadow: '0 0 12px rgba(236, 72, 153, 0.6)',
              willChange: 'transform, opacity',
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, delay: 0.7, repeat: Infinity }}
          />
          <motion.div 
            className="absolute w-3 h-3 rounded-full bottom-0 left-1/2 -translate-x-1/2"
            style={{ 
              backgroundColor: 'rgba(139, 92, 246, 0.5)',
              boxShadow: '0 0 12px rgba(139, 92, 246, 0.6)',
              willChange: 'transform, opacity',
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, delay: 1.4, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Extra small floating ring */}
      <FloatingShape
        className="absolute w-10 h-10 rounded-full"
        style={{
          top: '70%',
          right: '40%',
          border: '2px solid rgba(192, 132, 252, 0.4)',
          boxShadow: '0 0 15px rgba(192, 132, 252, 0.4)',
        }}
        animate={{
          y: [0, -20, 0],
          x: [0, -15, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Gradient overlay for depth - purple tinted */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-violet-100/20 dark:from-purple-950/30 dark:via-transparent dark:to-violet-900/20" />
    </div>
  );
});

AnimatedGridBackground.displayName = 'AnimatedGridBackground';
