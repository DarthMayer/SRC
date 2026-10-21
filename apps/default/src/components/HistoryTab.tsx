import * as React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, DollarSign, User, Calendar, Info, ExternalLink } from 'lucide-react';
import { serviceHistoryApi, type ServiceHistory, PROJECT_IDS } from '../services/api';
import { cn } from '../lib/utils';

const typeConfig = {
  preventive: { color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Preventive' },
  repair: { color: 'rose', bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', label: 'Repair' },
  inspection: { color: 'blue', bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', label: 'Inspection' },
};

export const HistoryTab: React.FC = () => {
  const [history, setHistory] = React.useState<ServiceHistory[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const data = await serviceHistoryApi.getAll();
        console.log('Service history loaded:', data);
        setHistory(data || []);
      } catch (error) {
        console.error('Failed to load service history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl',
          'bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl',
          'border border-slate-200/50 dark:border-slate-700/30',
          'overflow-hidden'
        )}
      >
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <h3 className="font-semibold text-slate-800 dark:text-white">Service History</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded border border-amber-500/30">
                  SAMPLE DATA
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track all maintenance and service records</p>
            </div>
            <a
              href={`https://www.taskade.com/d/${PROJECT_IDS.SERVICE_HISTORY}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300',
                'hover:bg-slate-200 dark:hover:bg-slate-600/50 transition-colors'
              )}
            >
              <ExternalLink className="w-3 h-3" />
              Edit in Project
            </a>
          </div>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-slate-700/30">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No service records found</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Service history will appear here</p>
            </div>
          ) : (
            history.map((record, index) => {
              const config = typeConfig[record.serviceType] || typeConfig.preventive;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('p-2.5 rounded-xl', config.bg)}>
                      <Wrench className={cn('w-4 h-4', config.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-slate-800 dark:text-white truncate">{record.title}</p>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Asset: {record.assetName}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {record.serviceDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {record.serviceDate}
                          </span>
                        )}
                        {record.technician && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {record.technician}
                          </span>
                        )}
                        {record.cost > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${record.cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
