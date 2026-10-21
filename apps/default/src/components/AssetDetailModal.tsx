import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Wrench, Clock, DollarSign, User, Save, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { assetApi, serviceApi } from '../services/api';
import { useMaintenanceStore } from '../store';
import type { Asset, ServiceRecord } from '../types';
import { cn } from '../lib/utils';

interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, onClose, onUpdate }) => {
  const { serviceRecords } = useMaintenanceStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [serviceInterval, setServiceInterval] = React.useState(
    asset.fieldValues['/attributes/@ast07'] || 90
  );
  
  const assetServices = React.useMemo(() => {
    return serviceRecords
      .filter(record => record.fieldValues['/attributes/@srv01'] === asset.fieldValues['/text'])
      .sort((a, b) => {
        const dateA = new Date(a.fieldValues['/attributes/@srv02']);
        const dateB = new Date(b.fieldValues['/attributes/@srv02']);
        return dateB.getTime() - dateA.getTime();
      });
  }, [serviceRecords, asset]);
  
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const getServiceTypeColor = (type: string) => {
    const colors = {
      'opt-preventive': 'text-blue-400 bg-blue-500/10',
      'opt-repair': 'text-amber-400 bg-amber-500/10',
      'opt-inspection': 'text-purple-400 bg-purple-500/10',
    };
    return colors[type as keyof typeof colors] || 'text-white/60 bg-white/5';
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await assetApi.update(asset.id, {
        '/attributes/@ast07': serviceInterval,
      });
      toast.success('Service interval updated successfully!');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update service interval');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const totalCost = assetServices.reduce((sum, record) => {
    return sum + (record.fieldValues['/attributes/@srv05'] || 0);
  }, 0);
  
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
          'relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-900',
          'border-2 border-white/20 shadow-2xl shadow-emerald-500/20',
          'backdrop-blur-xl'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 border-b-2 border-white/20 bg-black/30 backdrop-blur-xl shadow-lg">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {asset.fieldValues['/text']}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={asset.fieldValues['/attributes/@ast06']} />
              <span className="text-sm text-white/80 font-medium">
                {asset.fieldValues['/attributes/@ast01']}
              </span>
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
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="p-6 space-y-6">
            {/* Asset Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={cn(
                'p-5 rounded-xl',
                'bg-white/10 border-2 border-white/20',
                'hover:bg-white/15 hover:border-teal-400/40',
                'shadow-lg hover:shadow-xl hover:shadow-teal-500/20',
                'transition-all duration-300'
              )}>
                <div className="flex items-center gap-2 text-white/80 mb-2">
                  <MapPin className="w-5 h-5 text-teal-400" />
                  <span className="text-sm font-semibold">Location</span>
                </div>
                <p className="text-white text-base">{asset.fieldValues['/attributes/@ast02']}</p>
              </div>
              
              <div className={cn(
                'p-5 rounded-xl',
                'bg-white/10 border-2 border-white/20',
                'hover:bg-white/15 hover:border-sage-400/40',
                'shadow-lg hover:shadow-xl hover:shadow-sage-500/20',
                'transition-all duration-300'
              )}>
                <div className="flex items-center gap-2 text-white/80 mb-2">
                  <Wrench className="w-5 h-5 text-sage-400" />
                  <span className="text-sm font-semibold">Model/Serial</span>
                </div>
                <p className="text-white text-base">{asset.fieldValues['/attributes/@ast03']}</p>
              </div>
              
              <div className={cn(
                'p-4 rounded-xl',
                'bg-white/5 border border-white/10'
              )}>
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Last Service</span>
                </div>
                <p className="text-white">{formatDate(asset.fieldValues['/attributes/@ast04'])}</p>
              </div>
              
              <div className={cn(
                'p-4 rounded-xl',
                'bg-white/5 border border-white/10'
              )}>
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Next Service</span>
                </div>
                <p className="text-white font-medium">{formatDate(asset.fieldValues['/attributes/@ast05'])}</p>
              </div>
            </div>
            
            {/* Service Interval Editor */}
            <div className={cn(
              'p-5 rounded-xl',
              'bg-gradient-to-br from-cyan-500/10 to-blue-500/10',
              'border border-cyan-500/20'
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Service Interval</h3>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium',
                      'bg-white/10 hover:bg-white/20',
                      'text-white border border-white/10',
                      'transition-all'
                    )}
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setServiceInterval(asset.fieldValues['/attributes/@ast07'] || 90);
                      }}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        'bg-white/5 hover:bg-white/10',
                        'text-white/70 border border-white/10',
                        'transition-all'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        'bg-gradient-to-r from-cyan-500 to-blue-500',
                        'hover:from-cyan-400 hover:to-blue-400',
                        'text-white',
                        'transition-all',
                        'disabled:opacity-50',
                        'flex items-center gap-2'
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={serviceInterval}
                    onChange={(e) => setServiceInterval(Number(e.target.value))}
                    min="1"
                    className={cn(
                      'w-32 px-4 py-2.5 rounded-lg',
                      'bg-white/10 border border-white/20',
                      'text-white text-center font-semibold',
                      'focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
                    )}
                  />
                  <span className="text-white/80">days between services</span>
                </div>
              ) : (
                <p className="text-white/80">
                  Service every{' '}
                  <span className="text-2xl font-bold text-white">
                    {asset.fieldValues['/attributes/@ast07']}
                  </span>{' '}
                  days
                </p>
              )}
            </div>
            
            {/* Service History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Service History</h3>
                {assetServices.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/60">Total Cost:</span>
                    <span className="text-white font-semibold">{formatCurrency(totalCost)}</span>
                  </div>
                )}
              </div>
              
              {assetServices.length === 0 ? (
                <div className={cn(
                  'p-8 rounded-xl text-center',
                  'bg-white/5 border border-white/10'
                )}>
                  <p className="text-white/40">No service history yet</p>
                  <p className="text-white/30 text-sm mt-1">Service records will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assetServices.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'p-4 rounded-xl',
                        'bg-white/5 border border-white/10',
                        'hover:bg-white/10 transition-all'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <p className="text-white font-medium mb-1">
                            {record.fieldValues['/text']}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-white/60">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(record.fieldValues['/attributes/@srv02'])}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {record.fieldValues['/attributes/@srv03']}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            getServiceTypeColor(record.fieldValues['/attributes/@srv04'])
                          )}>
                            {record.fieldValues['/attributes/@srv04'].replace('opt-', '')}
                          </span>
                          <span className="text-white font-semibold">
                            {formatCurrency(record.fieldValues['/attributes/@srv05'])}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
