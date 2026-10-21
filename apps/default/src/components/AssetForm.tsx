import * as React from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { assetApi, scheduleApi } from '../services/api';
import { cn } from '../lib/utils';
import type { Asset } from '../types';

const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  model: z.string().min(1, 'Model/Serial is required'),
  lastService: z.string().min(1, 'Last service date is required'),
  nextService: z.string().min(1, 'Next service date is required'),
  status: z.enum(['opt-due', 'opt-upcoming', 'opt-completed']),
  serviceInterval: z.number().min(1, 'Service interval must be at least 1 day'),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormProps {
  asset?: Asset;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ asset, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!asset;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: asset ? {
      name: asset.fieldValues['/text'],
      category: asset.fieldValues['/attributes/@ast01'],
      location: asset.fieldValues['/attributes/@ast02'],
      model: asset.fieldValues['/attributes/@ast03'],
      lastService: asset.fieldValues['/attributes/@ast04']?.split('T')[0] || '',
      nextService: asset.fieldValues['/attributes/@ast05']?.split('T')[0] || '',
      status: asset.fieldValues['/attributes/@ast06'],
      serviceInterval: asset.fieldValues['/attributes/@ast07'] || 90,
    } : {
      status: 'opt-upcoming',
      serviceInterval: 90,
    },
  });
  
  const onSubmit = async (data: AssetFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await assetApi.update(asset.id, {
          '/text': data.name,
          '/attributes/@ast01': data.category,
          '/attributes/@ast02': data.location,
          '/attributes/@ast03': data.model,
          '/attributes/@ast04': data.lastService,
          '/attributes/@ast05': data.nextService,
          '/attributes/@ast06': data.status,
          '/attributes/@ast07': data.serviceInterval,
        });
        toast.success('Asset updated successfully!');
      } else {
        // Create the asset
        await assetApi.create({
          name: data.name,
          category: data.category,
          location: data.location,
          model: data.model,
          lastService: data.lastService,
          nextService: data.nextService,
          status: data.status,
          serviceInterval: data.serviceInterval,
        });
        
        // Automatically create maintenance schedule entry
        const priority = data.status === 'opt-due' ? 'opt-high' : 
                        data.status === 'opt-upcoming' ? 'opt-medium' : 'opt-low';
        
        await scheduleApi.create({
          assetName: data.name,
          nextServiceDate: data.nextService,
          priority: priority,
          description: `${data.category} maintenance - ${data.name}`,
        });
        
        toast.success('Asset and maintenance schedule created successfully!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update asset' : 'Failed to create asset');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-900',
          'border-2 border-white/20 shadow-2xl shadow-emerald-500/20',
          'backdrop-blur-xl'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-white/20 bg-black/30 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shadow-lg shadow-emerald-500/30">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                {isEditing ? 'Edit Asset' : 'Add New Asset'}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 font-medium hidden sm:block">
                {isEditing ? 'Update asset information' : 'Register a new equipment asset'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2.5 rounded-lg bg-white/10 hover:bg-rose-500/20 border-2 border-white/20 hover:border-rose-400/40 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white/80 hover:text-rose-300" />
          </motion.button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(95vh-10rem)] sm:max-h-[calc(90vh-10rem)]">
          {/* Asset Name */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Asset Name *
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g., HVAC Unit - Rooftop A"
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-white/5 border border-white/10',
                'text-white placeholder:text-white/40',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                'transition-all',
                errors.name && 'border-red-500/50 focus:ring-red-500/50'
              )}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          
          {/* Category and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Category *
              </label>
              <input
                {...register('category')}
                type="text"
                placeholder="e.g., HVAC, Electrical, Plumbing"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white placeholder:text-white/40',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                  'transition-all',
                  errors.category && 'border-red-500/50 focus:ring-red-500/50'
                )}
              />
              {errors.category && (
                <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Location *
              </label>
              <input
                {...register('location')}
                type="text"
                placeholder="e.g., Building A - Floor 3"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white placeholder:text-white/40',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                  'transition-all',
                  errors.location && 'border-red-500/50 focus:ring-red-500/50'
                )}
              />
              {errors.location && (
                <p className="text-red-400 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>
          
          {/* Model/Serial */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Model/Serial Number *
            </label>
            <input
              {...register('model')}
              type="text"
              placeholder="e.g., Carrier 50TCQ-A12"
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-white/5 border border-white/10',
                'text-white placeholder:text-white/40',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                'transition-all',
                errors.model && 'border-red-500/50 focus:ring-red-500/50'
              )}
            />
            {errors.model && (
              <p className="text-red-400 text-sm mt-1">{errors.model.message}</p>
            )}
          </div>
          
          {/* Service Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Last Service Date *
              </label>
              <input
                {...register('lastService')}
                type="date"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                  'transition-all',
                  errors.lastService && 'border-red-500/50 focus:ring-red-500/50'
                )}
              />
              {errors.lastService && (
                <p className="text-red-400 text-sm mt-1">{errors.lastService.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Next Service Date *
              </label>
              <input
                {...register('nextService')}
                type="date"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                  'transition-all',
                  errors.nextService && 'border-red-500/50 focus:ring-red-500/50'
                )}
              />
              {errors.nextService && (
                <p className="text-red-400 text-sm mt-1">{errors.nextService.message}</p>
              )}
            </div>
          </div>
          
          {/* Status and Service Interval */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Status *
              </label>
              <select
                {...register('status')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-slate-900 border border-white/10',
                  'text-white',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                  'transition-all',
                  errors.status && 'border-red-500/50 focus:ring-red-500/50'
                )}
              >
                <option value="opt-completed" className="bg-slate-900 text-white">Completed</option>
                <option value="opt-upcoming" className="bg-slate-900 text-white">Upcoming</option>
                <option value="opt-due" className="bg-slate-900 text-white">Due</option>
              </select>
              {errors.status && (
                <p className="text-red-400 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Service Interval (days) *
              </label>
              <input
                {...register('serviceInterval', { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="90"
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white placeholder:text-white/40',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                  'transition-all',
                  errors.serviceInterval && 'border-red-500/50 focus:ring-red-500/50'
                )}
              />
              {errors.serviceInterval && (
                <p className="text-red-400 text-sm mt-1">{errors.serviceInterval.message}</p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 px-4 sm:px-6 py-3 rounded-xl',
                'bg-white/5 hover:bg-white/10',
                'min-h-[48px]', // Touch-friendly
                'text-white/70 font-medium',
                'border border-white/10',
                'transition-all'
              )}
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex-1 px-4 sm:px-6 py-3 rounded-xl',
                'bg-gradient-to-r from-emerald-500 to-teal-500',
                'hover:from-emerald-400 hover:to-teal-400',
                'text-white font-semibold text-sm sm:text-base',
                'shadow-xl shadow-emerald-500/30',
                'transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
                'min-h-[48px]' // Touch-friendly
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Update Asset' : 'Create Asset'}
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
