
import React, { useState, useEffect, useRef } from 'react';
import { ConnectionStatus, Server, ChatMessage, UserTier } from '../types';
import { getSecurityBriefing, getServerRecommendation, getThreatAnalysis } from '../services/geminiService';
import { Send, Bot, User, Sparkles, ShieldCheck, Zap, Lock, Crown, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  currentStatus: ConnectionStatus;
  currentServer: Server;
  userTier: UserTier;
  onUpgrade: () => void;
  onServerSelect: (id: string) => void;
  allServers: Server[];
}

interface ThreatAlert {
  type: 'info' | 'warning' | 'danger';
  title: string;
  advice: string;
}

export const SecurityAssistant: React.FC<Props> = ({ currentStatus, currentServer, userTier, onUpgrade, onServerSelect, allServers }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTip = async () => {
      const briefing = await getSecurityBriefing(currentStatus, currentStatus === 'connected' ? currentServer : null);
      setTip(briefing);
    };
    fetchTip();
    
    // Initial welcome message
    setMessages([
      { role: 'assistant', content: "Hello! I'm Nova AI. I can help you find the best server for your needs or provide security advice. How can I help you today?" }
    ]);
  }, []);

  useEffect(() => {
    const fetchThreats = async () => {
      if (currentStatus === 'connected' && userTier === 'premium') {
        const analysis = await getThreatAnalysis(currentStatus, currentServer);
        setAlerts(analysis);
      } else {
        setAlerts([]);
      }
    };
    fetchThreats();
  }, [currentStatus, currentServer, userTier]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Check if user is asking for a recommendation
      const keywords = ['recommend', 'best', 'server', 'suggest', 'fastest'];
      const isAskingRecommendation = keywords.some(k => userMsg.toLowerCase().includes(k));

      if (isAskingRecommendation) {
        const result = await getServerRecommendation(userMsg, allServers);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `${result.reasoning} \n\nI recommend switching to the **${allServers.find(s => s.id === result.serverId)?.name}** server.` 
        }]);
        // Allow user to click the recommendation in a future enhancement, for now we just show it.
      } else {
        // General query handled by the briefing logic style
        const response = await getSecurityBriefing(userMsg, currentServer);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble processing that right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col gap-6 relative">
      <AnimatePresence>
        {userTier === 'free' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-[2rem] border border-white/5"
          >
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] mb-8">
              <Bot className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tight text-center">Nova AI Assistant</h2>
            <p className="text-gray-400 text-center max-w-md mb-10 font-light leading-relaxed">
              Get personalized security briefings, server recommendations, and real-time threat analysis with our Premium AI Assistant.
            </p>
            <button 
              onClick={onUpgrade}
              className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-medium text-lg hover:bg-gray-200 transition-colors shadow-xl hover:scale-105 transform duration-300"
            >
              <Crown className="w-5 h-5" />
              Upgrade to Unlock
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex-1 overflow-y-auto space-y-6 pr-2 ${userTier === 'free' ? 'opacity-20 pointer-events-none' : ''}`}>
        {/* Threat Analysis Alerts */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Active Threat Analysis</p>
              {alerts.map((alert, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className={`border rounded-3xl p-5 flex items-start gap-4 shadow-lg backdrop-blur-md ${
                    alert.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20' :
                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-indigo-500/10 border-indigo-500/20'
                  }`}
                >
                  {alert.type === 'danger' ? <AlertTriangle className="w-6 h-6 text-rose-400 mt-0.5 shrink-0" /> :
                   alert.type === 'warning' ? <AlertCircle className="w-6 h-6 text-yellow-400 mt-0.5 shrink-0" /> :
                   <Info className="w-6 h-6 text-indigo-400 mt-0.5 shrink-0" />}
                  <div>
                    <p className={`text-sm font-medium mb-1 ${
                      alert.type === 'danger' ? 'text-rose-400' :
                      alert.type === 'warning' ? 'text-yellow-400' :
                      'text-indigo-400'
                    }`}>{alert.title}</p>
                    <p className="text-sm text-gray-300 font-light leading-relaxed">{alert.advice}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Tip Banner */}
        <AnimatePresence>
          {tip && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex items-start gap-4 shadow-lg"
            >
              <Sparkles className="w-6 h-6 text-white mt-1 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Security Briefing</p>
                <p className="text-sm text-gray-300 font-light leading-relaxed">{tip}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={i} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                    m.role === 'user' ? 'bg-white text-black' : 'bg-[#111111] border border-white/10 text-white'
                  }`}>
                    {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-5 rounded-3xl text-sm leading-relaxed font-light shadow-lg ${
                    m.role === 'user' ? 'bg-white text-black rounded-tr-sm' : 'bg-[#0A0A0A]/80 backdrop-blur-md border border-white/5 text-gray-200 rounded-tl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-4 items-center text-gray-500 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium tracking-wide">Nova is thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-2 bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ${userTier === 'free' ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="flex gap-2 items-center">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Nova about servers or security tips..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-500 text-white px-6 py-3 font-light outline-none"
            disabled={userTier === 'free'}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim() || userTier === 'free'}
            className="p-3.5 bg-white text-black rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:hover:bg-white shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
