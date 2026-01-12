import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, Phone, PhoneOff, RotateCcw } from 'lucide-react';
import { Agent } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { LiveKitRoom, useVoiceAssistant, BarVisualizer, RoomAudioRenderer, VoiceAssistantControlBar } from '@livekit/components-react';
import '@livekit/components-styles';
import { sessionsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface VoiceTestModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

// Inner component that uses LiveKit hooks (must be inside LiveKitRoom)
function VoiceAssistantUI({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const { state, audioTrack } = useVoiceAssistant();
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'agent',
    content: `Hello! I'm ${agent.name}. How can I help you today?`,
    timestamp: new Date(),
  }]);

  // Map LiveKit state to our status
  const getStatus = (): Status => {
    if (state === 'connecting') return 'connecting';
    if (state === 'listening') return 'listening';
    if (state === 'thinking') return 'thinking';
    if (state === 'speaking') return 'speaking';
    return 'idle';
  };

  const status = getStatus();
  const isConnected = state !== 'disconnected' && state !== 'connecting';

  // Listen for voice assistant events
  useEffect(() => {
    // In a real implementation, you'd subscribe to LiveKit events to capture
    // user speech and agent responses for the transcript
    // For now, we'll show the initial greeting
  }, [state]);

  const handleReset = () => {
    setMessages([{
      id: '1',
      role: 'agent',
      content: `Hello! I'm ${agent.name}. How can I help you today?`,
      timestamp: new Date(),
    }]);
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-2xl bg-gradient-to-b from-secondary to-sidebar rounded-2xl overflow-hidden shadow-2xl border border-sidebar-border"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl">
            {agent.templateIcon}
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">{agent.name}</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-500'}`} />
              <span className="text-xs text-sidebar-muted capitalize">
                {state}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Interaction Area */}
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
        {/* Visualizer */}
        <div className="relative mb-6">
          {/* Pulse rings when active */}
          {(status === 'listening' || status === 'speaking') && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`absolute inset-0 rounded-full ${status === 'listening' ? 'bg-accent' : 'bg-primary'}`}
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className={`absolute inset-0 rounded-full ${status === 'listening' ? 'bg-accent' : 'bg-primary'}`}
              />
            </>
          )}
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              status === 'listening' ? 'bg-gradient-to-br from-accent to-cyan-400 shadow-glow-lg' :
              status === 'speaking' ? 'bg-gradient-to-br from-primary to-blue-400 shadow-glow' :
              status === 'connecting' || status === 'thinking' ? 'bg-sidebar-accent' :
              'bg-gradient-to-br from-primary to-accent hover:shadow-glow'
            }`}
          >
            {status === 'connecting' || status === 'thinking' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-sidebar-muted border-t-accent rounded-full"
              />
            ) : status === 'speaking' ? (
              <Volume2 className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </motion.div>
        </div>

        {/* LiveKit BarVisualizer */}
        {audioTrack && (status === 'listening' || status === 'speaking') && (
          <div className="mb-4 h-8 w-48">
            <BarVisualizer
              state={status === 'listening' ? 'listening' : 'speaking'}
              trackRef={audioTrack}
              barCount={12}
              options={{ minHeight: 8 }}
            />
          </div>
        )}

        {/* Status Text */}
        <p className="text-sm text-sidebar-muted capitalize">
          {status === 'idle' && 'Ready to chat'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'listening' && 'Listening...'}
          {status === 'thinking' && 'Thinking...'}
          {status === 'speaking' && 'Speaking...'}
        </p>
      </div>

      {/* Transcript Panel */}
      <div className="h-48 overflow-y-auto p-4 border-t border-sidebar-border bg-sidebar/50">
        {messages.length === 0 ? (
          <p className="text-center text-sidebar-muted text-sm py-8">
            Start speaking to begin conversation
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-accent text-secondary rounded-br-md' 
                    : 'bg-sidebar-accent text-sidebar-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-sidebar-border">
        <VoiceAssistantControlBar
          controls={{
            leave: false, // We handle disconnect separately
          }}
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          disabled={!isConnected}
          className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-center gap-6 p-3 bg-sidebar text-xs text-sidebar-muted border-t border-sidebar-border">
        <span>Language: {agent.languages[0] || 'English'}</span>
        <span>Voice: {agent.voiceId}</span>
        <span>Status: {state}</span>
      </div>

      {/* Hidden audio renderer */}
      <RoomAudioRenderer />
    </motion.div>
  );
}

export function VoiceTestModal({ agent, isOpen, onClose }: VoiceTestModalProps) {
  const [connectionDetails, setConnectionDetails] = useState<{
    token: string;
    serverUrl: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Start session when modal opens
  useEffect(() => {
    if (isOpen && agent && !connectionDetails && !isConnecting) {
      handleStartSession();
    }
  }, [isOpen, agent, connectionDetails, isConnecting]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && connectionDetails) {
      handleEndSession();
    }
  }, [isOpen, connectionDetails]);

  const handleStartSession = async () => {
    if (!agent) return;
    
    try {
      setIsConnecting(true);
      
      // LiveKit server URL from env
      const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
      
      // Check if LiveKit is configured
      if (serverUrl.includes('your-project.livekit.cloud')) {
        toast.error('LiveKit Cloud not configured! Please add credentials to .env file.', {
          duration: 5000,
        });
        console.error('LiveKit URL not configured. Please set VITE_LIVEKIT_URL in .env file.');
        setIsConnecting(false);
        return;
      }
      
      console.log('Starting voice session for agent:', agent.id);
      const response = await sessionsAPI.start(agent.id);
      const { token, room_name } = response.data;
      
      console.log('Session started successfully:', { room_name, serverUrl });
      
      setConnectionDetails({
        token,
        serverUrl,
      });
      
      toast.success('Voice session started');
    } catch (error: any) {
      console.error('Failed to start voice session:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error';
      toast.error(`Failed to start voice session: ${errorMessage}`, {
        duration: 5000,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEndSession = async () => {
    // The session will be cleaned up on the backend when the LiveKit room closes
    setConnectionDetails(null);
  };

  const handleDisconnect = () => {
    handleEndSession();
    onClose();
  };

  if (!agent) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleDisconnect}
        >
          {isConnecting && (
            <div className="bg-sidebar rounded-2xl p-8 border border-sidebar-border">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-sidebar-muted border-t-accent rounded-full"
                />
                <p className="text-sidebar-foreground">Connecting to voice agent...</p>
              </div>
            </div>
          )}

          {connectionDetails && !isConnecting && (
            <LiveKitRoom
              token={connectionDetails.token}
              serverUrl={connectionDetails.serverUrl}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={handleDisconnect}
            >
              <VoiceAssistantUI agent={agent} onClose={handleDisconnect} />
            </LiveKitRoom>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
