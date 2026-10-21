import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, Moon, Sun, Shield, Database, Mail, Palette, 
  Copy, ExternalLink, CheckCircle2, 
  Folder, Sparkles
} from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import { cn } from '../lib/utils';
import { PROJECT_IDS } from '../services/api';

interface SettingItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  children?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, title, description, color, children }) => {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors rounded-xl gap-3">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className={cn('p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0', colors.bg)}>
          <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', colors.text)} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-800 dark:text-white text-sm sm:text-base truncate">{title}</p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
};

const ToggleSwitch: React.FC<{ defaultChecked?: boolean; disabled?: boolean }> = ({ defaultChecked = false, disabled = false }) => {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={setChecked}
      disabled={disabled}
      className={cn(
        'w-11 h-6 rounded-full relative transition-colors duration-200',
        'bg-slate-200 dark:bg-slate-700',
        'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-400 data-[state=checked]:to-indigo-400',
        'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Switch.Thumb
        className={cn(
          'block w-5 h-5 bg-white rounded-full shadow-md',
          'transition-transform duration-200',
          'translate-x-0.5 data-[state=checked]:translate-x-[22px]'
        )}
      />
    </Switch.Root>
  );
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        'hover:bg-slate-200 dark:hover:bg-slate-600',
        copied && 'text-emerald-500'
      )}
    >
      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

const ProjectLink: React.FC<{ name: string; id: string; description: string }> = ({ name, id, description }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg gap-2 sm:gap-3">
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-1 pl-6 sm:pl-0 flex-shrink-0">
      <code className="text-[10px] sm:text-xs bg-slate-200 dark:bg-slate-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono text-slate-600 dark:text-slate-300 truncate max-w-[100px] sm:max-w-none">
        {id}
      </code>
      <CopyButton text={id} />
      <a
        href={`https://www.taskade.com/d/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-slate-400" />
      </a>
    </div>
  </div>
);

interface SettingsTabProps {
  isActive?: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ isActive = true }) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    // Only animate on first mount
    const timer = setTimeout(() => setHasAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Skip animations after first render to prevent flickering
  const animationProps = hasAnimated 
    ? {} 
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="p-3 sm:p-6 overflow-auto h-full">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Demo Banner */}
        <motion.div
          {...animationProps}
          className={cn(
            'rounded-xl sm:rounded-2xl overflow-hidden',
            'bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10',
            'border border-amber-500/30 dark:border-amber-400/20'
          )}
        >
          <div className="p-3 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/20 flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white flex flex-wrap items-center gap-2">
                  Demo Template
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full">
                    SAMPLE DATA
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  This app contains sample data for demonstration purposes. Clone this workspace to customize it for your own use case.
                </p>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-lg text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">Connected to Taskade</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-lg text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">AI Agent integrated</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data Sources - Project Connections */}
        <motion.div
          {...animationProps}
          transition={hasAnimated ? {} : { delay: 0.05 }}
          className={cn(
            'rounded-xl sm:rounded-2xl overflow-hidden',
            'bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl',
            'border border-slate-200/50 dark:border-slate-700/30'
          )}
        >
          <div className="p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-700/30">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base">Data Sources</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              <span className="hidden sm:inline">Each tab pulls data from these Taskade projects. Edit projects directly or update IDs in </span>
              <span className="sm:hidden">Linked Taskade projects. Edit IDs in </span>
              <code className="text-[10px] sm:text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">api.ts</code>
            </p>
          </div>
          <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
            <ProjectLink 
              name="Inventory Items" 
              id={PROJECT_IDS.INVENTORY} 
              description="Stock levels, SKUs, categories → Inventory Tab"
            />
            <ProjectLink 
              name="Suppliers" 
              id={PROJECT_IDS.SUPPLIERS} 
              description="Vendor contacts and specialties"
            />
            <ProjectLink 
              name="Assets" 
              id={PROJECT_IDS.ASSETS} 
              description="Equipment registry with service schedules"
            />
            <ProjectLink 
              name="Maintenance Schedule" 
              id={PROJECT_IDS.MAINTENANCE} 
              description="Upcoming maintenance tasks"
            />
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          {...animationProps}
          transition={hasAnimated ? {} : { delay: 0.1 }}
          className={cn(
            'rounded-2xl overflow-hidden',
            'bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl',
            'border border-slate-200/50 dark:border-slate-700/30'
          )}
        >
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/30">
            <h3 className="font-semibold text-slate-800 dark:text-white">Appearance</h3>
          </div>
          <div className="p-2">
            <SettingItem
              icon={theme === 'dark' ? Moon : Sun}
              title="Theme"
              description={`Currently using ${theme} mode`}
              color="purple"
            >
              <button
                onClick={toggleTheme}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  'bg-slate-100 dark:bg-slate-700',
                  'hover:bg-slate-200 dark:hover:bg-slate-600'
                )}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-500" />
                )}
              </button>
            </SettingItem>
            <SettingItem
              icon={Palette}
              title="Accent Color"
              description="Customize the app's accent color"
              color="rose"
            >
              <div className="flex gap-2">
                {['#93c5fd', '#c4b5fd', '#a7f3d0', '#fcd34d', '#fca5a5'].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-600 shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </SettingItem>
          </div>
        </motion.div>

        {/* Notifications - Demo Only */}
        <motion.div
          {...animationProps}
          transition={hasAnimated ? {} : { delay: 0.15 }}
          className={cn(
            'rounded-2xl overflow-hidden',
            'bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl',
            'border border-slate-200/50 dark:border-slate-700/30',
            'opacity-60'
          )}
        >
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/30">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                UI Demo Only
              </span>
            </div>
          </div>
          <div className="p-2">
            <SettingItem
              icon={Bell}
              title="Push Notifications"
              description="Get notified about low stock alerts"
              color="amber"
            >
              <ToggleSwitch defaultChecked disabled />
            </SettingItem>
            <SettingItem
              icon={Mail}
              title="Email Alerts"
              description="Receive daily inventory summaries"
              color="blue"
            >
              <ToggleSwitch disabled />
            </SettingItem>
          </div>
        </motion.div>

        {/* Data & Security - Demo Only */}
        <motion.div
          {...animationProps}
          transition={hasAnimated ? {} : { delay: 0.2 }}
          className={cn(
            'rounded-2xl overflow-hidden',
            'bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl',
            'border border-slate-200/50 dark:border-slate-700/30',
            'opacity-60'
          )}
        >
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/30">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white">Data & Security</h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                UI Demo Only
              </span>
            </div>
          </div>
          <div className="p-2">
            <SettingItem
              icon={Database}
              title="Auto Backup"
              description="Automatically backup inventory data"
              color="emerald"
            >
              <ToggleSwitch defaultChecked disabled />
            </SettingItem>
            <SettingItem
              icon={Shield}
              title="Two-Factor Auth"
              description="Add an extra layer of security"
              color="rose"
            >
              <ToggleSwitch disabled />
            </SettingItem>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
