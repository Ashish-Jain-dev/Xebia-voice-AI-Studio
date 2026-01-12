import { type HTMLAttributes, useCallback, useState } from 'react';
import { Track } from 'livekit-client';
import { useTrackToggle, useRemoteParticipants } from '@livekit/components-react';
import { MessageSquare, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ControlBarControls {
  leave?: boolean;
  camera?: boolean;
  microphone?: boolean;
  screenShare?: boolean;
  chat?: boolean;
}

export interface AgentControlBarProps {
  controls?: ControlBarControls;
  isConnected?: boolean;
  onDisconnect?: () => void;
  onChatOpenChange?: (open: boolean) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function AgentControlBar({
  controls,
  className,
  isConnected = false,
  onDisconnect,
  onChatOpenChange,
  ...props
}: AgentControlBarProps & HTMLAttributes<HTMLDivElement>) {
  const participants = useRemoteParticipants();
  const [chatOpen, setChatOpen] = useState(false);

  // Track toggles
  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({
    source: Track.Source.Microphone,
  });

  const { toggle: toggleCamera, enabled: cameraEnabled } = useTrackToggle({
    source: Track.Source.Camera,
  });

  const handleToggleTranscript = useCallback(() => {
    const newState = !chatOpen;
    setChatOpen(newState);
    onChatOpenChange?.(newState);
  }, [chatOpen, onChatOpenChange]);

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? true,
    screenShare: controls?.screenShare ?? false,
    camera: controls?.camera ?? false,
    chat: controls?.chat ?? true,
  };

  const isAgentAvailable = participants.some((p) => p.isAgent);

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn(
        'bg-background border-input/50 flex items-center justify-between gap-3 rounded-full border p-3 shadow-lg backdrop-blur-sm',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {/* Toggle Microphone */}
        {visibleControls.microphone && (
          <Button
            size="icon"
            variant={micEnabled ? 'default' : 'secondary'}
            aria-label="Toggle microphone"
            onClick={toggleMic}
            className={cn(
              'rounded-full transition-all',
              micEnabled && 'bg-primary hover:bg-primary/90'
            )}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
        )}

        {/* Toggle Camera */}
        {visibleControls.camera && (
          <Button
            size="icon"
            variant={cameraEnabled ? 'default' : 'secondary'}
            aria-label="Toggle camera"
            onClick={toggleCamera}
            className={cn(
              'rounded-full transition-all',
              cameraEnabled && 'bg-primary hover:bg-primary/90'
            )}
          >
            {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
        )}

        {/* Toggle Transcript */}
        {visibleControls.chat && (
          <Button
            size="icon"
            variant={chatOpen ? 'default' : 'secondary'}
            aria-label="Toggle transcript"
            onClick={handleToggleTranscript}
            className={cn(
              'rounded-full transition-all',
              chatOpen && 'bg-primary hover:bg-primary/90'
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Disconnect */}
      {visibleControls.leave && (
        <Button
          variant="destructive"
          onClick={onDisconnect}
          disabled={!isConnected}
          className="rounded-full font-semibold px-6"
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          <span className="hidden md:inline">End Call</span>
          <span className="inline md:hidden">End</span>
        </Button>
      )}
    </div>
  );
}
