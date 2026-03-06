
import React, { useState } from 'react';
import { ConnectionStatus, Server } from '../types';
import { Power, ShieldCheck, MapPin, Zap, ArrowDown, ArrowUp, AlertCircle, RefreshCw, Sparkles, Globe } from 'lucide-react';
import { Stats } from './Stats';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  status: ConnectionStatus;
  onToggle: () => void;
  server: Server;
  onSelectServer: () => void;
  errorMessage?: string | null;
  onSimulateInterruption?: () => void;
  onAILoadBalance?: (region: string) => void;
  isAILoading?: boolean;
}

export const VpnDashboard: React.FC<Props> = ({ status, onToggle, server, onSelectServer, errorMessage, onSimulateInterruption, onAILoadBalance, isAILoading }) => {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'reconnecting' || isAILoading;
  const isFailed = status === 'failed';
  const [preferredRegion, setPreferredRegion] = useState('All');
  const regions = ['All', 'Americas', 'Europe', 'Asia', 'Africa'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Error Message Alert */}
      <AnimatePresence>
        {isFailed && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-4 overflow-hidden"
          >
            <div className="p-3 bg-rose-500/20 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-sm font-bold text-rose-400">Connection Failed</h4>
              <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                {errorMessage || "An unexpected error occurred while securing your connection."}
              </p>
            </div>
            <button 
              onClick={onToggle}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20 active:scale-95 whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Connect Panel */}
        <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Background decoration */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isConnected ? 'opacity-20' : 'opacity-0'}`}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-[120px]" />
          </div>
          
          <AnimatePresence>
            {isFailed && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0"
               >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500 rounded-full blur-[120px]" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-10 text-center">
              <h2 className={`text-3xl font-display font-bold tracking-tight mb-2 transition-colors duration-500 ${isFailed ? 'text-rose-400' : ''}`}>
                {isAILoading ? 'AI Analyzing Routes...' : status === 'reconnecting' ? 'Reconnecting...' : isConnecting ? 'Establishing Tunnel...' : isConnected ? 'Your Tunnel is Secure' : isFailed ? 'Connection Blocked' : 'Protected Connection'}
              </h2>
              <p className="text-gray-400 text-sm font-light">
                {isAILoading ? 'Finding the least congested server' : isConnected ? `Locked with AES-256-GCM` : isFailed ? 'Please resolve the error above' : status === 'reconnecting' ? 'Attempting to restore connection' : 'Tap to secure your web traffic'}
              </p>
            </div>

            <button 
              onClick={onToggle}
              disabled={isConnecting}
              className={`group relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 transform ${
                isConnected 
                  ? 'bg-white shadow-[0_0_60px_rgba(255,255,255,0.3)] scale-105' 
                  : isFailed 
                  ? 'bg-rose-600/10 border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.1)]'
                  : 'bg-[#111111] border border-white/10 hover:border-white/30'
              } ${isConnecting ? 'animate-pulse' : ''}`}
            >
              {isConnecting && (
                <div className="absolute inset-0 rounded-full border border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin opacity-50" />
              )}
              <Power className={`w-12 h-12 transition-colors duration-500 ${isConnected ? 'text-black' : isFailed ? 'text-rose-400' : 'text-gray-600 group-hover:text-white'}`} />
            </button>

            <div className="mt-12 flex items-center gap-3 bg-[#111111] px-5 py-2.5 rounded-full border border-white/5 shadow-inner">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : isConnecting ? 'bg-yellow-500' : isFailed ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-gray-600'}`} />
              <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-500 ${isFailed ? 'text-rose-400' : 'text-gray-400'}`}>
                {isAILoading ? 'AI_ROUTING' : status}
              </span>
            </div>
          </div>
        </div>

        {/* Server Selection Card */}
        <div className="space-y-6">
          {/* AI Load Balancer Card */}
          <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Load Balancer</span>
              </div>
              <h3 className="text-xl font-display font-medium tracking-tight text-white mb-2">Smart Routing</h3>
              <p className="text-sm text-gray-400 font-light mb-5">Automatically connect to the least congested server in your preferred region.</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select 
                    value={preferredRegion}
                    onChange={(e) => setPreferredRegion(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                    disabled={isConnecting || isConnected}
                  >
                    {regions.map(r => <option key={r} value={r}>{r === 'All' ? 'Global (Best Available)' : r}</option>)}
                  </select>
                </div>
                <button 
                  onClick={() => onAILoadBalance && onAILoadBalance(preferredRegion)}
                  disabled={isConnecting || isConnected}
                  className="bg-white text-black px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:hover:bg-white whitespace-nowrap shadow-lg"
                >
                  Auto-Connect
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Location</span>
              <button onClick={onSelectServer} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Change Server</button>
            </div>
            
            <div className="flex items-center gap-5">
              <div className="text-4xl filter drop-shadow-md">{server.flag}</div>
              <div className="flex-1">
                <h3 className="text-xl font-display font-medium tracking-tight">{server.name}</h3>
                <p className="text-sm text-gray-400 font-light">{server.country} &bull; {server.region}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-white font-mono bg-white/5 px-2 py-1 rounded-md">
                  <Zap className="w-3 h-3 text-yellow-500" /> {server.latency}ms
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#111111] rounded-xl border border-white/5"><ShieldCheck className="w-4 h-4 text-gray-400" /></div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Protocol</div>
                  <div className="text-xs font-medium font-mono text-gray-300">WireGuard v2</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#111111] rounded-xl border border-white/5"><MapPin className="w-4 h-4 text-gray-400" /></div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">External IP</div>
                  <div className="text-xs font-medium font-mono text-gray-300 truncate max-w-[80px]">
                    {isConnected ? '45.12.98.1' : 'Hidden'}
                  </div>
                </div>
              </div>
            </div>

            {isConnected && onSimulateInterruption && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <button
                  onClick={onSimulateInterruption}
                  className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Simulate Connection Drop
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data Usage</span>
              <div className="flex gap-4">
                <div className={`flex items-center gap-1.5 text-emerald-400 text-xs font-mono transition-opacity ${isConnected ? 'opacity-100' : 'opacity-30'}`}><ArrowDown className="w-3 h-3"/> 2.4 Mb/s</div>
                <div className={`flex items-center gap-1.5 text-gray-300 text-xs font-mono transition-opacity ${isConnected ? 'opacity-100' : 'opacity-30'}`}><ArrowUp className="w-3 h-3"/> 1.1 Mb/s</div>
              </div>
            </div>
            <div className="h-32 w-full">
              <Stats active={isConnected} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
