/**
 * API Client for Xebia Voice AI Studio
 * Handles all communication with the FastAPI backend
 */

import axios, { AxiosError } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor for adding auth tokens (future use)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.error('Unauthorized access');
    } else if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// TYPE DEFINITIONS (matching backend schemas - snake_case)
// ============================================================================

export interface BackendAgent {
  id: string;
  name: string;
  description?: string;
  template_id: string;
  system_prompt: string;
  color?: string;
  created_at: string;
  updated_at: string;
  query_count: number;
  document_count: number;
  status: 'active' | 'inactive' | 'draft';
  last_used?: string;
}

export interface BackendDocument {
  id: string;
  agent_id: string;
  filename: string;
  file_size: number;
  chunk_count: number;
  uploaded_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  color: string;
}

export interface SessionStartResponse {
  session_id: string;
  room_name: string;
  token: string;
}

export interface Activity {
  id: string;
  agent_id: string;
  agent_name: string;
  query: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
}

export interface AnalyticsOverview {
  total_agents: number;
  total_queries: number;
  total_documents: number;
  total_sessions: number;
}

// Frontend types (for compatibility with existing store)
export interface Agent {
  id: string;
  name: string;
  description: string;
  template: string;
  templateIcon: string;
  personality: 'professional' | 'friendly' | 'empathetic';
  systemPrompt: string;
  documents: any[];
  integrations: string[];
  queryCount: number;
  lastUsed: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  verbosity: number;
  formality: number;
  languages: string[];
  autoDetectLanguage: boolean;
  voiceId: string;
}

// Template icon mapping
const templateIcons: Record<string, string> = {
  'general': '🤖',
  'project': '🚀',
  'techstack': '⚡',
  'client': '🤝',
};

// Transform backend agent to frontend agent
export function transformAgentFromBackend(backendAgent: BackendAgent): Agent {
  return {
    id: backendAgent.id,
    name: backendAgent.name,
    description: backendAgent.description || '',
    template: backendAgent.template_id, // Map template_id to template
    templateIcon: templateIcons[backendAgent.template_id] || '🤖',
    personality: 'professional', // Default - not stored in backend
    systemPrompt: backendAgent.system_prompt,
    documents: [], // Not included in list response
    integrations: [], // Not stored in backend
    queryCount: backendAgent.query_count,
    lastUsed: backendAgent.last_used ? new Date(backendAgent.last_used).toLocaleString() : 'Never',
    status: backendAgent.status,
    createdAt: backendAgent.created_at,
    verbosity: 50, // UI-only defaults
    formality: 50,
    languages: ['english'],
    autoDetectLanguage: true,
    voiceId: 'alloy',
  };
}

// ============================================================================
// AGENT APIs
// ============================================================================

export const agentsAPI = {
  /**
   * List all agents
   */
  list: async () => {
    const response = await api.get<BackendAgent[]>('/api/agents/list');
    
    // Transform backend agents to frontend format
    const transformedData = response.data.map(transformAgentFromBackend);
    
    return {
      ...response,
      data: transformedData,
    };
  },

  /**
   * Get agent by ID
   */
  get: async (id: string) => {
    const response = await api.get<BackendAgent>(`/api/agents/${id}`);
    return {
      ...response,
      data: transformAgentFromBackend(response.data),
    };
  },

  /**
   * Create new agent
   */
  create: async (data: {
    name: string;
    template_id: string;
    description?: string;
    system_prompt?: string;
  }) => {
    const response = await api.post<BackendAgent>('/api/agents/create', data);
    return {
      ...response,
      data: transformAgentFromBackend(response.data),
    };
  },

  /**
   * Update agent
   */
  update: (id: string, data: {
    name?: string;
    description?: string;
    system_prompt?: string;
  }) => api.put(`/api/agents/${id}`, data),

  /**
   * Delete agent
   */
  delete: (id: string) => api.delete(`/api/agents/${id}`),

  /**
   * Upload document to agent
   */
  uploadDocument: (id: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(`/api/agents/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  /**
   * Get documents for agent
   */
  getDocuments: (id: string) => api.get(`/api/agents/${id}/documents`),

  /**
   * Delete document
   */
  deleteDocument: (docId: string) => api.delete(`/api/documents/${docId}`),
};

// ============================================================================
// SESSION APIs
// ============================================================================

export const sessionsAPI = {
  /**
   * Start a new session
   */
  start: (agentId: string) => 
    api.post('/api/sessions/start', { agent_id: agentId }),

  /**
   * End a session
   */
  end: (sessionId: string) => 
    api.post(`/api/sessions/${sessionId}/end`),

  /**
   * Query session (manual RAG test)
   */
  query: (sessionId: string, question: string) =>
    api.post(`/api/sessions/${sessionId}/query`, { question }),

  /**
   * Get recent activities
   */
  getRecent: (limit = 20) => 
    api.get(`/api/sessions/recent`, { params: { limit } }),
};

// ============================================================================
// ANALYTICS APIs
// ============================================================================

export const analyticsAPI = {
  /**
   * Get platform overview analytics
   */
  overview: () => api.get('/api/analytics/overview'),

  /**
   * Get agent-specific analytics
   */
  agent: (agentId: string) => api.get(`/api/analytics/agents/${agentId}`),
};

// ============================================================================
// TEMPLATE APIs
// ============================================================================

export const templatesAPI = {
  /**
   * List all agent templates
   */
  list: () => api.get('/api/agents/templates'),
};

// Export the axios instance for custom requests
export default api;
