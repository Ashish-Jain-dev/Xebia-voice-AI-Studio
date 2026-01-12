import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Sparkles, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, Agent } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { StepTemplate } from '@/components/wizard/StepTemplate';
import { StepConfigure } from '@/components/wizard/StepConfigure';
import { StepDocuments } from '@/components/wizard/StepDocuments';
import { StepIntegrations } from '@/components/wizard/StepIntegrations';
import { StepReview } from '@/components/wizard/StepReview';
import { VoiceTestModal } from '@/components/voice/VoiceTestModal';
import { agentsAPI } from '@/lib/api';
import { toast } from 'sonner';

const steps = [
  { id: 1, name: 'Choose Template' },
  { id: 2, name: 'Configure' },
  { id: 3, name: 'Upload Docs' },
  { id: 4, name: 'Integrations' },
  { id: 5, name: 'Review' },
  { id: 6, name: 'Test Agent' },
];

export interface WizardData {
  template: string;
  templateIcon: string;
  name: string;
  description: string;
  systemPrompt: string;
  personality: 'professional' | 'friendly' | 'empathetic';
  verbosity: number;
  formality: number;
  languages: string[];
  autoDetectLanguage: boolean;
  voiceId: string;
  avatarId?: string | null;  // Beyond Presence avatar ID (null = no avatar)
  documents: File[];
  integrations: string[];
  mcpConfig?: {
    servers: Array<{
      name: string;
      type: 'http' | 'stdio';
      url?: string;
      headers?: Record<string, string>;
    }>;
  };
}

const initialData: WizardData = {
  template: '',
  templateIcon: '🤖',
  name: '',
  description: '',
  systemPrompt: 'You are a helpful assistant that provides accurate and concise answers based on the provided documentation.',
  personality: 'professional',
  verbosity: 50,
  formality: 50,
  languages: ['english'],
  autoDetectLanguage: true,
  voiceId: 'alloy',
  avatarId: null,  // null = no avatar by default
  documents: [],
  integrations: [],
  mcpConfig: { servers: [] },  // No MCP servers by default
};

// Map frontend template names to backend template IDs
const templateIdMap: Record<string, string> = {
  'General Xebia Assistant': 'general',
  'Project Onboarding': 'project',
  'Tech Stack Guide': 'techstack',
  'Client Context': 'client',
};

export default function CreateAgent() {
  const navigate = useNavigate();
  const { addAgent } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [creating, setCreating] = useState(false);

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 5) {
      // Create the agent via API
      try {
        setCreating(true);
        
        // Map frontend template name to backend template_id
        const template_id = templateIdMap[data.template] || data.template.toLowerCase();
        
        // Create agent (exclude UI-only fields)
        const createResponse = await agentsAPI.create({
          name: data.name,
          template_id: template_id,
          description: data.description,
          system_prompt: data.systemPrompt,
          avatar_id: data.avatarId || null,  // null = no avatar (don't use undefined)
          mcp_config: data.mcpConfig && data.mcpConfig.servers.length > 0 ? data.mcpConfig : undefined,  // Include MCP config if present
        });
        
        const newAgent = createResponse.data;
        
        // Upload documents if any
        if (data.documents.length > 0) {
          toast.info(`Uploading ${data.documents.length} document(s)...`);
          
          for (const file of data.documents) {
            try {
              await agentsAPI.uploadDocument(newAgent.id, file);
            } catch (error) {
              console.error(`Error uploading ${file.name}:`, error);
              toast.error(`Failed to upload ${file.name}`);
            }
          }
          
          toast.success('Documents uploaded successfully');
        }
        
        // Add to store
        addAgent(newAgent);
        setCreatedAgent(newAgent);
        setCurrentStep(6);
        toast.success('Agent created successfully!');
        
      } catch (error) {
        console.error('Error creating agent:', error);
        toast.error('Failed to create agent. Please try again.');
      } finally {
        setCreating(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!data.template;
      case 2: return !!data.name && !!data.description;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Create New Agent</h1>
        <p className="text-muted-foreground mt-1">
          Build a custom voice AI agent in a few simple steps
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step.id < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id === currentStep
                      ? 'bg-gradient-to-br from-primary to-accent text-white shadow-glow'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden md:block ${
                    step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 lg:w-20 h-0.5 mx-2 ${
                    step.id < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && <StepTemplate data={data} updateData={updateData} />}
          {currentStep === 2 && <StepConfigure data={data} updateData={updateData} />}
          {currentStep === 3 && <StepDocuments data={data} updateData={updateData} />}
          {currentStep === 4 && <StepIntegrations data={data} updateData={updateData} />}
          {currentStep === 5 && <StepReview data={data} />}
          {currentStep === 6 && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Agent Created Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Your agent "{data.name}" is now ready to use
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button onClick={() => setShowTest(true)} className="btn-gradient">
                  <Play className="w-4 h-4 mr-2" /> Test Agent
                </Button>
                <Button variant="outline" onClick={() => navigate('/agents')}>
                  View All Agents
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < 6 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between"
        >
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || creating}
            className="btn-gradient"
          >
            {creating ? 'Creating...' : currentStep === 5 ? 'Create Agent' : 'Continue'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}

      <VoiceTestModal
        agent={createdAgent}
        isOpen={showTest}
        onClose={() => setShowTest(false)}
      />
    </div>
  );
}
