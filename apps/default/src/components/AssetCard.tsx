import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Wrench, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import type { Asset } from '../types';
import { cn } from '../lib/utils';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewType?: 'grid' | 'list';
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onEdit, onDelete, viewType = 'grid' }) => {
  const { fieldValues } = asset;
  
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-white/10 dark:bg-black/20 backdrop-blur-xl',
        'border border-white/20 hover:border-emerald-400/60',
        'shadow-xl shadow-black/60 hover:shadow-2xl hover:shadow-emerald-500/30',
        'transition-all duration-300 cursor-pointer'
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
      </div>
      
      <div className={cn(
        'relative p-4 sm:p-6',
        viewType === 'grid' ? 'space-y-3 sm:space-y-4' : 'flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6'
      )}>
        {viewType === 'grid' ? (
          <>
            {/* Grid View Layout */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-100 leading-tight transition-colors duration-300">
                {fieldValues['/text']}
              </h3>
              <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors duration-300">
                {fieldValues['/attributes/@ast01']}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/80 group-hover:text-white/95 transition-colors duration-300">
                <MapPin className="w-4 h-4 text-teal-400 group-hover:text-teal-300 flex-shrink-0 transition-colors duration-300" />
                <span className="truncate">{fieldValues['/attributes/@ast02']}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-white/80 group-hover:text-white/95 transition-colors duration-300">
                <Wrench className="w-4 h-4 text-sage-400 group-hover:text-sage-300 flex-shrink-0 transition-colors duration-300" />
                <span className="truncate">{fieldValues['/attributes/@ast03']}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 flex-shrink-0 mt-0.5 transition-colors duration-300" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-white/70 group-hover:text-white/90 transition-colors duration-300">
                  <span>Last:</span>
                  <span className="font-medium">{formatDate(fieldValues['/attributes/@ast04'])}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 group-hover:text-white/90 transition-colors duration-300">Next:</span>
                  <span className="font-semibold text-white group-hover:text-emerald-200 transition-colors duration-300">
                    {formatDate(fieldValues['/attributes/@ast05'])}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* List View Layout */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-start sm:items-center w-full">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-100 transition-colors duration-300">
                  {fieldValues['/text']}
                </h3>
                <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors duration-300">
                  {fieldValues['/attributes/@ast01']}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-white/80 group-hover:text-white/95 transition-colors duration-300">
                <MapPin className="w-4 h-4 text-teal-400 group-hover:text-teal-300 flex-shrink-0 transition-colors duration-300" />
                <span className="truncate">{fieldValues['/attributes/@ast02']}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-white/80 group-hover:text-white/95 transition-colors duration-300">
                <Wrench className="w-4 h-4 text-sage-400 group-hover:text-sage-300 flex-shrink-0 transition-colors duration-300" />
                <span className="truncate">{fieldValues['/attributes/@ast03']}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 flex-shrink-0 transition-colors duration-300" />
                <div className="flex flex-col">
                  <span className="text-white/70 group-hover:text-white/90 text-xs transition-colors duration-300">Next:</span>
                  <span className="font-semibold text-white group-hover:text-emerald-200 transition-colors duration-300">
                    {formatDate(fieldValues['/attributes/@ast05'])}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusBadge status={fieldValues['/attributes/@ast06']} />
            </div>
          </>
        )}
        
        {/* Footer - Actions */}
        <div className={cn(
          'flex items-center justify-between',
          viewType === 'grid' && 'pt-3 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300'
        )}>
          {viewType === 'grid' && (
            <div className="flex items-center gap-2">
              <StatusBadge status={fieldValues['/attributes/@ast06']} />
              <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors duration-300">
                {fieldValues['/attributes/@ast07']}d
              </span>
            </div>
          )}
          
          <div className={cn(
            'flex items-center gap-1.5',
            viewType === 'list' && 'ml-auto'
          )}>
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className={cn(
                  'p-3 sm:p-2.5 rounded-lg',
                  'bg-white/10 hover:bg-emerald-500/20',
                  'border border-white/20 hover:border-emerald-400/60',
                  'text-white/80 hover:text-emerald-200',
                  'shadow-lg hover:shadow-emerald-500/30',
                  'transition-all duration-300',
                  'min-h-[44px] min-w-[44px] flex items-center justify-center' // Touch-friendly
                )}
                title="Edit asset"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.15, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={cn(
                  'p-3 sm:p-2.5 rounded-lg',
                  'bg-rose-500/15 hover:bg-rose-500/30',
                  'border border-rose-500/30 hover:border-rose-400/60',
                  'text-rose-400 hover:text-rose-200',
                  'shadow-lg hover:shadow-rose-500/40',
                  'transition-all duration-300',
                  'min-h-[44px] min-w-[44px] flex items-center justify-center' // Touch-friendly
                )}
                title="Delete asset"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
