import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Agent {
  id: string;
  name: string;
  description: string;
  template: string;
  templateIcon: string;
  personality: 'professional' | 'friendly' | 'empathetic';
  systemPrompt: string;
  documents: Document[];
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

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'processing' | 'ready' | 'error';
  uploadedAt: string;
  agentIds: string[];
}

export interface Activity {
  id: string;
  agentId: string;
  agentName: string;
  query: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AppState {
  user: User | null;
  agents: Agent[];
  documents: Document[];
  activities: Activity[];
  usageStats: {
    agentsUsed: number;
    agentsLimit: number;
    queriesUsed: number;
    queriesLimit: number;
  };
  setUser: (user: User | null) => void;
  setAgents: (agents: Agent[]) => void;  // NEW: Replace all agents
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  setActivities: (activities: Activity[]) => void;  // NEW: Replace all activities
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;
  addActivity: (activity: Activity) => void;
}

// Mock data
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Project Onboarding Bot',
    description: 'Helps new team members get up to speed with project context',
    template: 'Project Onboarding',  // Display name stays same
    templateIcon: '🚀',
    personality: 'friendly',
    systemPrompt: 'You are a helpful onboarding assistant...',
    documents: [],
    integrations: ['zoho'],
    queryCount: 156,
    lastUsed: '2 hours ago',
    status: 'active',
    createdAt: '2024-01-15',
    verbosity: 70,
    formality: 50,
    languages: ['english'],
    autoDetectLanguage: true,
    voiceId: 'alloy',
  },
  {
    id: '2',
    name: 'Tech Stack Assistant',
    description: 'Provides guidance on approved technologies and best practices',
    template: 'Tech Stack Guide',
    templateIcon: '⚡',
    personality: 'professional',
    systemPrompt: 'You are a technical advisor...',
    documents: [],
    integrations: [],
    queryCount: 89,
    lastUsed: '1 day ago',
    status: 'active',
    createdAt: '2024-01-10',
    verbosity: 40,
    formality: 80,
    languages: ['english', 'hindi'],
    autoDetectLanguage: false,
    voiceId: 'echo',
  },
  {
    id: '3',
    name: 'Client Context Helper',
    description: 'Answers questions about client requirements and history',
    template: 'Client Context',
    templateIcon: '🤝',
    personality: 'empathetic',
    systemPrompt: 'You are a client relationship expert...',
    documents: [],
    integrations: ['zoho', 'ticketing'],
    queryCount: 234,
    lastUsed: '5 mins ago',
    status: 'active',
    createdAt: '2024-01-05',
    verbosity: 60,
    formality: 60,
    languages: ['english', 'tamil', 'telugu'],
    autoDetectLanguage: true,
    voiceId: 'nova',
  },
];

const mockActivities: Activity[] = [
  { id: '1', agentId: '3', agentName: 'Client Context Helper', query: 'What are the key deliverables for Project Alpha?', status: 'success', timestamp: '5 mins ago' },
  { id: '2', agentId: '1', agentName: 'Project Onboarding Bot', query: 'How do I set up the development environment?', status: 'success', timestamp: '1 hour ago' },
  { id: '3', agentId: '2', agentName: 'Tech Stack Assistant', query: 'Is React 19 approved for use?', status: 'success', timestamp: '2 hours ago' },
  { id: '4', agentId: '1', agentName: 'Project Onboarding Bot', query: 'Who should I contact for code reviews?', status: 'success', timestamp: '3 hours ago' },
  { id: '5', agentId: '3', agentName: 'Client Context Helper', query: 'What is the client\'s preferred communication style?', status: 'pending', timestamp: '4 hours ago' },
];

const mockDocuments: Document[] = [
  { id: '1', name: 'Project Guidelines.pdf', type: 'pdf', size: 2400000, status: 'ready', uploadedAt: '2024-01-15', agentIds: ['1'] },
  { id: '2', name: 'Tech Stack Policy.docx', type: 'docx', size: 1200000, status: 'ready', uploadedAt: '2024-01-10', agentIds: ['2'] },
  { id: '3', name: 'Client Brief.pdf', type: 'pdf', size: 3600000, status: 'ready', uploadedAt: '2024-01-05', agentIds: ['3'] },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: {
        id: '1',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@xebia.com',
        avatar: '',
      },
      agents: [], // Start with empty array - will be populated by API
      documents: [],
      activities: [],
      usageStats: {
        agentsUsed: 0,
        agentsLimit: 10,
        queriesUsed: 0,
        queriesLimit: 1000,
      },
      setUser: (user) => set({ user }),
      setAgents: (agents) => set((state) => ({ 
        agents, 
        usageStats: { ...state.usageStats, agentsUsed: agents?.length || 0 } 
      })),
      addAgent: (agent) => set((state) => ({ 
        agents: [...state.agents, agent],
        usageStats: { ...state.usageStats, agentsUsed: state.usageStats.agentsUsed + 1 }
      })),
      updateAgent: (id, updates) => set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),
      deleteAgent: (id) => set((state) => ({ 
        agents: state.agents.filter((a) => a.id !== id),
        usageStats: { ...state.usageStats, agentsUsed: state.usageStats.agentsUsed - 1 }
      })),
      setActivities: (activities) => set({ activities }),  // NEW
      addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
      removeDocument: (id) => set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),
      addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities].slice(0, 20) })),
    }),
    { 
      name: 'xebia-voice-ai-store',
      version: 1, // Added version to invalidate old persisted data
    }
  )
);
