import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, ExternalLink, Edit2, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryApi, type InventoryItem, PROJECT_IDS } from '../services/api';
import { AddItemForm } from './AddItemForm';
import { cn } from '../lib/utils';
import { useInventoryStore, useIsCacheValid } from '../store';

type StatusFilter = 'all' | 'stock-good' | 'stock-low' | 'stock-out' | 'stock-ordered';

// Category Donut Chart Component
const CategoryDonutChart: React.FC<{ 
  items: InventoryItem[];
}> = ({ items }) => {
  const [hoveredRing, setHoveredRing] = React.useState<string | null>(null);
  
  // Calculate category stats
  const categoryStats = React.useMemo(() => {
    const categories: Record<string, number> = {};
    items.forEach(item => {
      const cat = item.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return categories;
  }, [items]);

  const total = items.length;
  
  // Create rings from categories (top 4)
  const categoryColors = [
    { color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.6)', bgColor: 'rgba(6, 182, 212, 0.1)' },
    { color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.6)', bgColor: 'rgba(139, 92, 246, 0.1)' },
    { color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.6)', bgColor: 'rgba(236, 72, 153, 0.1)' },
    { color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.6)', bgColor: 'rgba(245, 158, 11, 0.1)' },
  ];

  const rings = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, count], index) => ({
      id: category,
      label: category.toUpperCase(),
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
      radius: 105 - (index * 22),
      strokeWidth: 18,
      ...categoryColors[index]
    }));

  const getStrokeDashArray = (radius: number, percent: number) => {
    const circumference = 2 * Math.PI * radius;
    const filled = (percent / 100) * circumference;
    return { circumference, filled };
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Chart Container */}
      <div className="flex items-center justify-center relative">
        {/* Ambient glow background */}
        <motion.div 
          className="absolute inset-0 m-auto w-[200px] h-[200px] rounded-full opacity-50"
          style={{
            background: 'conic-gradient(from 0deg, rgba(6,182,212,0.4), rgba(139,92,246,0.4), rgba(236,72,153,0.4), rgba(6,182,212,0.4))',
            filter: 'blur(40px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner glow */}
        <div 
          className="absolute inset-0 m-auto w-[120px] h-[120px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          }}
        />
        
        {/* SVG Chart - Smaller to fit legend */}
        <svg viewBox="0 0 240 240" className="w-[220px] h-[220px] relative z-10">
          <defs>
            <filter id="centerGlowCat" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background rings */}
          {rings.map((ring) => (
            <circle
              key={`bg-${ring.id}`}
              cx="120"
              cy="120"
              r={ring.radius}
              fill="none"
              stroke={ring.bgColor}
              strokeWidth={ring.strokeWidth}
            />
          ))}

        {/* Filled rings */}
        {rings.map((ring) => {
          const { circumference, filled } = getStrokeDashArray(ring.radius, ring.percent);
          const isHovered = hoveredRing === ring.id;
          const isAnyHovered = hoveredRing !== null;
          const shouldDim = isAnyHovered && !isHovered;
          
          return (
            <motion.circle
              key={ring.id}
              cx="120"
              cy="120"
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ 
                strokeDashoffset: circumference - filled,
                strokeWidth: isHovered ? ring.strokeWidth + 4 : ring.strokeWidth,
                opacity: shouldDim ? 0.3 : 1,
                rotate: 360,
              }}
              transition={{ 
                strokeDashoffset: { duration: 1, ease: "easeOut" },
                strokeWidth: { duration: 0.2 },
                opacity: { duration: 0.2 },
                rotate: { duration: 45, repeat: Infinity, ease: "linear" }
              }}
              style={{ 
                transformOrigin: '120px 120px',
                transformBox: 'fill-box',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredRing(ring.id)}
              onMouseLeave={() => setHoveredRing(null)}
            />
          );
        })}

        {/* Percentage labels */}
        {rings.map((ring) => {
          const hasEnoughSpace = ring.percent > 10;
          if (!hasEnoughSpace) return null;
          
          const angle = ((ring.percent / 100) * 360 / 2 - 90) * (Math.PI / 180);
          const x = 120 + Math.cos(angle) * ring.radius;
          const y = 120 + Math.sin(angle) * ring.radius;
          
          return (
            <text
              key={`label-${ring.id}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="9"
              fontWeight="bold"
              style={{ textShadow: `0 0 8px ${ring.color}, 0 2px 4px rgba(0,0,0,0.9)` }}
            >
              {ring.percent.toFixed(0)}%
            </text>
          );
        })}

        {/* Center content */}
        <circle cx="120" cy="120" r="28" fill="rgba(2, 6, 23, 0.95)" filter="url(#centerGlowCat)" />
        <circle cx="120" cy="120" r="28" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
        <text 
          x="120" 
          y="117" 
          textAnchor="middle" 
          fill="white" 
          fontSize="20" 
          fontWeight="bold"
          style={{ filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.5))' }}
        >
          {total}
        </text>
        <text 
          x="120" 
          y="133" 
          textAnchor="middle" 
          fill="rgba(139,92,246,0.8)" 
          fontSize="7" 
          fontWeight="600"
          letterSpacing="1.5"
        >
          ITEMS
        </text>
        </svg>
      </div>

      {/* Legend - Below Chart */}
      <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
        {rings.map((ring) => {
          const isHovered = hoveredRing === ring.id;
          return (
            <motion.div
              key={ring.id}
              className={cn(
                "flex flex-col items-center px-3 py-2 rounded-xl cursor-pointer transition-all duration-300",
                isHovered && "bg-slate-800/50"
              )}
              whileHover={{ y: -2, scale: 1.05 }}
              onMouseEnter={() => setHoveredRing(ring.id)}
              onMouseLeave={() => setHoveredRing(null)}
              style={{
                boxShadow: isHovered ? `0 0 25px ${ring.glowColor}, 0 4px 15px ${ring.glowColor}` : 'none'
              }}
            >
              {/* Glowing dot */}
              <motion.div 
                className="w-2 h-2 rounded-full mb-1.5"
                style={{ 
                  backgroundColor: ring.color,
                  boxShadow: `0 0 ${isHovered ? '15px' : '8px'} ${ring.color}, 0 0 ${isHovered ? '30px' : '15px'} ${ring.glowColor}`
                }}
                animate={isHovered ? { scale: 1.3 } : { scale: 1 }}
              />
              
              {/* Count */}
              <motion.span 
                className="text-xl font-bold"
                style={{ 
                  color: ring.color,
                  textShadow: `0 0 ${isHovered ? '20px' : '10px'} ${ring.color}`
                }}
              >
                {ring.count}
              </motion.span>
              
              {/* Label */}
              <span className={cn(
                "text-[9px] tracking-wider mt-0.5 transition-colors",
                isHovered ? "text-white" : "text-slate-500"
              )}>
                {ring.label}
              </span>
              
              {/* Percentage */}
              <span 
                className="text-xs font-medium mt-0.5"
                style={{ 
                  color: isHovered ? ring.color : 'rgb(100,116,139)',
                  textShadow: isHovered ? `0 0 8px ${ring.color}` : 'none'
                }}
              >
                {ring.percent.toFixed(0)}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Status Donut Chart Component - Large Neon Style
const ConcentricDonutChart: React.FC<{ 
  stats: { total: number; inStock: number; lowStock: number; outOfStock: number; onOrder: number };
}> = ({ stats }) => {
  const [hoveredRing, setHoveredRing] = React.useState<string | null>(null);
  
  // Calculate percentages
  const inStockPercent = stats.total > 0 ? (stats.inStock / stats.total) * 100 : 0;
  const lowStockPercent = stats.total > 0 ? (stats.lowStock / stats.total) * 100 : 0;
  const outOfStockPercent = stats.total > 0 ? (stats.outOfStock / stats.total) * 100 : 0;
  const onOrderPercent = stats.total > 0 ? (stats.onOrder / stats.total) * 100 : 0;

  // Ring configurations - outer to inner (smaller to fit legend)
  const rings = [
    {
      id: 'in-stock',
      label: 'IN STOCK',
      count: stats.inStock,
      percent: inStockPercent,
      radius: 105,
      strokeWidth: 18,
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.6)',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      id: 'low-stock',
      label: 'LOW STOCK',
      count: stats.lowStock,
      percent: lowStockPercent,
      radius: 83,
      strokeWidth: 18,
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.6)',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      id: 'on-order',
      label: 'ON ORDER',
      count: stats.onOrder,
      percent: onOrderPercent,
      radius: 61,
      strokeWidth: 18,
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.6)',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      id: 'out-of-stock',
      label: 'OUT OF STOCK',
      count: stats.outOfStock,
      percent: outOfStockPercent,
      radius: 39,
      strokeWidth: 18,
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.6)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
  ];

  // Calculate circumference and dash offset for each ring
  const getStrokeDashArray = (radius: number, percent: number) => {
    const circumference = 2 * Math.PI * radius;
    const filled = (percent / 100) * circumference;
    return { circumference, filled };
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Chart Container */}
      <div className="flex items-center justify-center relative">
        {/* Ambient glow background */}
        <motion.div 
          className="absolute inset-0 m-auto w-[200px] h-[200px] rounded-full opacity-50"
          style={{
            background: 'conic-gradient(from 0deg, rgba(16,185,129,0.4), rgba(245,158,11,0.4), rgba(239,68,68,0.4), rgba(16,185,129,0.4))',
            filter: 'blur(40px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner glow */}
        <div 
          className="absolute inset-0 m-auto w-[120px] h-[120px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
          }}
        />
        
        {/* SVG Chart - Smaller to fit legend */}
        <svg viewBox="0 0 240 240" className="w-[220px] h-[220px] relative z-10">
          <defs>
            {/* Neon glow filters */}
            <filter id="neonGlowGreen" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feFlood floodColor="#10b981" floodOpacity="0.8" result="glowColor"/>
              <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow"/>
              <feMerge>
                <feMergeNode in="softGlow"/>
                <feMergeNode in="softGlow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="neonGlowAmber" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feFlood floodColor="#f59e0b" floodOpacity="0.8" result="glowColor"/>
              <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow"/>
              <feMerge>
                <feMergeNode in="softGlow"/>
                <feMergeNode in="softGlow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="neonGlowRed" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feFlood floodColor="#ef4444" floodOpacity="0.8" result="glowColor"/>
              <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow"/>
              <feMerge>
                <feMergeNode in="softGlow"/>
                <feMergeNode in="softGlow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="centerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background rings - STATIC */}
          {rings.map((ring) => (
            <circle
              key={`bg-${ring.id}`}
              cx="120"
              cy="120"
              r={ring.radius}
              fill="none"
              stroke={ring.bgColor}
              strokeWidth={ring.strokeWidth}
            />
          ))}

          {/* Filled rings with neon glow - ROTATING */}
          {rings.map((ring, index) => {
            const { circumference, filled } = getStrokeDashArray(ring.radius, ring.percent);
            const isHovered = hoveredRing === ring.id;
            const filters = ['url(#neonGlowGreen)', 'url(#neonGlowAmber)', 'url(#neonGlowRed)'];
            const isAnyHovered = hoveredRing !== null;
            const shouldDim = isAnyHovered && !isHovered;
            
            return (
              <motion.circle
                key={ring.id}
                cx="120"
                cy="120"
                r={ring.radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={ring.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference}`}
                filter={isHovered ? filters[index] : undefined}
                initial={{ strokeDashoffset: circumference }}
                animate={{ 
                  strokeDashoffset: circumference - filled,
                  strokeWidth: isHovered ? ring.strokeWidth + 4 : ring.strokeWidth,
                  opacity: shouldDim ? 0.3 : 1,
                  rotate: 360,
                }}
                transition={{ 
                  strokeDashoffset: { duration: 1.2, delay: index * 0.15, ease: "easeOut" },
                  strokeWidth: { duration: 0.2 },
                  opacity: { duration: 0.2 },
                  rotate: { duration: 60, repeat: Infinity, ease: "linear" }
                }}
                style={{ 
                  transformOrigin: '120px 120px',
                  transformBox: 'fill-box',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredRing(ring.id)}
                onMouseLeave={() => setHoveredRing(null)}
              />
            );
          })}

          {/* Percentage labels on rings - STATIC */}
          {rings.map((ring) => {
            const hasEnoughSpace = ring.percent > 10;
            if (!hasEnoughSpace) return null;
            
            const angle = ((ring.percent / 100) * 360 / 2 - 90) * (Math.PI / 180);
            const x = 120 + Math.cos(angle) * ring.radius;
            const y = 120 + Math.sin(angle) * ring.radius;
            
            return (
              <text
                key={`label-${ring.id}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
                style={{ textShadow: `0 0 8px ${ring.color}, 0 2px 4px rgba(0,0,0,0.9)` }}
              >
                {ring.percent.toFixed(0)}%
              </text>
            );
          })}

          {/* Center content with glow - STATIC (not rotating) */}
          <circle cx="120" cy="120" r="28" fill="rgba(2, 6, 23, 0.95)" filter="url(#centerGlow)" />
          <circle cx="120" cy="120" r="28" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
          <text 
            x="120" 
            y="117" 
            textAnchor="middle" 
            fill="white" 
            fontSize="20" 
            fontWeight="bold"
            style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.5))' }}
          >
            {stats.total}
          </text>
          <text 
            x="120" 
            y="133" 
            textAnchor="middle" 
            fill="rgba(6,182,212,0.8)" 
            fontSize="7" 
            fontWeight="600"
            letterSpacing="1.5"
          >
            TOTAL
          </text>
        </svg>
      </div>

      {/* Bottom Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
        {rings.map((ring) => {
          const isHovered = hoveredRing === ring.id;
          return (
            <motion.div
              key={ring.id}
              className={cn(
                "flex flex-col items-center px-3 py-2 rounded-xl cursor-pointer transition-all duration-300",
                isHovered && "bg-slate-800/50"
              )}
              whileHover={{ y: -2, scale: 1.05 }}
              onMouseEnter={() => setHoveredRing(ring.id)}
              onMouseLeave={() => setHoveredRing(null)}
              style={{
                boxShadow: isHovered ? `0 0 25px ${ring.glowColor}, 0 4px 15px ${ring.glowColor}` : 'none'
              }}
            >
              {/* Glowing dot */}
              <motion.div 
                className="w-2 h-2 rounded-full mb-1.5"
                style={{ 
                  backgroundColor: ring.color,
                  boxShadow: `0 0 ${isHovered ? '15px' : '8px'} ${ring.color}, 0 0 ${isHovered ? '30px' : '15px'} ${ring.glowColor}`
                }}
                animate={isHovered ? { scale: 1.3 } : { scale: 1 }}
              />
              
              {/* Count */}
              <motion.span 
                className="text-xl font-bold"
                style={{ 
                  color: ring.color,
                  textShadow: `0 0 ${isHovered ? '20px' : '10px'} ${ring.color}`
                }}
              >
                {ring.count}
              </motion.span>
              
              {/* Label */}
              <span className={cn(
                "text-[9px] tracking-wider mt-0.5 transition-colors",
                isHovered ? "text-white" : "text-slate-500"
              )}>
                {ring.label}
              </span>
              
              {/* Percentage */}
              <span 
                className="text-xs font-medium mt-0.5"
                style={{ 
                  color: isHovered ? ring.color : 'rgb(100,116,139)',
                  textShadow: isHovered ? `0 0 8px ${ring.color}` : 'none'
                }}
              >
                {ring.percent.toFixed(0)}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

interface InventoryTabProps {
  showAddForm?: boolean;
  onShowAddFormChange?: (show: boolean) => void;
  isActive?: boolean;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ 
  showAddForm: externalShowAddForm, 
  onShowAddFormChange,
  isActive = true
}) => {
  // Use Zustand store for caching between tab switches
  const { items, isLoading: loading, setItems, setLoading } = useInventoryStore();
  const isCacheValid = useIsCacheValid();
  
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [internalShowAddForm, setInternalShowAddForm] = React.useState(false);
  
  // Use external state if provided, otherwise use internal state
  const showAddForm = externalShowAddForm !== undefined ? externalShowAddForm : internalShowAddForm;
  const setShowAddForm = onShowAddFormChange || setInternalShowAddForm;

  const loadData = React.useCallback(async (forceRefresh = false) => {
    // Skip fetch if cache is valid and not forcing refresh
    if (isCacheValid && !forceRefresh && items.length > 0) {
      return;
    }
    
    setLoading(true);
    try {
      const data = await inventoryApi.getAll();
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [isCacheValid, items.length, setItems, setLoading]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, searchQuery]);

  const stats = React.useMemo(() => {
    const inStock = items.filter(i => i.status === 'stock-good').length;
    const lowStock = items.filter(i => i.status === 'stock-low').length;
    const outOfStock = items.filter(i => i.status === 'stock-out').length;
    const onOrder = items.filter(i => i.status === 'stock-ordered').length;
    return { total: items.length, inStock, lowStock, outOfStock, onOrder };
  }, [items]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'stock-good':
        return { 
          bg: 'bg-emerald-500/10 border-emerald-500/40', 
          text: 'text-emerald-400', 
          label: 'In Stock', 
          dot: 'bg-emerald-400',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
          hoverGlow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
        };
      case 'stock-low':
        return { 
          bg: 'bg-amber-500/10 border-amber-500/40', 
          text: 'text-amber-400', 
          label: 'Low Stock', 
          dot: 'bg-amber-400',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
          hoverGlow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]'
        };
      case 'stock-out':
        return { 
          bg: 'bg-rose-500/10 border-rose-500/40', 
          text: 'text-rose-400', 
          label: 'Out of Stock', 
          dot: 'bg-rose-400',
          glow: 'shadow-[0_0_12px_rgba(239,68,68,0.15)]',
          hoverGlow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]'
        };
      case 'stock-ordered':
        return { 
          bg: 'bg-blue-500/10 border-blue-500/40', 
          text: 'text-blue-400', 
          label: 'On Order', 
          dot: 'bg-blue-400',
          glow: 'shadow-[0_0_12px_rgba(59,130,246,0.15)]',
          hoverGlow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]'
        };
      default:
        return { 
          bg: 'bg-slate-500/10 border-slate-500/40', 
          text: 'text-slate-400', 
          label: 'Unknown', 
          dot: 'bg-slate-400',
          glow: '',
          hoverGlow: ''
        };
    }
  };

  // Only show loading spinner on initial load when no cached data exists
  const showLoadingSpinner = loading && items.length === 0;
  
  if (showLoadingSpinner) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <motion.div
            className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
          />
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Neon Visualizations - Hidden on mobile, shown on lg+ */}
      <div className="hidden lg:flex w-full lg:w-[45%] xl:w-[42%] p-4 lg:p-6 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-700/30 flex-col gap-4">
        {/* Category Chart - Top */}
        <div className={cn(
          "flex-1 min-h-[350px] rounded-2xl p-6 flex flex-col",
          "bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-800/60",
          "backdrop-blur-xl border border-purple-500/20",
          "shadow-[0_0_50px_rgba(139,92,246,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ boxShadow: '0 0 8px rgba(139,92,246,0.6)' }} />
            <h3 className="text-sm font-semibold text-purple-200">Equipment Categories</h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <CategoryDonutChart items={items} />
          </div>
        </div>

        {/* Status Chart - Bottom (Same Size) */}
        <div className={cn(
          "flex-1 min-h-[350px] rounded-2xl p-6 flex flex-col",
          "bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-800/60",
          "backdrop-blur-xl border border-cyan-500/20",
          "shadow-[0_0_50px_rgba(6,182,212,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px rgba(6,182,212,0.6)' }} />
            <h3 className="text-sm font-semibold text-cyan-200">Stock Status</h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ConcentricDonutChart stats={stats} />
          </div>
        </div>
      </div>
      
      {/* Mobile Stats Summary - Shown only on mobile */}
      <div className="lg:hidden px-3 py-3 border-b border-slate-700/30 bg-slate-900/30">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats.total, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Good', value: stats.inStock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Low', value: stats.lowStock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Out', value: stats.outOfStock, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          ].map((stat) => (
            <div key={stat.label} className={cn("rounded-lg p-2 text-center", stat.bg)}>
              <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-slate-500 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Item List */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Search and Filters */}
        <div className="p-2 sm:p-4 border-b border-slate-700/30 flex-shrink-0">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className={cn(
                  'w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm',
                  'bg-slate-800/60 border border-slate-600/40',
                  'text-white placeholder:text-slate-500',
                  'focus:outline-none focus:border-purple-500/50',
                  'focus:shadow-[0_0_15px_rgba(168,85,247,0.15),inset_0_0_10px_rgba(168,85,247,0.05)]',
                  'hover:border-slate-500/50 hover:bg-slate-800/70',
                  'transition-all duration-300'
                )}
              />
            </div>

            {/* Status Filters - Scrollable on mobile */}
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['all', 'stock-good', 'stock-low', 'stock-ordered', 'stock-out'] as const).map((filter) => {
                const isActive = statusFilter === filter;
                const configs: Record<string, { label: string; shortLabel: string; activeColor: string; glowColor: string }> = {
                  all: { label: 'All', shortLabel: 'All', activeColor: 'from-cyan-500 to-blue-500', glowColor: 'rgba(6,182,212,0.3)' },
                  'stock-good': { label: 'In Stock', shortLabel: 'Good', activeColor: 'from-emerald-500 to-green-500', glowColor: 'rgba(16,185,129,0.3)' },
                  'stock-low': { label: 'Low', shortLabel: 'Low', activeColor: 'from-amber-500 to-yellow-500', glowColor: 'rgba(245,158,11,0.3)' },
                  'stock-ordered': { label: 'On Order', shortLabel: 'Order', activeColor: 'from-blue-500 to-indigo-500', glowColor: 'rgba(59,130,246,0.3)' },
                  'stock-out': { label: 'Out', shortLabel: 'Out', activeColor: 'from-rose-500 to-pink-500', glowColor: 'rgba(239,68,68,0.3)' },
                };
                const config = configs[filter];
                return (
                  <motion.button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      'px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium transition-all duration-300',
                      'border flex-shrink-0',
                      isActive
                        ? `bg-gradient-to-r ${config.activeColor} text-white border-transparent`
                        : 'bg-slate-800/60 text-slate-400 border-slate-600/40 hover:bg-slate-700/60 hover:text-slate-200 hover:border-slate-500/50'
                    )}
                    style={{
                      boxShadow: isActive ? `0 0 20px ${config.glowColor}, 0 4px 15px rgba(0,0,0,0.3)` : undefined
                    }}
                  >
                    <span className="sm:hidden">{config.shortLabel}</span>
                    <span className="hidden sm:inline">{config.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Items Header */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b border-slate-700/30 flex-shrink-0 bg-slate-900/30">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.5))' }} />
            </div>
            <h3 className="font-semibold text-white text-sm sm:text-base">Inventory</h3>
            <span className="text-slate-500 font-medium text-xs sm:text-sm">({filteredItems.length})</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <a
              href={`https://www.taskade.com/d/${PROJECT_IDS.INVENTORY}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg",
                "text-slate-400 hover:text-purple-400",
                "hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30",
                "transition-all duration-300"
              )}
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </a>
            <motion.button
              onClick={() => setShowAddForm(true)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2',
                'bg-gradient-to-r from-purple-500 to-violet-500',
                'text-white border border-purple-400/30',
                'shadow-[0_0_25px_rgba(168,85,247,0.4),0_4px_15px_rgba(0,0,0,0.2)]',
                'hover:shadow-[0_0_35px_rgba(168,85,247,0.6),0_4px_20px_rgba(0,0,0,0.3)]',
                'transition-shadow duration-300'
              )}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add Item</span>
              <span className="xs:hidden">Add</span>
            </motion.button>
          </div>
        </div>

        {/* Column Headers - Hidden on mobile */}
        <div className="hidden md:block px-4 py-2.5 border-b border-slate-700/20 flex-shrink-0 bg-slate-900/50">
          <div className="grid grid-cols-[auto_1fr_140px_120px_130px] gap-4 items-center text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            <div className="w-10" /> {/* Icon spacer */}
            <div className="pl-1">Item Name</div>
            <div className="text-center border-l border-slate-700/30 pl-4">Category</div>
            <div className="text-right border-l border-slate-700/30 pl-4">Quantity</div>
            <div className="text-center border-l border-slate-700/30 pl-4">Status</div>
          </div>
        </div>

        {/* Items List - Responsive: Cards on mobile, Table on md+ */}
        <div className="flex-1 overflow-auto">
          <div className="p-1.5 sm:p-2 space-y-1.5">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => {
                const statusStyles = getStatusStyles(item.status);
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      'px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border',
                      'bg-gradient-to-r from-slate-800/50 to-slate-800/30',
                      'backdrop-blur-sm border-slate-600/30',
                      'hover:border-slate-500/50',
                      'transition-all duration-300 group cursor-pointer',
                      statusStyles.glow,
                      statusStyles.hoverGlow
                    )}
                  >
                    {/* Mobile Layout - Card Style */}
                    <div className="md:hidden flex items-center gap-2.5">
                      {/* Icon */}
                      <div className={cn(
                        'flex-shrink-0 p-1.5 rounded-lg border w-9 h-9 flex items-center justify-center',
                        statusStyles.bg
                      )}>
                        <Package className={cn('w-4 h-4', statusStyles.text)} style={{ filter: `drop-shadow(0 0 3px currentColor)` }} />
                      </div>
                      
                      {/* Name & Category */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{item.category || 'Uncategorized'}</p>
                      </div>
                      
                      {/* Quantity & Status */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className={cn('text-lg font-bold tabular-nums', statusStyles.text)} style={{ textShadow: `0 0 8px currentColor` }}>
                            {item.quantity}
                          </p>
                        </div>
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          statusStyles.dot
                        )} style={{ boxShadow: `0 0 8px currentColor` }} />
                      </div>
                    </div>
                    
                    {/* Desktop Layout - Table Row */}
                    <div className="hidden md:grid grid-cols-[auto_1fr_140px_120px_130px] gap-4 items-center">
                      {/* Icon */}
                      <div className={cn(
                        'flex-shrink-0 p-2 rounded-lg border w-10 h-10 flex items-center justify-center',
                        statusStyles.bg,
                        'group-hover:scale-105 transition-transform duration-300'
                      )}>
                        <Package className={cn('w-4 h-4', statusStyles.text)} style={{ filter: `drop-shadow(0 0 3px currentColor)` }} />
                      </div>

                      {/* Name & SKU */}
                      <div className="min-w-0 pl-1">
                        <h4 className="font-medium text-white text-sm truncate group-hover:text-slate-100 transition-colors">{item.name}</h4>
                        {item.sku && <span className="text-[11px] text-slate-500 font-mono">{item.sku}</span>}
                      </div>

                      {/* Category - with left border */}
                      <div className="text-center border-l border-slate-700/30 pl-4">
                        <span className="text-xs text-slate-400 px-2.5 py-1 rounded-md bg-slate-700/30 inline-block">
                          {item.category || '—'}
                        </span>
                      </div>

                      {/* Quantity - with left border */}
                      <div className="text-right border-l border-slate-700/30 pl-4 pr-2">
                        <p className={cn('text-xl font-bold tabular-nums', statusStyles.text)} style={{ textShadow: `0 0 10px currentColor` }}>
                          {item.quantity}
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">units</p>
                      </div>

                      {/* Status Badge - with left border */}
                      <div className="flex justify-center border-l border-slate-700/30 pl-4">
                        <div className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-semibold min-w-[100px] text-center',
                          statusStyles.bg, 
                          statusStyles.text,
                          'shadow-sm'
                        )}>
                          <div className="flex items-center justify-center gap-1.5">
                            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', statusStyles.dot)} />
                            {statusStyles.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Package className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">No items found</p>
                <p className="text-sm text-slate-600 mt-1">Try adjusting your filters</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-2 sm:px-4 py-1.5 sm:py-2 border-t border-slate-700/30 flex-shrink-0">
          <a
            href={`https://www.taskade.com/d/${PROJECT_IDS.INVENTORY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-slate-500 hover:text-purple-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Edit in Taskade Project</span>
            <span className="sm:hidden">Open in Taskade</span>
          </a>
        </div>
      </div>

      {/* Add Item Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <AddItemForm onClose={() => setShowAddForm(false)} onSuccess={() => loadData(true)} />
        )}
      </AnimatePresence>
    </div>
  );
};
