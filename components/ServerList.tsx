
import React, { useState, useMemo } from 'react';
import { Server, UserTier } from '../types';
import { Search, X, Zap, Globe2, Power, SlidersHorizontal, Sparkles, Crown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  servers: Server[];
  selectedId: string;
  userTier: UserTier;
  onUpgrade: () => void;
  onSelect: (server: Server) => void;
  onConnect: (server: Server) => void;
}

type SortOption = 'latency-asc' | 'latency-desc' | 'load-asc' | 'load-desc' | 'default';

const getSignalQuality = (latency: number, load: number) => {
  if (latency < 60 && load < 40) return { bars: 4, color: 'text-emerald-500', bgColor: 'bg-emerald-500', label: 'Excellent' };
  if (latency < 120 && load < 70) return { bars: 3, color: 'text-yellow-500', bgColor: 'bg-yellow-500', label: 'Good' };
  if (latency < 200 && load < 90) return { bars: 2, color: 'text-orange-500', bgColor: 'bg-orange-500', label: 'Fair' };
  return { bars: 1, color: 'text-rose-500', bgColor: 'bg-rose-500', label: 'Poor' };
};

const SignalIndicator: React.FC<{ latency: number; load: number }> = ({ latency, load }) => {
  const quality = getSignalQuality(latency, load);
  
  return (
    <div className="flex flex-col items-center gap-1 min-w-[48px]">
      <div className="flex items-end gap-[2px] h-4 w-6">
        {[1, 2, 3, 4].map((bar) => (
          <div 
            key={bar}
            className={`w-1 rounded-t-sm transition-all duration-300 ${
              bar <= quality.bars ? quality.bgColor : 'bg-white/10'
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
      <span className={`text-[8px] font-bold uppercase tracking-tighter ${quality.color}`}>
        {quality.label}
      </span>
    </div>
  );
};

export const ServerList: React.FC<Props> = ({ servers, selectedId, userTier, onUpgrade, onSelect, onConnect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Find the "best" server for Quick Connect
  const bestServer = useMemo(() => {
    if (servers.length === 0) return null;
    const availableServers = userTier === 'premium' ? servers : servers.filter(s => !s.isPremium);
    return [...availableServers].sort((a, b) => {
      const scoreA = (a.latency * 0.6) + (a.load * 0.4);
      const scoreB = (b.latency * 0.6) + (b.load * 0.4);
      return scoreA - scoreB;
    })[0];
  }, [servers, userTier]);

  const processedServers = useMemo(() => {
    let result = servers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = activeRegion === 'All' || s.region === activeRegion;
      return matchesSearch && matchesRegion;
    });

    switch (sortBy) {
      case 'latency-asc':
        result.sort((a, b) => a.latency - b.latency);
        break;
      case 'latency-desc':
        result.sort((a, b) => b.latency - a.latency);
        break;
      case 'load-asc':
        result.sort((a, b) => a.load - b.load);
        break;
      case 'load-desc':
        result.sort((a, b) => b.load - a.load);
        break;
      default:
        break;
    }

    return result;
  }, [servers, searchTerm, activeRegion, sortBy]);

  const regions = ['All', 'Americas', 'Europe', 'Asia', 'Africa'];

  const handleQuickConnect = () => {
    if (bestServer) {
      onConnect(bestServer);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Quick Connect Hero */}
      <AnimatePresence>
        {bestServer && !searchTerm && activeRegion === 'All' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            onClick={handleQuickConnect}
            className="group relative bg-[#0A0A0A]/60 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 md:p-10 cursor-pointer overflow-hidden transition-all duration-500 hover:border-white/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
          >
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Optimal Route</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-3 tracking-tight">Quick Connect</h3>
                <p className="text-gray-400 text-sm md:text-base max-w-sm font-light">
                  Instantly secure your traffic via our most optimal server in <span className="font-medium text-white">{bestServer.name}</span>.
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-8 bg-black/50 backdrop-blur-md rounded-2xl p-5 px-8 border border-white/5">
                  <div className="flex flex-col items-center">
                    <div className="text-white font-mono text-xl font-medium">{bestServer.latency}ms</div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1">Latency</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex flex-col items-center">
                    <div className="text-white font-mono text-xl font-medium">{bestServer.load}%</div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1">Load</div>
                  </div>
                </div>
                
                <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-300">
                  <Power className="w-5 h-5" />
                  Connect Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-1">Global Network</h2>
          <p className="text-gray-400 text-sm font-light">Choose from 6,500+ ultra-fast servers</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {regions.map(r => (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  activeRegion === r ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="relative flex items-center gap-2 bg-transparent border border-white/10 rounded-full px-4 py-2 hover:border-white/30 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-medium text-gray-300 focus:outline-none cursor-pointer pr-2 appearance-none"
            >
              <option value="default" className="bg-[#0A0A0A]">Sort: Recommended</option>
              <option value="latency-asc" className="bg-[#0A0A0A]">Latency: Low to High</option>
              <option value="latency-desc" className="bg-[#0A0A0A]">Latency: High to Low</option>
              <option value="load-asc" className="bg-[#0A0A0A]">Load: Low to High</option>
              <option value="load-desc" className="bg-[#0A0A0A]">Load: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Input Container */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
        <input 
          type="text"
          placeholder="Search by city or country..."
          className="w-full bg-[#0A0A0A]/60 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-14 pr-12 focus:outline-none focus:border-white/30 transition-all text-white font-light placeholder:text-gray-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <AnimatePresence>
          {searchTerm && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearchTerm('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Servers Grid or Empty State */}
      {processedServers.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {processedServers.map(server => {
              const isLocked = server.isPremium && userTier === 'free';
              
              return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={server.id}
                onClick={() => {
                  if (isLocked) {
                    onUpgrade();
                  } else {
                    onSelect(server);
                  }
                }}
                className={`flex items-center gap-5 p-6 rounded-3xl border transition-all text-left cursor-pointer group relative overflow-hidden ${
                  selectedId === server.id 
                    ? 'bg-white/5 border-white/30 ring-1 ring-white/10 backdrop-blur-md' 
                    : isLocked
                      ? 'bg-[#0A0A0A]/40 backdrop-blur-md border-white/5 hover:border-white/10 opacity-60'
                      : 'bg-[#0A0A0A]/60 backdrop-blur-md border-white/5 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <span className="text-4xl filter drop-shadow-md grayscale group-hover:grayscale-0 transition-all duration-500">
                  {server.flag}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className={`font-display font-medium tracking-tight text-lg transition-colors ${selectedId === server.id ? 'text-white' : 'text-gray-200'}`}>
                      {server.name}
                    </h4>
                    {server.isPremium && (
                      <Crown className={`w-3.5 h-3.5 ${isLocked ? 'text-gray-600' : 'text-yellow-500'}`} />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-light">{server.country}</p>
                </div>
                
                <div className="flex items-center gap-6 md:gap-8">
                  <SignalIndicator latency={server.latency} load={server.load} />
                  
                  <div className="flex flex-col items-end gap-1.5 hidden sm:flex">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-gray-300">
                      <Zap className="w-3 h-3 text-yellow-500" /> {server.latency}ms
                    </div>
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${server.load > 80 ? 'bg-rose-500' : server.load > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${server.load}%` }}
                      />
                    </div>
                  </div>

                  {isLocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpgrade();
                      }}
                      className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                      title="Premium Server - Upgrade to Connect"
                    >
                      <Lock className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onConnect(server);
                      }}
                      className={`p-3.5 rounded-2xl transition-all duration-300 shadow-lg active:scale-95 ${
                        selectedId === server.id 
                          ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                          : 'bg-[#111111] text-white border border-white/10 group-hover:bg-white group-hover:text-black group-hover:border-transparent'
                      }`}
                      title="Connect Now"
                    >
                      <Power className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )})}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 bg-[#0A0A0A]/60 backdrop-blur-md border border-dashed border-white/10 rounded-3xl text-center"
        >
          <div className="p-5 bg-[#111111] border border-white/5 rounded-full mb-6">
            <Globe2 className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-display font-medium tracking-tight text-white mb-2">No servers found</h3>
          <p className="text-sm text-gray-400 max-w-xs px-4 font-light">
            We couldn't find any servers matching your search or filters.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setActiveRegion('All'); setSortBy('default'); }}
            className="mt-8 px-6 py-2.5 rounded-full border border-white/10 text-sm font-medium text-gray-300 hover:bg-white hover:text-black transition-all"
          >
            Reset all filters
          </button>
        </motion.div>
      )}
    </div>
  );
};
