
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed' | 'reconnecting';
export type UserTier = 'free' | 'premium';

export interface Server {
  id: string;
  name: string;
  country: string;
  flag: string;
  latency: number;
  load: number;
  region: 'Americas' | 'Europe' | 'Asia' | 'Africa';
  isPremium?: boolean;
}

export interface SecurityAlert {
  id: string;
  type: 'info' | 'warning' | 'danger';
  message: string;
  timestamp: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
