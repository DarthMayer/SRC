import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, TrendingDown, TrendingUp, AlertTriangle, Box, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryApi, type InventoryItem } from '../services/inventoryApi';
import { AnimatedLogo } from './AnimatedLogo';
import { ParticleEffect } from './ParticleEffect';
import { AddItemForm } from './AddItemForm';
import { cn } from '../lib/utils';

type StatusFilter = 'all' | 'stock-good' | 'stock-low' | 'stock-out';

export const Dashboard: React.FC = () => {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  React.useEffect(() => {
    loadData();
  }, [loadData]);
  
  const filteredItems = React.useMemo(() => {
    if (statusFilter === 'all') return items;
    return items.filter(item => item.fieldValues['/attributes/@inv04'] === statusFilter);
  }, [items, statusFilter]);
  
  const stats = React.useMemo(() => {
    const inStock = items.filter(i => i.fieldValues['/attributes/@inv04'] === 'stock-good').length;
    const lowStock = items.filter(i => i.fieldValues['/attributes/@inv04'] === 'stock-low').length;
    const outOfStock = items.filter(i => i.fieldValues['/attributes/@inv04'] === 'stock-out').length;
    
    return { total: items.length, inStock, lowStock, outOfStock };
  }, [items]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      <ParticleEffect />
      
      {/* Header with neon glow */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-blue-500/5" />
        <div className="max-w-[1400px] mx-auto px-6 py-5 relative">
          <div className="flex items-center justify-between">
            <AnimatedLogo />
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddForm(true)}
              className={cn(
                'px-5 py-2.5 rounded-lg relative overflow-hidden',
                'bg-gradient-to-r from-blue-600 to-indigo-600',
                'hover:from-blue-500 hover:to-indigo-500',
                'text-white font-medium text-sm',
                'transition-all duration-200',
                'flex items-center gap-2',
                'shadow-lg shadow-blue-500/30'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              <Plus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Add Item</span>
            </motion.button>
          </div>
        </div>
      </div>

      
      {/* Bento Grid Layout */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-140px)]">
          
          {/* Area 1: Stats Overview with neon glows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 relative">Overview</h2>
            
            <div className="grid grid-cols-2 gap-4 relative">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm relative group transition-all duration-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex items-center gap-3 mb-3 relative">
                  <div className="p-2 rounded-lg bg-blue-500/10 shadow-lg shadow-blue-500/20">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Items</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white relative">{stats.total}</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm relative group transition-all duration-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex items-center gap-3 mb-3 relative">
                  <div className="p-2 rounded-lg bg-emerald-500/10 shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">In Stock</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white relative">{stats.inStock}</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm relative group transition-all duration-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex items-center gap-3 mb-3 relative">
                  <div className="p-2 rounded-lg bg-amber-500/10 shadow-lg shadow-amber-500/20">
                    <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Low Stock</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white relative">{stats.lowStock}</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm relative group transition-all duration-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex items-center gap-3 mb-3 relative">
                  <div className="p-2 rounded-lg bg-red-500/10 shadow-lg shadow-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Out of Stock</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white relative">{stats.outOfStock}</p>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Area 2: Quick Filters with neon effects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 relative">Filters</h2>
            
            <div className="space-y-2 relative">
              {(['all', 'stock-good', 'stock-low', 'stock-out'] as const).map((filter) => {
                const isActive = statusFilter === filter;
                const labels = {
                  all: 'All Items',
                  'stock-good': 'In Stock',
                  'stock-low': 'Low Stock',
                  'stock-out': 'Out of Stock',
                };
                
                return (
                  <motion.button
                    key={filter}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setStatusFilter(filter)}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg text-sm font-medium text-left',
                      'transition-all duration-200 relative',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-slate-50/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-lg" />
                    )}
                    <span className="relative">{labels[filter]}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
          
          {/* Area 3: Inventory List with neon glows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden flex flex-col relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 relative">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inventory Items</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 relative">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Box className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm">No items found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item, index) => {
                    const hasLowQuantity = (item.fieldValues['/attributes/@inv02'] || 0) < (item.fieldValues['/attributes/@inv03'] || 0);
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)" }}
                        onClick={() => setSelectedItem(item)}
                        className={cn(
                          'p-4 rounded-lg border cursor-pointer relative group',
                          'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50',
                          'hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:border-blue-300/50 dark:hover:border-blue-600/50',
                          'transition-all duration-200 backdrop-blur-sm'
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                        <div className="flex items-center justify-between relative">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900 dark:text-white">{item.fieldValues['/text']}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {item.fieldValues['/attributes/@inv01'] || 'No category'} • SKU: {item.fieldValues['/attributes/@inv05'] || 'N/A'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={cn(
                                "text-sm font-medium",
                                hasLowQuantity ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"
                              )}>
                                {item.fieldValues['/attributes/@inv02'] || 0} units
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                Reorder at {item.fieldValues['/attributes/@inv03'] || 0}
                              </p>
                            </div>
                            
                            <div className={cn(
                              'px-3 py-1 rounded-full text-xs font-medium shadow-lg',
                              item.fieldValues['/attributes/@inv04'] === 'stock-good' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-emerald-500/20',
                              item.fieldValues['/attributes/@inv04'] === 'stock-low' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-amber-500/20',
                              item.fieldValues['/attributes/@inv04'] === 'stock-out' && 'bg-red-500/10 text-red-700 dark:text-red-400 shadow-red-500/20'
                            )}>
                              {item.fieldValues['/attributes/@inv04'] === 'stock-good' && 'In Stock'}
                              {item.fieldValues['/attributes/@inv04'] === 'stock-low' && 'Low Stock'}
                              {item.fieldValues['/attributes/@inv04'] === 'stock-out' && 'Out of Stock'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Area 4: Recent Activity with neon effects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden flex flex-col relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-pink-500/5 pointer-events-none" />
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 relative">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 relative">
              <div className="space-y-4">
                {items.slice(0, 5).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="pb-4 border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 shadow-lg shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-shadow">
                        <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {item.fieldValues['/text']}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {item.fieldValues['/attributes/@inv02'] || 0} units • {item.fieldValues['/attributes/@inv01'] || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>

      {/* Add Item Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <AddItemForm
            onClose={() => setShowAddForm(false)}
            onSuccess={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
