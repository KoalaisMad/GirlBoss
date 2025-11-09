// API CLIENT - talks to the backend
// basically just a bunch of functions that call our Express server
// i got tired of writing fetch() everywhere so i made this lol

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// this is like a wrapper function so we don't have to repeat ourselves
// handles errors and stuff too
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ==========================================
// PLANNING STUFF - routes and all that
// ==========================================

export interface RouteRequest {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  transportMode?: 'driving' | 'walking' | 'cycling' | 'transit';
  userId?: string;
}

export interface RouteResponse {
  safety: {
    historicalScore: number;
    mlScore: number;
    finalScore: number;
    riskFactors: string[];
    recommendations: string[];
  };
  context: any;
  trip?: string;
  recommendation: 'safe' | 'caution' | 'risky';
}

// get a route with safety info
export const planRoute = async (request: RouteRequest): Promise<RouteResponse> => {
  return apiRequest<RouteResponse>('/api/plan/route', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// ==========================================
// CHATBOT STUFF - for talking to the AI
// ==========================================

export interface ChatRequest {
  message: string;
  userId?: string;
  location?: string;
  lat?: number;
  lon?: number;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
  hasSafeSpaces?: boolean;
}

// send a message and get AI response from safety chatbot
export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  // Use Next.js proxy route instead of direct backend call
  const response = await fetch('/api/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return await response.json();
};

// NOTE: Safe spaces and safety advice are now handled directly by the chatbot
// Just ask the AI in natural language (e.g., "find safe spaces near me")

// ==========================================
// VOICE ASSISTANT API
// ==========================================

export const sendVoiceMessage = async (
  message: string,
  userId?: string
): Promise<{ text: string; timestamp: string }> => {
  return apiRequest('/api/yap', {
    method: 'POST',
    body: JSON.stringify({ message, userId }),
  });
};

export const getVoiceResponse = async (
  message: string,
  userId?: string
): Promise<Blob> => {
  const url = `${API_BASE_URL}/api/yap/voice`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to get voice response');
  }

  return await response.blob();
};

export const startVoiceSession = async (userId?: string): Promise<Blob> => {
  const url = `${API_BASE_URL}/api/yap/start`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to start voice session');
  }

  return await response.blob();
};

// ==========================================
// USER API
// ==========================================

export interface User {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship?: string;
  }>;
  preferences?: any;
}

export const createUser = async (user: Omit<User, '_id'>): Promise<{ userId: string }> => {
  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
};

export const getUser = async (userId: string): Promise<User> => {
  return apiRequest(`/api/users/${userId}`);
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  return apiRequest(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const addEmergencyContact = async (
  userId: string,
  contact: { name: string; phone: string; relationship?: string }
): Promise<{ message: string; contacts: any[] }> => {
  return apiRequest(`/api/users/${userId}/emergency-contacts`, {
    method: 'POST',
    body: JSON.stringify(contact),
  });
};

// ==========================================
// HEALTH CHECK
// ==========================================

export const checkHealth = async (): Promise<{ status: string; message: string }> => {
  return apiRequest('/health');
};
