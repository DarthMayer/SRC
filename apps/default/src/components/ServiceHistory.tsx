import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, DollarSign, Filter, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMaintenanceStore } from '../store';
import type { ServiceType } from '../types';
import { cn } from '../lib/utils';

export const ServiceHistory: React.FC = () => {
  const { serviceRecords } = useMaintenanceStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<ServiceType | 'all'>('all');
  const [hasError, setHasError] = React.useState(false);
  
  // Debug logging
  React.useEffect(() => {
    console.log('ServiceHistory - Service Records:', serviceRecords);
    console.log('ServiceHistory - Component mounted');
  }, [serviceRecords]);
  
  // Error boundary effect
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('ServiceHistory Error:', error);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center bg-white/5 border border-white/10">
        <p className="text-rose-400 text-base sm:text-lg mb-2">Something went wrong</p>
        <p className="text-white/40 text-xs sm:text-sm">Please refresh the page or contact support</p>
        <button
          onClick={() => setHasError(false)}
          className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  const filteredRecords = React.useMemo(() => {
    try {
      if (!serviceRecords || serviceRecords.length === 0) {
        return [];
      }
      
      let filtered = [...serviceRecords];
      
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(record => {
          try {
            const assetName = record.fieldValues['/attributes/@srv01'] || '';
            const technician = record.fieldValues['/attributes/@srv03'] || '';
            const text = record.fieldValues['/text'] || '';
            
            return (
              text.toLowerCase().includes(lowerSearch) ||
              assetName.toLowerCase().includes(lowerSearch) ||
              technician.toLowerCase().includes(lowerSearch)
            );
          } catch (e) {
            console.error('Error filtering record:', e);
            return false;
          }
        });
      }
      
      if (typeFilter !== 'all') {
        filtered = filtered.filter(record => {
          const serviceType = record.fieldValues['/attributes/@srv04'];
          // Handle both string and Select object formats
          const typeValue = typeof serviceType === 'object' && serviceType?.type === 'Select' 
            ? serviceType.optionId 
            : serviceType;
          return typeValue === typeFilter;
        });
      }
      
      return filtered.sort((a, b) => {
        try {
          const dateA = a.fieldValues['/attributes/@srv02'];
          const dateB = b.fieldValues['/attributes/@srv02'];
          
          // Handle DateTime object format
          const dateStrA = typeof dateA === 'object' && dateA?.type === 'DateTime'
            ? dateA.dateTime.date
            : dateA;
          const dateStrB = typeof dateB === 'object' && dateB?.type === 'DateTime'
            ? dateB.dateTime.date
            : dateB;
          
          return new Date(dateStrB).getTime() - new Date(dateStrA).getTime();
        } catch (e) {
          console.error('Error sorting records:', e);
          return 0;
        }
      });
    } catch (error) {
      console.error('Error in filteredRecords:', error);
      return [];
    }
  }, [serviceRecords, searchTerm, typeFilter]);
  
  const stats = React.useMemo(() => {
    try {
      if (!serviceRecords || serviceRecords.length === 0) {
        return { totalCost: 0, preventive: 0, repairs: 0, inspections: 0 };
      }
      
      const totalCost = serviceRecords.reduce((sum, record) => {
        try {
          return sum + (record.fieldValues['/attributes/@srv05'] || 0);
        } catch (e) {
          return sum;
        }
      }, 0);
      
      const preventive = serviceRecords.filter(r => 
        r.fieldValues['/attributes/@srv04'] === 'opt-preventive'
      ).length;
      
      const repairs = serviceRecords.filter(r => 
        r.fieldValues['/attributes/@srv04'] === 'opt-repair'
      ).length;
      
      const inspections = serviceRecords.filter(r => 
        r.fieldValues['/attributes/@srv04'] === 'opt-inspection'
      ).length;
      
      return { totalCost, preventive, repairs, inspections };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { totalCost: 0, preventive: 0, repairs: 0, inspections: 0 };
    }
  }, [serviceRecords]);
  
  const formatDate = (dateValue: any) => {
    try {
      // Handle DateTime object format
      if (typeof dateValue === 'object' && dateValue?.type === 'DateTime') {
        return format(parseISO(dateValue.dateTime.date), 'MMM dd, yyyy');
      }
      // Handle string format
      return format(parseISO(dateValue), 'MMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e, dateValue);
      return 'Invalid date';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const getServiceTypeConfig = (type: ServiceType) => {
    const configs = {
      'opt-preventive': {
        label: 'Preventive',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      },
      'opt-repair': {
        label: 'Repair',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      },
      'opt-inspection': {
        label: 'Inspection',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      },
    };
    return configs[type];
  };
  
  // Safety check
  if (!serviceRecords) {
    console.log('ServiceHistory - No service records available');
    return (
      <div className="p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center bg-white/5 border border-white/10">
        <p className="text-white/40 text-base sm:text-lg">Loading service history...</p>
      </div>
    );
  }
  
  console.log('ServiceHistory - Rendering with', serviceRecords.length, 'records');
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 sm:p-6 rounded-xl sm:rounded-2xl',
            'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5',
            'border border-emerald-500/20',
            'shadow-lg shadow-black/40'
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500/20">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(stats.totalCost)}</p>
              <p className="text-xs sm:text-sm text-white/60">Total Spent</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'p-4 sm:p-6 rounded-xl sm:rounded-2xl',
            'bg-white/5 backdrop-blur-lg',
            'border border-white/10',
            'shadow-lg shadow-black/40'
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500/10">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.preventive}</p>
              <p className="text-xs sm:text-sm text-white/60">Preventive</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'p-4 sm:p-6 rounded-xl sm:rounded-2xl',
            'bg-white/5 backdrop-blur-lg',
            'border border-white/10',
            'shadow-lg shadow-black/40'
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/10">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.repairs}</p>
              <p className="text-xs sm:text-sm text-white/60">Repairs</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'p-4 sm:p-6 rounded-xl sm:rounded-2xl',
            'bg-white/5 backdrop-blur-lg',
            'border border-white/10',
            'shadow-lg shadow-black/40'
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-purple-500/10">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.inspections}</p>
              <p className="text-xs sm:text-sm text-white/60">Inspections</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by asset, technician, or notes..."
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl',
              'bg-white/5 border border-white/10',
              'text-white placeholder:text-white/40',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
              'transition-all'
            )}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {(['all', 'opt-preventive', 'opt-repair', 'opt-inspection'] as const).map((filter) => {
            const isActive = typeFilter === filter;
            const labels = {
              all: 'All Types',
              'opt-preventive': 'Preventive',
              'opt-repair': 'Repair',
              'opt-inspection': 'Inspection',
            };
            
            return (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTypeFilter(filter)}
                className={cn(
                  'px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap',
                  'transition-all min-h-[44px]',
                  isActive
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white'
                )}
              >
                {labels[filter]}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Service Records Timeline */}
      {filteredRecords.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center',
            'bg-white/5 border border-white/10'
          )}
        >
          <p className="text-white/40 text-base sm:text-lg">No service records found</p>
          <p className="text-white/30 text-xs sm:text-sm mt-2">
            {searchTerm || typeFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Service records will appear here'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredRecords.map((record, index) => {
            const serviceTypeValue = record.fieldValues['/attributes/@srv04'];
            // Handle both string and Select object formats
            const serviceType = typeof serviceTypeValue === 'object' && serviceTypeValue?.type === 'Select'
              ? serviceTypeValue.optionId
              : serviceTypeValue;
            const config = getServiceTypeConfig(serviceType as ServiceType);
            
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'relative p-4 sm:p-6 rounded-xl sm:rounded-2xl',
                  'bg-white/10 backdrop-blur-xl',
                  'border-2 border-white/20',
                  'hover:bg-white/15 hover:border-emerald-400/40',
                  'shadow-xl shadow-black/60 hover:shadow-2xl hover:shadow-emerald-500/20',
                  'transition-all duration-300',
                  'group'
                )}
              >
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                          {record.fieldValues['/text']}
                        </h3>
                        <p className="text-white/60 text-xs sm:text-sm">
                          {record.fieldValues['/attributes/@srv01']}
                        </p>
                      </div>
                      <span className={cn(
                        'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border whitespace-nowrap',
                        config.color
                      )}>
                        {config.label}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>{formatDate(record.fieldValues['/attributes/@srv02'])}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-400" />
                        <span>{record.fieldValues['/attributes/@srv03']}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    'px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl',
                    'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5',
                    'border border-emerald-500/20'
                  )}>
                    <p className="text-xs text-emerald-400/80 mb-1">Cost</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {formatCurrency(record.fieldValues['/attributes/@srv05'])}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
