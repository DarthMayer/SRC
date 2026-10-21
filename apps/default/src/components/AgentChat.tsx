import * as React from 'react';

declare global {
  interface Window {
    TaskadeEmbed?: {
      AgentPublicChatPopup: {
        init: (config: {
          publicAgentId: string;
          position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
          theme: 'auto' | 'light' | 'dark';
        }) => void;
      };
    };
  }
}

export const AgentChat: React.FC = () => {
  // Load Taskade embed script and initialize widget
  React.useEffect(() => {
    // Load the Taskade embed script
    const script = document.createElement('script');
    script.src = 'https://assets.taskade.com/embeds/latest/taskade-embed.min.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Taskade embed script loaded');
      
      // Initialize the agent chat widget
      if (window.TaskadeEmbed?.AgentPublicChatPopup) {
        window.TaskadeEmbed.AgentPublicChatPopup.init({
          publicAgentId: '01KBF6K38V7GZ80F2967S57AGV',
          position: 'bottom-right',
          theme: 'auto'
        });
        console.log('✅ Inventory Assistant chat widget initialized');
      }
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Taskade embed script');
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  // The widget handles everything - we just need to return null
  // The widget will inject its own UI into the page
  return null;
};
