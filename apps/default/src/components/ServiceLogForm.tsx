import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { webhookApi, assetApi } from '../services/api';
import { cn } from '../lib/utils';

const serviceSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required'),
  serviceDate: z.string().min(1, 'Service date is required'),
  technician: z.string().min(1, 'Technician name is required'),
  serviceType: z.enum(['preventive', 'repair', 'inspection']),
  cost: z.number().min(0, 'Cost must be positive'),
  notes: z.string().min(1, 'Notes are required'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceLogFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ServiceLogForm: React.FC<ServiceLogFormProps> = ({ onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [assets, setAssets] = React.useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingAssets, setIsLoadingAssets] = React.useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      serviceDate: format(new Date(), 'yyyy-MM-dd'),
      serviceType: 'preventive',
      cost: 0,
    },
  });
  
  // Fetch assets on mount
  React.useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await assetApi.getAll();
        setAssets(data.map(asset => ({
          id: asset.id,
          name: asset.fieldValues['/text'] || 'Unnamed Asset'
        })));
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        toast.error('Failed to load assets');
      } finally {
        setIsLoadingAssets(false);
      }
    };
    fetchAssets();
  }, []);
  
  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      await webhookApi.logService(data);
      setShowSuccess(true);
      toast.success('Service entry logged successfully!');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      toast.error('Failed to log service entry');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-lg rounded-2xl',
          'bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-900',
          'border-2 border-white/20 shadow-2xl shadow-emerald-500/20',
          'backdrop-blur-xl overflow-hidden'
        )}
      >
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-emerald-400/40 rounded-full"
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
              }}
              animate={{
                x: [
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%',
                ],
                y: [
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%',
                ],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            />
          ))}
          
          {/* Geometric Shapes */}
          {/* Rotating Hexagon */}
          <motion.div
            className="absolute top-10 right-10 w-20 h-20 border-2 border-emerald-400/20"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          
          {/* Pulsing Circle */}
          <motion.div
            className="absolute bottom-20 left-10 w-16 h-16 rounded-full border-2 border-teal-400/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Rotating Triangle */}
          <motion.div
            className="absolute top-1/2 left-5 w-12 h-12 border-2 border-emerald-300/20"
            style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }}
            animate={{
              rotate: -360,
              y: [-10, 10, -10],
            }}
            transition={{
              rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          
          {/* Floating Square */}
          <motion.div
            className="absolute bottom-10 right-20 w-10 h-10 border-2 border-teal-300/20 rounded-lg"
            animate={{
              rotate: [0, 90, 180, 270, 360],
              x: [-5, 5, -5],
              y: [-5, 5, -5],
            }}
            transition={{
              rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
              x: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          
          {/* Gradient Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-teal-500/10 to-emerald-500/10 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </div>
        
        {/* Success overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <CheckCircle2 className="w-20 h-20 text-emerald-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-white/20 bg-black/30 backdrop-blur-xl shadow-lg">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">Log Service Entry</h2>
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Asset Name
            </label>
            {isLoadingAssets ? (
              <div className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 flex items-center gap-2 text-white/50">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading assets...</span>
              </div>
            ) : (
              <select
                {...register('assetName')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-slate-900 border-2 border-white/20',
                  'text-white',
                  'hover:border-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/60',
                  'transition-all duration-300',
                  'cursor-pointer'
                )}
              >
                <option value="" className="bg-slate-900 text-white/70">Select an asset...</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.name} className="bg-slate-900 text-white">
                    {asset.name}
                  </option>
                ))}
              </select>
            )}
            {errors.assetName && (
              <p className="mt-1.5 text-sm text-rose-400 font-medium">{errors.assetName.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Service Date
              </label>
              <input
                type="date"
                {...register('serviceDate')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/10 border-2 border-white/20',
                  'text-white',
                  'hover:bg-white/15 hover:border-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/60',
                  'transition-all duration-300'
                )}
              />
              {errors.serviceDate && (
                <p className="mt-1.5 text-sm text-rose-400 font-medium">{errors.serviceDate.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Service Type
              </label>
              <select
                {...register('serviceType')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-slate-900 border-2 border-white/20',
                  'text-white',
                  'hover:border-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/60',
                  'transition-all duration-300'
                )}
              >
                <option value="preventive" className="bg-slate-900 text-white">Preventive</option>
                <option value="repair" className="bg-slate-900 text-white">Repair</option>
                <option value="inspection" className="bg-slate-900 text-white">Inspection</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Technician
              </label>
              <input
                {...register('technician')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/10 border-2 border-white/20',
                  'text-white placeholder:text-white/50',
                  'hover:bg-white/15 hover:border-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/60',
                  'transition-all duration-300'
                )}
                placeholder="Technician name"
              />
              {errors.technician && (
                <p className="mt-1.5 text-sm text-rose-400 font-medium">{errors.technician.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('cost', { valueAsNumber: true })}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/10 border-2 border-white/20',
                  'text-white placeholder:text-white/50',
                  'hover:bg-white/15 hover:border-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/60',
                  'transition-all duration-300'
                )}
                placeholder="0"
              />
              {errors.cost && (
                <p className="mt-1.5 text-sm text-rose-400 font-medium">{errors.cost.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Service Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-white/10 border-2 border-white/20',
                'text-white placeholder:text-white/50',
                'hover:bg-white/15 hover:border-white/30',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/60',
                'transition-all duration-300',
                'resize-none'
              )}
              placeholder="Describe the service performed..."
            />
            {errors.notes && (
              <p className="mt-1.5 text-sm text-rose-400 font-medium">{errors.notes.message}</p>
            )}
          </div>
          
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging...
                </>
              ) : (
                'Log Service'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
