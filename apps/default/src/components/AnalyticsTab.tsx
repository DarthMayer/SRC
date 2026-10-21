import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Package, AlertTriangle, BarChart3, PieChart, Activity } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPie, 
  Pie, 
  Cell,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { inventoryApi, type InventoryItem } from '../services/api';
import { cn } from '../lib/utils';
import { useInventoryStore, useIsCacheValid } from '../store';

const mockTrendData = [
  { name: 'Mon', inStock: 45, lowStock: 12, onOrder: 5, outOfStock: 3 },
  { name: 'Tue', inStock: 42, lowStock: 15, onOrder: 6, outOfStock: 5 },
  { name: 'Wed', inStock: 48, lowStock: 10, onOrder: 4, outOfStock: 2 },
  { name: 'Thu', inStock: 50, lowStock: 8, onOrder: 3, outOfStock: 2 },
  { name: 'Fri', inStock: 47, lowStock: 11, onOrder: 5, outOfStock: 4 },
  { name: 'Sat', inStock: 52, lowStock: 9, onOrder: 4, outOfStock: 1 },
  { name: 'Sun', inStock: 55, lowStock: 7, onOrder: 3, outOfStock: 2 },
];

const COLORS = {
  inStock: { main: '#10b981', glow: 'rgba(16,185,129,0.6)', light: 'rgba(16,185,129,0.15)' },
  lowStock: { main: '#f59e0b', glow: 'rgba(245,158,11,0.6)', light: 'rgba(245,158,11,0.15)' },
  onOrder: { main: '#3b82f6', glow: 'rgba(59,130,246,0.6)', light: 'rgba(59,130,246,0.15)' },
  outOfStock: { main: '#ef4444', glow: 'rgba(239,68,68,0.6)', light: 'rgba(239,68,68,0.15)' },
};

// Enhanced neon tooltip with responsive text
const NeonTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "px-3 sm:px-4 py-2 sm:py-3 rounded-xl",
          "bg-slate-900/95 backdrop-blur-xl",
          "border border-slate-600/50",
          "shadow-[0_0_30px_rgba(6,182,212,0.2),0_10px_40px_rgba(0,0,0,0.5)]"
        )}
      >
        <p 
          className="text-cyan-400 font-semibold mb-2" 
          style={{ 
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            textShadow: '0 0 10px rgba(6,182,212,0.5)' 
          }}
        >
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 sm:gap-3">
              <div 
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" 
                style={{ 
                  backgroundColor: entry.color,
                  boxShadow: `0 0 8px ${entry.color}`
                }}
              />
              <span 
                className="text-slate-400"
                style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)' }}
              >
                {entry.name}
              </span>
              <span 
                className="font-bold ml-auto"
                style={{ 
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  color: 'white',
                  textShadow: `0 0 10px ${entry.color}` 
                }}
              >
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }
  return null;
};

// Enhanced pie tooltip with responsive text
const PieTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "px-3 sm:px-4 py-2 sm:py-3 rounded-xl",
          "bg-slate-900/95 backdrop-blur-xl",
          "border border-slate-600/50",
          "shadow-[0_0_30px_rgba(168,85,247,0.2),0_10px_40px_rgba(0,0,0,0.5)]"
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
            style={{ 
              backgroundColor: data.payload.fill,
              boxShadow: `0 0 10px ${data.payload.fill}`
            }}
          />
          <span 
            className="text-slate-300"
            style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
          >
            {data.name}
          </span>
          <span 
            className="font-bold ml-2"
            style={{ 
              fontSize: 'clamp(0.95rem, 2.5vw, 1.125rem)',
              color: 'white',
              textShadow: `0 0 10px ${data.payload.fill}` 
            }}
          >
            {data.value}
          </span>
        </div>
      </motion.div>
    );
  }
  return null;
};

