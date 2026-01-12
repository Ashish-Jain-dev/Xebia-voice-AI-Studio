import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Agent } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { LiveKitRoom, useSession, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { sessionsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { SessionView } from '@/components/voice/SessionView';

interface VoiceTestModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

// Inner component that uses LiveKit hooks (must be inside LiveKitRoom)
function VoiceAssistantUI({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  // Get session from LiveKit context
  const session = useSession();

  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.98, opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => e.stopPropagation()}
      className="h-screen w-screen bg-background overflow-hidden"
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl">
            {agent.templateIcon}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{agent.name}</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${session.isConnected ? 'bg-emerald-500' : 'bg-gray-500'}`} />
              <span className="text-xs text-muted-foreground">
                {session.isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Session View */}
      <div className="absolute inset-0 pt-16">
        <SessionView
          agent={agent}
          session={session}
          isConnected={session.isConnected}
          onDisconnect={onClose}
        />
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
          className="fixed inset-0 z-50 h-screen w-screen bg-background"
          onClick={handleDisconnect}
        >
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-background rounded-2xl p-8 border border-border shadow-2xl">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-muted border-t-primary rounded-full"
                  />
                  <p className="text-foreground">Connecting to voice agent...</p>
                </div>
              </div>
            </div>
          )}

          {connectionDetails && !isConnecting && (
            <LiveKitRoom
              token={connectionDetails.token}
              serverUrl={connectionDetails.serverUrl}
              connect={true}
              audio={true}
              video={false}  // Don't capture user's camera
              options={{
                publishDefaults: {
                  videoEnabled: false,  // Don't publish user video
                },
                videoCaptureDefaults: {
                  enabled: false,  // Don't start user's camera
                },
              }}
              onDisconnected={handleDisconnect}
              className="h-full w-full"
            >
              <VoiceAssistantUI agent={agent} onClose={handleDisconnect} />
            </LiveKitRoom>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
