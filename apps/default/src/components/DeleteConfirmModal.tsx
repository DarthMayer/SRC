import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  itemName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-md rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-slate-900 to-slate-800',
          'border border-rose-500/20 shadow-2xl shadow-rose-500/10'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-rose-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-white/80">
            {message}
          </p>
          
          <div className={cn(
            'p-4 rounded-xl',
            'bg-rose-500/10 border border-rose-500/20'
          )}>
            <p className="text-rose-300 font-medium break-words">
              {itemName}
            </p>
          </div>
          
          <p className="text-sm text-white/50">
            This action cannot be undone.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-white/10 bg-black/20">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={cn(
              'flex-1 px-6 py-3 rounded-xl',
              'bg-white/5 hover:bg-white/10',
              'text-white/70 font-medium',
              'border border-white/10',
              'transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={cn(
              'flex-1 px-6 py-3 rounded-xl',
              'bg-gradient-to-r from-rose-500 to-red-500',
              'hover:from-rose-400 hover:to-red-400',
              'text-white font-medium',
              'shadow-lg shadow-rose-500/25',
              'transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
