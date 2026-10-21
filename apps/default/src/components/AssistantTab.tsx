import * as React from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, Loader2 } from 'lucide-react';
import { agentApi } from '../services/api';
import { cn } from '../lib/utils';

const suggestions = [
  { icon: '📦', text: 'Show low stock items', prompt: 'What items are running low on stock?' },
  { icon: '📊', text: 'Inventory summary', prompt: 'Give me a summary of my current inventory' },
  { icon: '🔔', text: 'Reorder alerts', prompt: 'Which items need to be reordered?' },
  { icon: '📈', text: 'Stock trends', prompt: 'What are the stock trends this week?' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantTabProps {
  isActive?: boolean;
}

export const AssistantTab: React.FC<AssistantTabProps> = ({ isActive = true }) => {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Initialize conversation and SSE stream
  const initializeChat = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const { conversationId: newConvoId } = await agentApi.createConversation();
      setConversationId(newConvoId);

      // Open SSE stream
      const streamUrl = agentApi.getStreamUrl(newConvoId);
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      let currentMessageId: string | null = null;

      eventSource.onopen = () => {
        console.log('SSE connected');
        setIsConnected(true);
        setIsLoading(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE event:', data);

          if (data.type === 'start') {
            currentMessageId = data.messageId;
            setMessages(prev => [...prev, { id: data.messageId, role: 'assistant', content: '' }]);
          } else if (data.type === 'text-delta' && currentMessageId) {
            setMessages(prev => prev.map(msg => 
              msg.id === currentMessageId 
                ? { ...msg, content: msg.content + data.delta }
                : msg
            ));
          } else if (data.type === 'finish') {
            currentMessageId = null;
            setIsLoading(false);
          } else if (data.type === 'error') {
            console.error('SSE error:', data.errorText);
            setIsLoading(false);
          }
        } catch (e) {
          console.error('Failed to parse SSE event:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
      };

      return newConvoId;
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setIsLoading(false);
      return null;
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || message;
    if (!messageText.trim()) return;

    // Add user message immediately
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: messageText }]);
    setMessage('');
    setIsLoading(true);

    try {
      let convoId = conversationId;
      
      // Initialize chat if not already done
      if (!convoId) {
        convoId = await initializeChat();
        if (!convoId) {
          setIsLoading(false);
          return;
        }
      }

      // Send the message
      await agentApi.sendMessage(convoId, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, { 
        id: `error-${Date.now()}`, 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
  };

  const handleSuggestion = (prompt: string) => {
    handleSend(prompt);
  };

  // Track if component has animated once to prevent re-animation flickering
  const [hasAnimated, setHasAnimated] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6 h-full flex flex-col">
      <motion.div
        initial={hasAnimated ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex-1 flex flex-col rounded-2xl overflow-hidden',
          'bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl',
          'border border-slate-200/50 dark:border-slate-700/30'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">StockFlow AI</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your intelligent inventory assistant</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Online</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-4">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2">How can I help you today?</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                I can help you manage inventory, analyze stock levels, and provide intelligent insights about your products.
              </p>
              
              {/* Suggestions */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestion(suggestion.prompt)}
                    disabled={isLoading}
                    className={cn(
                      'p-3 rounded-xl text-left transition-all',
                      'bg-slate-100/80 dark:bg-slate-700/50',
                      'hover:bg-slate-200/80 dark:hover:bg-slate-600/50',
                      'border border-slate-200/50 dark:border-slate-600/50',
                      'hover:border-amber-400/30 dark:hover:border-amber-500/30',
                      'group disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <span className="text-lg">{suggestion.icon}</span>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {suggestion.text}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    'max-w-[80%] p-3 rounded-2xl',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white'
                      : 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200'
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content || (isLoading && msg.role === 'assistant' ? '...' : '')}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/30">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !isLoading && handleSend()}
              placeholder="Ask me anything about your inventory..."
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl',
                'bg-slate-100/80 dark:bg-slate-700/50',
                'border border-slate-200/50 dark:border-slate-600/50',
                'text-slate-800 dark:text-white',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                'focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.05 }}
              whileTap={{ scale: isLoading ? 1 : 0.95 }}
              onClick={() => handleSend()}
              disabled={isLoading || !message.trim()}
              className={cn(
                'px-4 py-3 rounded-xl',
                'bg-gradient-to-r from-amber-400 to-orange-400',
                'text-white font-medium',
                'shadow-lg shadow-amber-500/30',
                'hover:shadow-amber-500/40',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
