import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Volume2 } from 'lucide-react';
import { WizardData } from '@/pages/CreateAgent';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarSelector } from '@/components/AvatarSelector';

interface StepConfigureProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const personalities = [
  { id: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { id: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { id: 'empathetic', label: 'Empathetic', description: 'Understanding and supportive' },
];

const languages = [
  { id: 'english', label: 'English (Indian)' },
  { id: 'hindi', label: 'Hindi' },
  { id: 'tamil', label: 'Tamil' },
  { id: 'telugu', label: 'Telugu' },
  { id: 'kannada', label: 'Kannada' },
  { id: 'marathi', label: 'Marathi' },
];

const voices = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'echo', name: 'Echo', description: 'Warm and engaging' },
  { id: 'fable', name: 'Fable', description: 'Expressive and dynamic' },
  { id: 'nova', name: 'Nova', description: 'Professional and clear' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft and friendly' },
];

export function StepConfigure({ data, updateData }: StepConfigureProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const handleLanguageToggle = (langId: string) => {
    const newLanguages = data.languages.includes(langId)
      ? data.languages.filter(l => l !== langId)
      : [...data.languages, langId];
    updateData({ languages: newLanguages });
  };

  const handlePlayVoice = (voiceId: string) => {
    setPlayingVoice(voiceId);
    setTimeout(() => setPlayingVoice(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Core Fields */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Core Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              placeholder="Enter agent name"
            />
          </div>
          <div className="space-y-2">
            <Label>Personality</Label>
            <div className="flex gap-2">
              {personalities.map(p => (
                <button
                  key={p.id}
                  onClick={() => updateData({ personality: p.id as any })}
                  className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                    data.personality === p.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{p.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder="Describe what this agent does"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            value={data.systemPrompt}
            onChange={(e) => updateData({ systemPrompt: e.target.value })}
            placeholder="Enter the system prompt..."
            rows={4}
          />
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Advanced Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Verbosity</Label>
              <span className="text-sm text-muted-foreground">
                {data.verbosity < 33 ? 'Concise' : data.verbosity > 66 ? 'Detailed' : 'Balanced'}
              </span>
            </div>
            <Slider
              value={[data.verbosity]}
              onValueChange={([v]) => updateData({ verbosity: v })}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Concise</span>
              <span>Detailed</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Formality</Label>
              <span className="text-sm text-muted-foreground">
                {data.formality < 33 ? 'Casual' : data.formality > 66 ? 'Formal' : 'Balanced'}
              </span>
            </div>
            <Slider
              value={[data.formality]}
              onValueChange={([v]) => updateData({ formality: v })}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Casual</span>
              <span>Formal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Language Settings</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {languages.map(lang => (
            <label
              key={lang.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                data.languages.includes(lang.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                checked={data.languages.includes(lang.id)}
                onCheckedChange={() => handleLanguageToggle(lang.id)}
              />
              <span className="text-sm font-medium">{lang.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium text-foreground">Auto-Detect Language</p>
            <p className="text-sm text-muted-foreground">Automatically detect customer's language</p>
          </div>
          <Switch
            checked={data.autoDetectLanguage}
            onCheckedChange={(checked) => updateData({ autoDetectLanguage: checked })}
          />
        </div>
      </div>

      {/* Voice Configuration */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Voice Configuration</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {voices.map((voice, index) => (
            <motion.div
              key={voice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                data.voiceId === voice.id
                  ? 'border-primary bg-primary/5 shadow-glow'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => updateData({ voiceId: voice.id })}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{voice.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayVoice(voice.id);
                  }}
                >
                  {playingVoice === voice.id ? (
                    <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{voice.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Avatar Selection */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <AvatarSelector
          selectedAvatarId={data.avatarId}
          onSelect={(avatarId) => updateData({ avatarId })}
        />
      </div>
    </div>
  );
}
