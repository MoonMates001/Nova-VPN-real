
import { GoogleGenAI, Type } from "@google/genai";
import { Server } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAILoadBalancedServer(availableServers: Server[], preferredRegion: string) {
  const filteredServers = preferredRegion === 'All' 
    ? availableServers 
    : availableServers.filter(s => s.region === preferredRegion);

  if (filteredServers.length === 0) return null;

  const serverListStr = filteredServers.map(s => `${s.id}: ${s.name} (Latency: ${s.latency}ms, Load: ${s.load}%)`).join(", ");
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an AI load balancer for a VPN. Analyze this list of servers and select the absolute best one to connect to right now to optimize performance and reduce latency. Consider both latency and load.
    Servers: [${serverListStr}]
    
    Return a JSON object with:
    1. serverId: the ID of the selected server
    2. reasoning: a short 1-sentence explanation of why this server was chosen.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          serverId: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        },
        required: ["serverId", "reasoning"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return null;
  }
}
export async function getServerRecommendation(userQuery: string, availableServers: Server[]) {
  const serverListStr = availableServers.map(s => `${s.name} (${s.region}, Latency: ${s.latency}ms, Load: ${s.load}%)`).join(", ");
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As an AI VPN expert, recommend the best server from this list: [${serverListStr}]. 
    User request: "${userQuery}".
    Return a JSON object with: 
    1. serverId: the ID of the recommended server (must be one of the IDs provided)
    2. reasoning: a brief explanation why.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          serverId: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        },
        required: ["serverId", "reasoning"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function getSecurityBriefing(status: string, server: Server | null) {
  const context = server 
    ? `The user is connected to ${server.name} in ${server.country}.` 
    : "The user is currently disconnected and vulnerable.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide a quick 2-sentence security tip for a VPN user. Context: ${context}`,
    config: {
      systemInstruction: "You are Nova, a specialized security AI for a premium VPN service. Be professional, concise, and helpful."
    }
  });

  return response.text;
}

export async function getThreatAnalysis(status: string, server: Server | null) {
  if (status !== 'connected' || !server) {
    return [];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following VPN connection for potential security risks or anomalies.
    Server: ${server.name} (${server.country}, Region: ${server.region})
    Latency: ${server.latency}ms
    Load: ${server.load}%
    
    Provide a list of 1 to 3 alerts based on this data. If the load is high (>70%), warn about potential speed drops or instability. If latency is high (>150ms), mention it might affect real-time applications. If everything is fine, provide a general 'info' tip about staying secure.
    
    Return a JSON array of objects, each with:
    1. type: 'info', 'warning', or 'danger'
    2. title: A short title for the alert
    3. advice: Actionable advice for the user`,
    config: {
      systemInstruction: "You are Nova, a specialized security AI for a premium VPN service. Be professional, concise, and helpful.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            advice: { type: Type.STRING }
          },
          required: ["type", "title", "advice"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return [];
  }
}
