
import React, { useState, useEffect, useMemo } from 'react';
import { VpnDashboard } from './components/VpnDashboard';
import { ServerList } from './components/ServerList';
import { SecurityAssistant } from './components/SecurityAssistant';
import { ConnectionStatus, Server, UserTier } from './types';
import { Shield, Globe, Activity, Lock, ChevronRight, Menu, X, Crown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { getAILoadBalancedServer } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

const SERVERS: Server[] = [
  // Americas
  { id: 'us-east', name: 'New York', country: 'USA', flag: '🇺🇸', latency: 42, load: 65, region: 'Americas' },
  { id: 'us-west-la', name: 'Los Angeles', country: 'USA', flag: '🇺🇸', latency: 85, load: 42, region: 'Americas', isPremium: true },
  { id: 'us-west-sea', name: 'Seattle', country: 'USA', flag: '🇺🇸', latency: 92, load: 38, region: 'Americas', isPremium: true },
  { id: 'ca-tor', name: 'Toronto', country: 'Canada', flag: '🇨🇦', latency: 55, load: 55, region: 'Americas' },
  { id: 'br-sao', name: 'São Paulo', country: 'Brazil', flag: '🇧🇷', latency: 145, load: 28, region: 'Americas', isPremium: true },
  { id: 'mx-mex', name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', latency: 110, load: 48, region: 'Americas' },
  
  // Europe
  { id: 'uk-lon', name: 'London', country: 'UK', flag: '🇬🇧', latency: 12, load: 30, region: 'Europe' },
  { id: 'de-fra', name: 'Frankfurt', country: 'Germany', flag: '🇩🇪', latency: 18, load: 45, region: 'Europe' },
  { id: 'fr-par', name: 'Paris', country: 'France', flag: '🇫🇷', latency: 22, load: 52, region: 'Europe', isPremium: true },
  { id: 'nl-ams', name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', latency: 15, load: 60, region: 'Europe' },
  { id: 'se-sto', name: 'Stockholm', country: 'Sweden', flag: '🇸🇪', latency: 35, load: 22, region: 'Europe', isPremium: true },
  { id: 'es-mad', name: 'Madrid', country: 'Spain', flag: '🇪🇸', latency: 45, load: 35, region: 'Europe' },
  
  // Asia
  { id: 'jp-tok', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', latency: 156, load: 85, region: 'Asia', isPremium: true },
  { id: 'sg-sin', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', latency: 198, load: 20, region: 'Asia' },
  { id: 'kr-seo', name: 'Seoul', country: 'South Korea', flag: '🇰🇷', latency: 165, load: 40, region: 'Asia', isPremium: true },
  { id: 'in-mum', name: 'Mumbai', country: 'India', flag: '🇮🇳', latency: 210, load: 55, region: 'Asia' },
  { id: 'hk-hkg', name: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', latency: 185, load: 72, region: 'Asia', isPremium: true },

  // Africa
  { id: 'za-jnb', name: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', latency: 280, load: 15, region: 'Africa' },
  { id: 'ke-nbo', name: 'Nairobi', country: 'Kenya', flag: '🇰🇪', latency: 310, load: 12, region: 'Africa', isPremium: true },
  { id: 'ng-los', name: 'Lagos', country: 'Nigeria', flag: '🇳🇬', latency: 295, load: 18, region: 'Africa' },
];

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server>(SERVERS[6]); // London as default
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'servers' | 'ai'>('dashboard');
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'success' | 'error'} | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);

  // Automatic Reconnection Logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (status === 'failed' && reconnectAttempts < 2) {
      setNotification({ message: `Connection interrupted. Attempting to reconnect (${reconnectAttempts + 1}/2)...`, type: 'info' });
      
      timeoutId = setTimeout(() => {
        setStatus('reconnecting');
        setErrorMessage(null);
        
        // Find best available server to reconnect to
        const availableServers = userTier === 'premium' ? SERVERS : SERVERS.filter(s => !s.isPremium);
        const bestServer = [...availableServers].sort((a, b) => {
          const scoreA = (a.latency * 0.6) + (a.load * 0.4);
          const scoreB = (b.latency * 0.6) + (b.load * 0.4);
          return scoreA - scoreB;
        })[0];

        setSelectedServer(bestServer);
        
        // Simulate reconnection
        setTimeout(() => {
          if (Math.random() > 0.7) { // 30% chance to fail again
            setStatus('failed');
            setReconnectAttempts(prev => prev + 1);
            if (reconnectAttempts + 1 >= 2) {
              setNotification({ message: 'Automatic reconnection failed. Please try manually.', type: 'error' });
              setTimeout(() => setNotification(null), 5000);
            }
          } else {
            setStatus('connected');
            setReconnectAttempts(0);
            setNotification({ message: `Successfully reconnected to ${bestServer.name}`, type: 'success' });
            setTimeout(() => setNotification(null), 4000);
          }
        }, 1500);

      }, 2000); // Wait 2 seconds before attempting to reconnect
    }

    return () => clearTimeout(timeoutId);
  }, [status, reconnectAttempts, userTier]);

  const toggleConnection = () => {
    if (status === 'connected' || status === 'failed') {
      setStatus('disconnected');
      setErrorMessage(null);
      setReconnectAttempts(0);
      setNotification(null);
    } else if (status === 'disconnected') {
      setStatus('connecting');
      setErrorMessage(null);
      setReconnectAttempts(0);
      setNotification(null);
      
      // Simulate connection logic with potential failure
      setTimeout(() => {
        // 10% failure chance for demonstration (reduced from 20 for better UX with many servers)
        if (Math.random() > 0.9) {
          setStatus('failed');
          setErrorMessage("Protocol Handshake Failed: The remote server timed out. Please try a different location or check your firewall.");
        } else {
          setStatus('connected');
        }
      }, 2000);
    }
  };

  const startConnection = (s: Server) => {
    setSelectedServer(s);
    setErrorMessage(null);
    setStatus('connecting');
    setActiveTab('dashboard');
    setReconnectAttempts(0);
    setNotification(null);
    
    setTimeout(() => {
      if (Math.random() > 0.95) { // Even lower failure chance for direct server selection
        setStatus('failed');
        setErrorMessage(`Unable to establish tunnel to ${s.name}. Peer did not respond to initiation packets.`);
      } else {
        setStatus('connected');
      }
    }, 1200);
  };

  const handleAILoadBalance = async (region: string) => {
    setIsAILoading(true);
    setStatus('disconnected');
    setErrorMessage(null);
    
    const availableServers = userTier === 'premium' ? SERVERS : SERVERS.filter(s => !s.isPremium);
    const result = await getAILoadBalancedServer(availableServers, region);
    
    if (result && result.serverId) {
      const server = SERVERS.find(s => s.id === result.serverId);
      if (server) {
        setSelectedServer(server);
        setNotification({ message: `AI Selected ${server.name}: ${result.reasoning}`, type: 'success' });
        
        // Auto connect after finding
        setStatus('connecting');
        setTimeout(() => {
          setStatus('connected');
          setIsAILoading(false);
        }, 1500);
        return;
      }
    }
    
    setIsAILoading(false);
    setNotification({ message: 'AI load balancing failed to find an optimal route.', type: 'error' });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050505] text-white selection:bg-indigo-500/30 font-sans">
      {/* Sidebar Navigation */}
      <nav className={`${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 w-64 h-full bg-[#0A0A0A]/80 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 flex flex-col`}>
        <div className="p-6 flex items-center gap-3 mb-4">
          <div className="bg-white text-black p-2 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">NovaVPN</h1>
        </div>

        <div className="px-4 space-y-2 flex-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} 
            icon={<Activity className="w-4 h-4" />} 
            label="Dashboard" 
          />
          <NavItem 
            active={activeTab === 'servers'} 
            onClick={() => { setActiveTab('servers'); setIsMenuOpen(false); }} 
            icon={<Globe className="w-4 h-4" />} 
            label="Servers" 
          />
          <NavItem 
            active={activeTab === 'ai'} 
            onClick={() => { setActiveTab('ai'); setIsMenuOpen(false); }} 
            icon={<Lock className="w-4 h-4" />} 
            label="AI Assistant" 
          />
        </div>

        <div className="p-6">
          <div className="bg-[#111111] rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-200">{userTier === 'premium' ? 'Premium Ultra' : 'Free Tier'}</p>
              {userTier === 'premium' && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
            </div>
            {userTier === 'free' ? (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="mt-4 w-full py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-gray-200 transition-all shadow-lg"
              >
                Upgrade to Premium
              </button>
            ) : (
              <div 
                onClick={() => setUserTier('free')}
                className="mt-4 flex items-center text-gray-400 text-xs font-medium cursor-pointer hover:text-white transition-colors"
              >
                Manage Subscription <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Atmospheric Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        {/* Header (Mobile Only) */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 relative z-40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span className="font-display font-bold text-lg">NovaVPN</span>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          {/* Notification Toast */}
          <AnimatePresence>
            {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className={`absolute top-4 left-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md ${
                  notification.type === 'info' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300' :
                  notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' :
                  'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}
              >
                {notification.type === 'info' && <Info className="w-5 h-5" />}
                {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {notification.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                <span className="text-sm font-medium">{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <VpnDashboard 
                  status={status} 
                  onToggle={toggleConnection} 
                  server={selectedServer}
                  onSelectServer={() => setActiveTab('servers')}
                  errorMessage={errorMessage}
                  onSimulateInterruption={() => {
                    setStatus('failed');
                    setErrorMessage("Connection unexpectedly dropped by the remote host.");
                    setReconnectAttempts(0);
                  }}
                  onAILoadBalance={handleAILoadBalance}
                  isAILoading={isAILoading}
                />
              )}
              {activeTab === 'servers' && (
                <ServerList 
                  servers={SERVERS} 
                  selectedId={selectedServer.id} 
                  userTier={userTier}
                  onUpgrade={() => setShowUpgradeModal(true)}
                  onSelect={(s) => {
                    setSelectedServer(s);
                    setActiveTab('dashboard');
                  }}
                  onConnect={startConnection}
                />
              )}
              {activeTab === 'ai' && (
                <SecurityAssistant 
                  currentStatus={status} 
                  currentServer={selectedServer} 
                  userTier={userTier}
                  onUpgrade={() => setShowUpgradeModal(true)}
                  onServerSelect={(id) => {
                    const s = SERVERS.find(sv => sv.id === id);
                    if (s) {
                      setSelectedServer(s);
                      setActiveTab('dashboard');
                    }
                  }}
                  allServers={SERVERS}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Upgrade Modal */}
        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] max-w-md w-full p-8 relative shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" />
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white rounded-full transition-colors bg-white/5 hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex justify-center mb-6 mt-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                    <Crown className="w-10 h-10 text-black" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-display font-bold text-center mb-3 tracking-tight">Premium Ultra</h2>
                <p className="text-gray-400 text-center text-sm mb-8 font-light leading-relaxed">
                  Unlock the full potential of NovaVPN with our most advanced security features.
                </p>
                
                <div className="space-y-5 mb-10 bg-white/5 rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center gap-4 text-sm text-gray-200">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">✓</div>
                    <span className="font-medium">Access to 6,500+ ultra-fast servers</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-200">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">✓</div>
                    <span className="font-medium">Nova AI Security Assistant</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-200">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">✓</div>
                    <span className="font-medium">Highest speeds & unlimited bandwidth</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setUserTier('premium');
                    setShowUpgradeModal(false);
                  }}
                  className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Upgrade Now - $9.99/mo
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative overflow-hidden ${
        active 
          ? 'text-white font-medium' 
          : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="nav-bg" 
          className="absolute inset-0 bg-white/10 rounded-xl"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10 text-sm">{label}</span>
    </button>
  );
}
