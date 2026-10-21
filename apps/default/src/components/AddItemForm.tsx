import * as React from 'react';
import { motion } from 'framer-motion';
import { X, Save, Package } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryApi } from '../services/api';
import { cn } from '../lib/utils';

interface AddItemFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    category: '',
    quantity: '',
    reorderLevel: '',
    sku: '',
    status: 'stock-good' as 'stock-good' | 'stock-low' | 'stock-out' | 'stock-ordered',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await inventoryApi.create({
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity) || 0,
        reorderLevel: parseFloat(formData.reorderLevel) || 0,
        status: formData.status,
        sku: formData.sku,
      });

      toast.success('Item added successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = cn(
    'w-full px-4 py-2.5 rounded-xl',
    'bg-slate-800/60 border border-slate-600/40',
    'text-white placeholder:text-slate-500',
    'focus:outline-none focus:border-cyan-500/50',
    'focus:shadow-[0_0_15px_rgba(6,182,212,0.15),inset_0_0_10px_rgba(6,182,212,0.05)]',
    'hover:border-slate-500/50 hover:bg-slate-800/70',
    'transition-all duration-300'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/90",
          "backdrop-blur-xl border border-slate-700/50",
          "shadow-[0_0_40px_rgba(6,182,212,0.15),0_25px_50px_rgba(0,0,0,0.5)]"
        )}
      >
        {/* Ambient glow effects */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative p-6 border-b border-slate-700/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <Package className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.5))' }} />
              </div>
              <h2 className="text-xl font-semibold text-white">Add New Item</h2>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "p-2 rounded-xl",
                "bg-slate-800/60 border border-slate-600/40",
                "hover:bg-slate-700/60 hover:border-slate-500/50",
                "transition-all duration-300"
              )}
            >
              <X className="w-5 h-5 text-slate-400" />
            </motion.button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative p-6 space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Item Name <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClasses}
              placeholder="Enter item name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputClasses}
              placeholder="e.g. Electronics, Furniture"
            />
          </div>

          {/* Quantity and Reorder Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quantity <span className="text-cyan-400">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={inputClasses}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reorder At
              </label>
              <input
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                className={inputClasses}
                placeholder="0"
              />
            </div>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              SKU
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className={inputClasses}
              placeholder="e.g. SKU-001"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className={inputClasses}
            >
              <option value="stock-good">In Stock</option>
              <option value="stock-low">Low Stock</option>
              <option value="stock-ordered">On Order</option>
              <option value="stock-out">Out of Stock</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl font-medium",
                "bg-slate-800/60 border border-slate-600/40",
                "text-slate-300 hover:text-white",
                "hover:bg-slate-700/60 hover:border-slate-500/50",
                "transition-all duration-300"
              )}
            >
              Cancel
            </motion.button>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl font-semibold',
                'bg-gradient-to-r from-cyan-500 to-blue-500',
                'text-white border border-cyan-400/30',
                'shadow-[0_0_20px_rgba(6,182,212,0.3),0_4px_15px_rgba(0,0,0,0.2)]',
                'hover:shadow-[0_0_30px_rgba(6,182,212,0.4),0_4px_20px_rgba(0,0,0,0.3)]',
                'transition-all duration-300',
                'flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? (
                <div 
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  style={{ boxShadow: '0 0 10px rgba(255,255,255,0.3)' }}
                />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Add Item
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
