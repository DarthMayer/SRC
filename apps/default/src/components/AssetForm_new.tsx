import * as React from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { assetApi } from '../services/api';
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
        toast.success('Asset created successfully!');
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
  
  const inputClassName = cn(
    'w-full px-4 py-3 rounded-xl',
    'bg-white/10 border-2 border-white/20',
    'text-white placeholder:text-white/50',
    'hover:bg-white/15 hover:border-white/30',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/60',
    'transition-all duration-300'
  );
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-900',
          'border-2 border-white/20 shadow-2xl shadow-emerald-500/20',
          'backdrop-blur-xl'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-white/20 bg-black/30 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shadow-lg shadow-emerald-500/30">
              <Package className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                {isEditing ? 'Edit Asset' : 'Add New Asset'}
              </h2>
              <p className="text-sm text-white/80 font-medium">
                {isEditing ? 'Update asset information' : 'Register a new equipment asset'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2.5 rounded-lg bg-white/10 hover:bg-rose-500/20 border-2 border-white/20 hover:border-rose-400/40 transition-all duration-300"
          >
            <X className="w-5 h-5 text-white/80 hover:text-rose-300" />
          </motion.button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {/* Asset Name */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Asset Name <span className="text-rose-400">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g., HVAC Unit - Rooftop A"
              className={inputClassName}
            />
            {errors.name && (
              <p className="text-rose-400 text-sm mt-1.5 font-medium">{errors.name.message}</p>
            )}
          </div>
          
          {/* Category and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Category <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('category')}
                type="text"
                placeholder="e.g., HVAC, Electrical, Plumbing"
                className={inputClassName}
              />
              {errors.category && (
                <p className="text-rose-400 text-sm mt-1.5 font-medium">{errors.category.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Location <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('location')}
                type="text"
                placeholder="e.g., Building A - Floor 3"
                className={inputClassName}
              />
              {errors.location && (
                <p className="text-rose-400 text-sm mt-1.5 font-medium">{errors.location.message}</p>
              )}
            </div>
          </div>
          
          {/* Model/Serial */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Model/Serial Number <span className="text-rose-400">*</span>
            </label>
            <input
              {...register('model')}
              type="text"
              placeholder="e.g., Carrier 50TCQ-A12"
              className={inputClassName}
            />
            {errors.model && (
              <p className="text-rose-400 text-sm mt-1.5 font-medium">{errors.model.message}</p>
            )}
          </div>
          
          {/* Service Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Last Service Date <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('lastService')}
                type="date"
                className={inputClassName}
              />
              {errors.lastService && (
                <p className="text-rose-400 text-sm mt-1.5 font-medium">{errors.lastService.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Next Service Date <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('nextService')}
                type="date"
                className={inputClassName}
              />
              {errors.nextService && (
                <p className="text-rose-400 text-sm mt-1.5 font-medium">{errors.nextService.message}</p>
              )}
            </div>
          </div>
          
          {/* Status and Service Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Status <span className="text-rose-400">*</span>
              </label>
              <select
                {...register('status')}
                className={inputClassName}
              >
                <option value="opt-upcoming">Upcoming</option>
                <option value="opt-due">Due</option>
                <option value="opt-completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Service Interval (days) <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('serviceInterval', { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="90"
                className={inputClassName}
              />
              {errors.serviceInterval && (
                <p className="text-rose-400 text-sm mt-1.5 font-medium">{errors.serviceInterval.message}</p>
              )}
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex-1 px-6 py-3 rounded-xl',
                'bg-white/10 hover:bg-white/15',
                'text-white/80 hover:text-white',
                'border-2 border-white/20 hover:border-white/30',
                'font-semibold',
                'transition-all duration-300'
              )}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex-1 px-6 py-3 rounded-xl',
                'bg-gradient-to-r from-emerald-600 to-teal-600',
                'hover:from-emerald-500 hover:to-teal-500',
                'text-white font-bold',
                'border-2 border-emerald-400/30 hover:border-emerald-300/60',
                'shadow-xl shadow-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-400/60',
                'transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
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
