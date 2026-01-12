import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Avatar {
  id: string;
  name: string;
  image: string;
}

export const AVATARS: Avatar[] = [
  {
    id: '7124071d-480e-4fdc-ad0e-a2e0680f1378',
    name: 'John',
    image: '/avatar_images/john.png',
  },
  {
    id: 'b5bebaf9-ae80-4e43-b97f-4506136ed926',
    name: 'Emma',
    image: '/avatar_images/emma.png',
  },
  {
    id: '2ed7477f-3961-4ce1-b331-5e4530c55a57',
    name: 'Rahul',
    image: '/avatar_images/rahul.png',
  },
];

interface AvatarSelectorProps {
  selectedAvatarId?: string;
  onSelect: (avatarId: string | null) => void;
}

export function AvatarSelector({ selectedAvatarId, onSelect }: AvatarSelectorProps) {
  // Normalize undefined to null for consistent comparison
  const normalizedSelection = selectedAvatarId === undefined ? null : selectedAvatarId;
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
          Choose an Avatar
        </h3>
        <p className="text-xs text-sidebar-muted mb-4">
          Select a hyper-realistic avatar for your voice agent
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {AVATARS.map((avatar) => {
          const isSelected = normalizedSelection === avatar.id;

          return (
            <motion.button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-sidebar-border hover:border-primary/50 bg-sidebar'
              )}
            >
              {/* Avatar Image */}
              <div
                className={cn(
                  'relative w-20 h-20 rounded-full overflow-hidden ring-2',
                  isSelected ? 'ring-primary' : 'ring-sidebar-border'
                )}
              >
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />

                {/* Selected Checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-primary/80 flex items-center justify-center"
                  >
                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Avatar Name */}
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-primary' : 'text-sidebar-foreground'
                )}
              >
                {avatar.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* No Avatar Option */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'w-full p-3 rounded-xl border-2 text-sm font-medium transition-all',
          normalizedSelection === null
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-sidebar-border hover:border-primary/50 bg-sidebar text-sidebar-foreground'
        )}
      >
        No Avatar (Audio Only)
      </button>
    </div>
  );
}
