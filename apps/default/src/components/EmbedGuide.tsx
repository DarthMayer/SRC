import * as React from 'react';
import { motion } from 'framer-motion';
import { Code, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const EmbedGuide: React.FC = () => {
  const [copiedWidget, setCopiedWidget] = React.useState(false);
  const [copiedIframe, setCopiedIframe] = React.useState(false);

  const widgetCode = `<script src="https://assets.taskade.com/embeds/latest/taskade-embed.min.js"></script>
<script type="module">
  TaskadeEmbed.AgentPublicChatPopup.init({
    publicAgentId: '01K85B4QXB45PNAV1F2PXMGDRS',
    position: 'bottom-right',
    theme: 'auto'
  });
</script>`;

  const iframeCode = `<iframe 
  src="https://www.taskade.com/a/01K85B4QXB45PNAV1F2PXMGDRS"
  allow="clipboard-read; clipboard-write" 
  width="600"
  height="400"
  frameborder="0"
  allowfullscreen>
</iframe>`;

  const copyToClipboard = (text: string, type: 'widget' | 'iframe') => {
    navigator.clipboard.writeText(text);
    if (type === 'widget') {
      setCopiedWidget(true);
      setTimeout(() => setCopiedWidget(false), 2000);
    } else {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Embed Your AI Assistant</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
            Maintenance Assistant
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Add intelligent maintenance support to any website with a simple code snippet
          </p>
        </motion.div>

        {/* Method 1: JavaScript Widget (Recommended) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-slate-900/90 to-emerald-900/20 rounded-2xl border-2 border-emerald-500/20 p-8 backdrop-blur-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">JavaScript Widget</h2>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-slate-400">
                  Floating chat button with better UX, responsive design, and automatic theming
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => copyToClipboard(widgetCode, 'widget')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg',
                    'bg-emerald-500/10 hover:bg-emerald-500/20',
                    'border border-emerald-500/20 hover:border-emerald-500/40',
                    'text-emerald-400 text-sm font-medium',
                    'transition-all duration-200',
                    'cursor-pointer'
                  )}
                >
                  {copiedWidget ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950/50 rounded-xl p-6 overflow-x-auto border border-white/5">
                <code className="text-emerald-300 text-sm font-mono">
                  {widgetCode}
                </code>
              </pre>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/30 rounded-lg p-4 border border-white/5">
                <div className="text-emerald-400 font-semibold mb-1">✨ Better UX</div>
                <div className="text-slate-400 text-sm">Responsive, mobile-friendly interface</div>
              </div>
              <div className="bg-slate-950/30 rounded-lg p-4 border border-white/5">
                <div className="text-emerald-400 font-semibold mb-1">🎨 Auto Theme</div>
                <div className="text-slate-400 text-sm">Matches user's system preferences</div>
              </div>
              <div className="bg-slate-950/30 rounded-lg p-4 border border-white/5">
                <div className="text-emerald-400 font-semibold mb-1">⚡ Fast Load</div>
                <div className="text-slate-400 text-sm">Optimized bundle, lazy loading</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Method 2: Iframe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/20 rounded-2xl border-2 border-white/10 p-8 backdrop-blur-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Iframe Embed</h2>
                <p className="text-slate-400">
                  Simple iframe for inline embedding in specific page sections
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => copyToClipboard(iframeCode, 'iframe')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg',
                    'bg-slate-700/50 hover:bg-slate-700/70',
                    'border border-white/10 hover:border-white/20',
                    'text-slate-300 text-sm font-medium',
                    'transition-all duration-200',
                    'cursor-pointer'
                  )}
                >
                  {copiedIframe ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950/50 rounded-xl p-6 overflow-x-auto border border-white/5">
                <code className="text-slate-300 text-sm font-mono">
                  {iframeCode}
                </code>
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Live Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-slate-900/90 to-emerald-900/10 rounded-2xl border-2 border-emerald-500/20 p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Live Preview</h2>
                <p className="text-slate-400">
                  See the agent in action - try asking about maintenance schedules
                </p>
              </div>
              <a
                href="https://www.taskade.com/a/01K85B4QXB45PNAV1F2PXMGDRS"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-emerald-500/10 hover:bg-emerald-500/20',
                  'border border-emerald-500/20 hover:border-emerald-500/40',
                  'text-emerald-400 text-sm font-medium',
                  'transition-all duration-200',
                  'cursor-pointer'
                )}
              >
                <ExternalLink className="w-4 h-4" />
                Open Full Page
              </a>
            </div>

            <div className="bg-slate-950/50 rounded-xl overflow-hidden border border-white/5">
              <iframe
                src="https://www.taskade.com/a/01K85B4QXB45PNAV1F2PXMGDRS"
                allow="clipboard-read; clipboard-write"
                className="w-full h-[600px]"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-slate-500 text-sm"
        >
          <p>
            Powered by{' '}
            <a
              href="https://www.taskade.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Taskade AI
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