// Custom legend component - matches pie chart style
const NeonLegend: React.FC<{ items: { name: string; color: string; value: number }[] }> = ({ items }) => {
  const [hoveredLegend, setHoveredLegend] = React.useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-700/30">
      {items.map((item, index) => {
        const isHovered = hoveredLegend === item.name;
        return (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className={cn(
              "flex flex-col items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl cursor-pointer transition-all duration-300",
              isHovered && "bg-slate-800/50"
            )}
            onMouseEnter={() => setHoveredLegend(item.name)}
            onMouseLeave={() => setHoveredLegend(null)}
            whileHover={{ y: -3, scale: 1.05 }}
            style={{
              boxShadow: isHovered ? `0 0 30px ${item.color}50, 0 5px 20px ${item.color}30` : 'none'
            }}
          >
            {/* Glowing dot */}
            <motion.div 
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mb-1.5 sm:mb-2"
              style={{ 
                backgroundColor: item.color,
                boxShadow: `0 0 ${isHovered ? '20px' : '10px'} ${item.color}, 0 0 ${isHovered ? '40px' : '20px'} ${item.color}50`
              }}
              animate={isHovered ? { scale: 1.5 } : { scale: 1 }}
            />
            
            {/* Value - Responsive sizing */}
            <motion.span 
              className="font-bold"
              style={{ 
                fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                color: item.color,
                textShadow: `0 0 ${isHovered ? '25px' : '12px'} ${item.color}`
              }}
              animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
            >
              {item.value}
            </motion.span>
            
            {/* Label - Responsive sizing */}
            <span 
              className={cn(
                "uppercase tracking-wider mt-0.5 sm:mt-1 transition-colors text-center",
                isHovered ? "text-white" : "text-slate-500"
              )}
              style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.625rem)' }}
            >
              {item.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

interface AnalyticsTabProps {
  isActive?: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ isActive = true }) => {
  // Use shared store to avoid refetching
  const { items, isLoading: loading, setItems, setLoading } = useInventoryStore();
  const isCacheValid = useIsCacheValid();
  
  const [hoveredStat, setHoveredStat] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  
  // Track animation state to prevent re-animation flickering
  React.useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 800);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const loadData = async () => {
      // Skip if cache is valid
      if (isCacheValid && items.length > 0) {
        return;
      }
      
      setLoading(true);
      try {
        const data = await inventoryApi.getAll();
        setItems(data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isCacheValid, items.length, setItems, setLoading]);

  const stats = React.useMemo(() => {
    const inStock = items.filter(i => i.status === 'stock-good').length;
    const lowStock = items.filter(i => i.status === 'stock-low').length;
    const onOrder = items.filter(i => i.status === 'stock-ordered').length;
    const outOfStock = items.filter(i => i.status === 'stock-out').length;
    return { inStock, lowStock, onOrder, outOfStock, total: items.length };
  }, [items]);

  const pieData = [
    { name: 'In Stock', value: stats.inStock, fill: COLORS.inStock.main },
    { name: 'Low Stock', value: stats.lowStock, fill: COLORS.lowStock.main },
    { name: 'On Order', value: stats.onOrder, fill: COLORS.onOrder.main },
    { name: 'Out of Stock', value: stats.outOfStock, fill: COLORS.outOfStock.main },
  ];

  const legendItems = [
    { name: 'In Stock', color: COLORS.inStock.main, value: mockTrendData[mockTrendData.length - 1].inStock },
    { name: 'Low Stock', color: COLORS.lowStock.main, value: mockTrendData[mockTrendData.length - 1].lowStock },
    { name: 'On Order', color: COLORS.onOrder.main, value: mockTrendData[mockTrendData.length - 1].onOrder },
    { name: 'Out of Stock', color: COLORS.outOfStock.main, value: mockTrendData[mockTrendData.length - 1].outOfStock },
  ];

  // Only show loading spinner on initial load when no cached data exists
  const showLoadingSpinner = loading && items.length === 0;
  
  if (showLoadingSpinner) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <motion.div
            className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}
          />
          <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-auto h-full max-w-[1400px] mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        {[
          { label: 'Total Items', value: stats.total, icon: Package, color: 'blue', key: 'total', glowColor: 'rgba(6,182,212,0.2)' },
          { label: 'In Stock', value: stats.inStock, icon: TrendingUp, color: 'mint', key: 'inStock', glowColor: 'rgba(16,185,129,0.2)' },
          { label: 'Low Stock', value: stats.lowStock, icon: TrendingDown, color: 'amber', key: 'lowStock', glowColor: 'rgba(245,158,11,0.2)' },
          { label: 'On Order', value: stats.onOrder, icon: BarChart3, color: 'indigo', key: 'onOrder', glowColor: 'rgba(59,130,246,0.2)' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: AlertTriangle, color: 'rose', key: 'outOfStock', glowColor: 'rgba(239,68,68,0.2)' },
        ].map((stat, index) => {
          const isHovered = hoveredStat === stat.key;
          return (
            <motion.div
              key={stat.label}
              initial={hasAnimated ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={hasAnimated ? {} : { delay: index * 0.1 }}
              onHoverStart={() => setHoveredStat(stat.key)}
              onHoverEnd={() => setHoveredStat(null)}
              className={cn(
                'p-3 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer',
                'bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-xl',
                'border border-slate-600/30',
                'transition-all duration-300'
              )}
              style={{
                boxShadow: isHovered 
                  ? `0 0 30px ${stat.glowColor}, 0 10px 40px rgba(0,0,0,0.3)` 
                  : `0 0 15px ${stat.glowColor.replace('0.2', '0.1')}`
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div 
                  className={cn(
                    'p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border',
                    stat.color === 'blue' && 'bg-cyan-500/10 border-cyan-500/30',
                    stat.color === 'mint' && 'bg-emerald-500/10 border-emerald-500/30',
                    stat.color === 'amber' && 'bg-amber-500/10 border-amber-500/30',
                    stat.color === 'indigo' && 'bg-blue-500/10 border-blue-500/30',
                    stat.color === 'rose' && 'bg-rose-500/10 border-rose-500/30',
                  )}
                >
                  <stat.icon 
                    className={cn(
                      'w-4 h-4 sm:w-5 sm:h-5',
                      stat.color === 'blue' && 'text-cyan-400',
                      stat.color === 'mint' && 'text-emerald-400',
                      stat.color === 'amber' && 'text-amber-400',
                      stat.color === 'indigo' && 'text-blue-400',
                      stat.color === 'rose' && 'text-rose-400',
                    )} 
                    style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                  />
                </div>
              </div>
              <p 
                className={cn(
                  "text-xl sm:text-3xl font-bold",
                  stat.color === 'blue' && 'text-cyan-400',
                  stat.color === 'mint' && 'text-emerald-400',
                  stat.color === 'amber' && 'text-amber-400',
                  stat.color === 'indigo' && 'text-blue-400',
                  stat.color === 'rose' && 'text-rose-400',
                )}
                style={{ textShadow: '0 0 15px currentColor' }}
              >
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
        {/* Area Chart */}
        <motion.div
          initial={hasAnimated ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={hasAnimated ? {} : { delay: 0.4 }}
          className={cn(
            'lg:col-span-2 p-4 sm:p-6 rounded-xl sm:rounded-2xl min-h-[350px] sm:min-h-[480px] flex flex-col',
            'bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-xl',
            'border border-slate-600/30',
            'shadow-[0_0_30px_rgba(6,182,212,0.08)]'
          )}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Activity className="w-4 h-4 text-cyan-400" style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
              </div>
              <h3 className="font-semibold text-white">Weekly Inventory Trends</h3>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-400 text-xs font-medium">+12% this week</span>
            </div>
          </div>
          
          <div className="h-48 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  {/* Neon gradients */}
                  <linearGradient id="neonInStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.inStock.main} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={COLORS.inStock.main} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={COLORS.inStock.main} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="neonLowStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.lowStock.main} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={COLORS.lowStock.main} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={COLORS.lowStock.main} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="neonOnOrder" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.onOrder.main} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={COLORS.onOrder.main} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={COLORS.onOrder.main} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="neonOutStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.outOfStock.main} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={COLORS.outOfStock.main} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={COLORS.outOfStock.main} stopOpacity={0}/>
                  </linearGradient>
                  {/* Glow filters */}
                  <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="glowAmber" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Grid */}
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(148,163,184,0.1)" 
                  vertical={false}
                />
                
                {/* Reference line for average */}
                <ReferenceLine 
                  y={45} 
                  stroke="rgba(6,182,212,0.3)" 
                  strokeDasharray="5 5"
                  label={{ value: 'Avg', fill: 'rgba(6,182,212,0.5)', fontSize: 10 }}
                />
                
                <XAxis 
                  dataKey="name" 
                  stroke="#475569"
                  style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.6875rem)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(71,85,105,0.3)' }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#475569"
                  style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.6875rem)' }}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b' }}
                  width={35}
                />
                
                <Tooltip 
                  content={<NeonTooltip />}
                  cursor={{ 
                    stroke: 'rgba(6,182,212,0.3)', 
                    strokeWidth: 1,
                    strokeDasharray: '5 5'
                  }}
                />
                
                {/* Areas with neon glow effect */}
                <Area 
                  type="monotone" 
                  dataKey="inStock" 
                  name="In Stock"
                  stroke={COLORS.inStock.main}
                  fill="url(#neonInStock)"
                  strokeWidth={2.5}
                  filter="url(#glowGreen)"
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: COLORS.inStock.main,
                    stroke: '#0f172a',
                    strokeWidth: 2,
                    filter: 'url(#glowGreen)'
                  }}
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="lowStock" 
                  name="Low Stock"
                  stroke={COLORS.lowStock.main}
                  fill="url(#neonLowStock)"
                  strokeWidth={2.5}
                  filter="url(#glowAmber)"
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: COLORS.lowStock.main,
                    stroke: '#0f172a',
                    strokeWidth: 2,
                    filter: 'url(#glowAmber)'
                  }}
                  animationDuration={1500}
                  animationBegin={200}
                />
                <Area 
                  type="monotone" 
                  dataKey="onOrder" 
                  name="On Order"
                  stroke={COLORS.onOrder.main}
                  fill="url(#neonOnOrder)"
                  strokeWidth={2.5}
                  filter="url(#glowBlue)"
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: COLORS.onOrder.main,
                    stroke: '#0f172a',
                    strokeWidth: 2,
                    filter: 'url(#glowBlue)'
                  }}
                  animationDuration={1500}
                  animationBegin={300}
                />
                <Area 
                  type="monotone" 
                  dataKey="outOfStock" 
                  name="Out of Stock"
                  stroke={COLORS.outOfStock.main}
                  fill="url(#neonOutStock)"
                  strokeWidth={2.5}
                  filter="url(#glowRed)"
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: COLORS.outOfStock.main,
                    stroke: '#0f172a',
                    strokeWidth: 2,
                    filter: 'url(#glowRed)'
                  }}
                  animationDuration={1500}
                  animationBegin={400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Custom Legend at bottom */}
          <NeonLegend items={legendItems} />
        </motion.div>

        {/* Pie Chart - Large Neon Style */}
        <motion.div
          initial={hasAnimated ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={hasAnimated ? {} : { delay: 0.5 }}
          className={cn(
            'p-4 sm:p-6 pb-6 sm:pb-8 rounded-xl sm:rounded-2xl flex flex-col',
            'bg-gradient-to-br from-slate-950/90 to-slate-900/80 backdrop-blur-xl',
            'border border-cyan-500/20',
            'shadow-[0_0_60px_rgba(6,182,212,0.15),inset_0_0_60px_rgba(6,182,212,0.03)]'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <PieChart className="w-4 h-4 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
            </div>
            <h3 className="font-semibold text-white">Stock Distribution</h3>
          </div>
          
          {/* Chart Container - Centered with aspect ratio */}
          <div className="flex items-center justify-center py-4 h-[280px] sm:h-[320px]">
            <div className="relative w-full max-w-[280px] sm:max-w-[300px] aspect-square">
              {/* Animated outer glow ring */}
              <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(16,185,129,0.5), rgba(245,158,11,0.5), rgba(239,68,68,0.5), rgba(16,185,129,0.5))',
                  filter: 'blur(25px)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Inner ring glow */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
                }}
              />
            
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-center">
                  <motion.p 
                    className="text-4xl sm:text-5xl font-bold text-white"
                    style={{ 
                      textShadow: '0 0 40px rgba(6,182,212,0.8), 0 0 80px rgba(6,182,212,0.4)' 
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                  >
                    {stats.total}
                  </motion.p>
                  <p 
                    className="text-xs sm:text-sm text-cyan-400/80 mt-1 tracking-widest" 
                    style={{ 
                      textShadow: '0 0 10px rgba(6,182,212,0.5)' 
                    }}
                  >
                    ITEMS
                  </p>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <defs>
                  {/* Enhanced neon glow filters */}
                  <filter id="neonGlowGreen" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                    <feFlood floodColor="#10b981" floodOpacity="0.5" result="glowColor"/>
                    <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow"/>
                    <feMerge>
                      <feMergeNode in="softGlow"/>
                      <feMergeNode in="softGlow"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="neonGlowAmber" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                    <feFlood floodColor="#f59e0b" floodOpacity="0.5" result="glowColor"/>
                    <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow"/>
                    <feMerge>
                      <feMergeNode in="softGlow"/>
                      <feMergeNode in="softGlow"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="neonGlowRed" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                    <feFlood floodColor="#ef4444" floodOpacity="0.5" result="glowColor"/>
                    <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow"/>
                    <feMerge>
                      <feMergeNode in="softGlow"/>
                      <feMergeNode in="softGlow"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Main donut chart - No labels */}
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="65%"
                  paddingAngle={4}
                  dataKey="value"
                  activeIndex={activeIndex}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  animationBegin={0}
                  animationDuration={1500}
                  cursor="pointer"
                  cornerRadius={6}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={2}
                  label={false}
                  labelLine={false}
                  isAnimationActive={true}
                >
                  {pieData.map((entry, index) => {
                    const isActive = activeIndex === index;
                    const filters = ['url(#neonGlowGreen)', 'url(#neonGlowAmber)', 'url(#neonGlowRed)'];
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.fill}
                        filter={isActive ? filters[index] : undefined}
                        style={{
                          transition: 'all 0.3s ease',
                          opacity: activeIndex !== undefined && !isActive ? 0.3 : 1
                        }}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
            </div>
          </div>
          
          {/* Bottom Legend - Grid Layout to Prevent Overlap */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 pt-4 sm:pt-5 pb-2 border-t border-slate-700/30">
            {pieData.map((entry, index) => {
              const isActive = activeIndex === index;
              const percentage = stats.total > 0 ? ((entry.value / stats.total) * 100).toFixed(0) : 0;
              return (
                <motion.div
                  key={entry.name}
                  className={cn(
                    "flex flex-col items-center px-2 sm:px-3 py-2 sm:py-3 rounded-xl cursor-pointer transition-all duration-300",
                    isActive && "bg-slate-800/50"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  whileHover={{ y: -3, scale: 1.05 }}
                  style={{
                    boxShadow: isActive ? `0 0 30px ${entry.fill}50, 0 5px 20px ${entry.fill}30` : 'none'
                  }}
                >
                  {/* Glowing dot */}
                  <motion.div 
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mb-1.5 sm:mb-2"
                    style={{ 
                      backgroundColor: entry.fill,
                      boxShadow: `0 0 ${isActive ? '20px' : '10px'} ${entry.fill}, 0 0 ${isActive ? '40px' : '20px'} ${entry.fill}50`
                    }}
                    animate={isActive ? { scale: 1.5 } : { scale: 1 }}
                  />
                  
                  {/* Value - Responsive sizing */}
                  <motion.span 
                    className="font-bold"
                    style={{ 
                      fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
                      color: entry.fill,
                      textShadow: `0 0 ${isActive ? '25px' : '12px'} ${entry.fill}`
                    }}
                    animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  >
                    {entry.value}
                  </motion.span>
                  
                  {/* Label - More space, clearer text */}
                  <span 
                    className={cn(
                      "uppercase tracking-wide mt-1 transition-colors text-center leading-tight",
                      isActive ? "text-white" : "text-slate-500"
                    )}
                    style={{ 
                      fontSize: 'clamp(0.5rem, 1.2vw, 0.5625rem)',
                      maxWidth: '100%',
                      wordBreak: 'break-word'
                    }}
                  >
                    {entry.name}
                  </span>
                  
                  {/* Percentage */}
                  <span 
                    className="font-medium mt-1"
                    style={{ 
                      fontSize: 'clamp(0.65rem, 1.6vw, 0.6875rem)',
                      color: isActive ? entry.fill : 'rgb(100,116,139)',
                      textShadow: isActive ? `0 0 8px ${entry.fill}` : 'none'
                    }}
                  >
                    {percentage}%
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Two Column Charts Grid - Same Size Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-fr">
        {/* Equipment Categories Chart */}
        <motion.div
          initial={hasAnimated ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={hasAnimated ? {} : { delay: 0.6 }}
          className={cn(
            'p-4 sm:p-8 rounded-xl sm:rounded-2xl min-h-[280px] sm:min-h-[380px] flex flex-col',
            'bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-xl',
            'border border-slate-600/30',
            'shadow-[0_0_30px_rgba(6,182,212,0.08)]'
          )}
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
            </div>
            <h3 className="font-semibold text-white text-lg">Equipment Categories</h3>
          </div>
          <div className="space-y-5 flex-1">
            {Array.from(new Set(items.map(i => i.category).filter(Boolean))).map((category, index) => {
              const categoryItems = items.filter(i => i.category === category);
              const percentage = items.length > 0 ? (categoryItems.length / items.length) * 100 : 0;
              const isHovered = hoveredStat === category;
              const colors = [
                { from: '#8b5cf6', to: '#6366f1', glow: 'rgba(139,92,246,0.5)' },
                { from: '#06b6d4', to: '#3b82f6', glow: 'rgba(6,182,212,0.5)' },
                { from: '#10b981', to: '#14b8a6', glow: 'rgba(16,185,129,0.5)' },
                { from: '#f59e0b', to: '#f97316', glow: 'rgba(245,158,11,0.5)' },
                { from: '#ec4899', to: '#ef4444', glow: 'rgba(236,72,153,0.5)' },
              ];
              const color = colors[index % colors.length];
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  onHoverStart={() => setHoveredStat(category)}
                  onHoverEnd={() => setHoveredStat(null)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                        {categoryItems.length} items
                      </span>
                      <motion.span 
                        className="text-sm font-bold min-w-[40px] text-right"
                        style={{ 
                          color: isHovered ? color.from : '#64748b',
                          textShadow: isHovered ? `0 0 15px ${color.glow}` : 'none'
                        }}
                        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                      >
                        {percentage.toFixed(0)}%
                      </motion.span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.2, delay: 0.8 + index * 0.1, ease: "easeOut" }}
                      style={{
                        background: `linear-gradient(to right, ${color.from}, ${color.to})`,
                        boxShadow: isHovered 
                          ? `0 0 25px ${color.glow}, 0 0 50px ${color.glow}40` 
                          : `0 0 12px ${color.glow}40`
                      }}
                    />
                    {isHovered && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          background: `linear-gradient(to right, ${color.from}, ${color.to})`,
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Maintenance Frequency Chart */}
        <motion.div
          initial={hasAnimated ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={hasAnimated ? {} : { delay: 0.7 }}
          className={cn(
            'p-4 sm:p-8 rounded-xl sm:rounded-2xl min-h-[280px] sm:min-h-[380px] flex flex-col',
            'bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-xl',
            'border border-slate-600/30',
            'shadow-[0_0_30px_rgba(6,182,212,0.08)]'
          )}
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
            </div>
            <h3 className="font-semibold text-white text-lg">Maintenance Frequency</h3>
          </div>
          <div className="space-y-5 flex-1">
            {Array.from(new Set(items.map(i => i.frequency).filter(Boolean))).map((frequency, index) => {
              const frequencyItems = items.filter(i => i.frequency === frequency);
              const percentage = items.length > 0 ? (frequencyItems.length / items.length) * 100 : 0;
              const isHovered = hoveredStat === `freq-${frequency}`;
              const colors = [
                { from: '#10b981', to: '#14b8a6', glow: 'rgba(16,185,129,0.5)' },
                { from: '#06b6d4', to: '#3b82f6', glow: 'rgba(6,182,212,0.5)' },
                { from: '#f59e0b', to: '#f97316', glow: 'rgba(245,158,11,0.5)' },
                { from: '#ef4444', to: '#dc2626', glow: 'rgba(239,68,68,0.5)' },
              ];
              const color = colors[index % colors.length];
              
              return (
                <motion.div
                  key={frequency}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  onHoverStart={() => setHoveredStat(`freq-${frequency}`)}
                  onHoverEnd={() => setHoveredStat(null)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors capitalize">{frequency}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                        {frequencyItems.length} items
                      </span>
                      <motion.span 
                        className="text-sm font-bold min-w-[40px] text-right"
                        style={{ 
                          color: isHovered ? color.from : '#64748b',
                          textShadow: isHovered ? `0 0 15px ${color.glow}` : 'none'
                        }}
                        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                      >
                        {percentage.toFixed(0)}%
                      </motion.span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.2, delay: 0.9 + index * 0.1, ease: "easeOut" }}
                    style={{
                      background: `linear-gradient(to right, ${color.from}, ${color.to})`,
                      boxShadow: isHovered 
                        ? `0 0 25px ${color.glow}, 0 0 50px ${color.glow}40` 
                        : `0 0 12px ${color.glow}40`
                    }}
                  />
                    {isHovered && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          background: `linear-gradient(to right, ${color.from}, ${color.to})`,
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
