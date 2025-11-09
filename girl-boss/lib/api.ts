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
}

export interface ChatResponse {
  message: string;
  timestamp: string;
}

// send a message and get AI response
export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  return apiRequest<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

export interface SafeSpace {
  name: string;
  type: 'police' | 'hospital' | 'fire_station' | 'cafe';
  distance: number;
  coordinates: { lat: number; lon: number };
  isOpen: boolean;
}

// find safe places nearby - like police stations and stuff
export const findSafeSpaces = async (
  lat: number,
  lon: number,
  radius?: number
): Promise<{ spaces: SafeSpace[]; count: number }> => {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    ...(radius && { radius: radius.toString() }),
  });

  return apiRequest<{ spaces: SafeSpace[]; count: number }>(
    `/api/chat/safe-spaces?${params}`
  );
};

export const getSafetyAdvice = async (
  location: string,
  timeOfDay?: string,
  transportMode?: string
): Promise<{ advice: string }> => {
  return apiRequest<{ advice: string }>('/api/chat/safety-advice', {
    method: 'POST',
    body: JSON.stringify({ location, timeOfDay, transportMode }),
  });
};

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
// EMERGENCY API
// ==========================================

export interface EmergencyRequest {
  userId: string;
  tripId?: string;
  lat: number;
  lon: number;
  message?: string;
}

export const triggerEmergency = async (request: EmergencyRequest): Promise<{
  success: boolean;
  notifications: any;
  safeSpaces: SafeSpace[];
}> => {
  return apiRequest('/api/emergency/trigger', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

export const getEmergencySafeSpaces = async (
  lat: number,
  lon: number
): Promise<{ spaces: SafeSpace[]; emergencyMode: boolean }> => {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  return apiRequest(`/api/emergency/safe-spaces?${params}`);
};

// ==========================================
// HEALTH CHECK
// ==========================================

export const checkHealth = async (): Promise<{ status: string; message: string }> => {
  return apiRequest('/health');
};
