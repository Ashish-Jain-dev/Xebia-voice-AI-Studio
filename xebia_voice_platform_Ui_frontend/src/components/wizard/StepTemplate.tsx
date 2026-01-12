import { motion } from 'framer-motion';
import { WizardData } from '@/pages/CreateAgent';

interface StepTemplateProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const templates = [
  {
    id: 'general',
    name: 'General Xebia Assistant',
    icon: '🤖',
    description: 'A versatile assistant for general organizational queries and support.',
  },
  {
    id: 'project',  // Fixed: Changed from 'onboarding' to match backend
    name: 'Project Onboarding',
    icon: '🚀',
    description: 'Helps new team members get up to speed with project context and workflows.',
  },
  {
    id: 'techstack',
    name: 'Tech Stack Guide',
    icon: '⚡',
    description: 'Provides guidance on approved technologies, best practices, and coding standards.',
  },
  {
    id: 'client',
    name: 'Client Context',
    icon: '🤝',
    description: 'Answers questions about client requirements, history, and relationship notes.',
  },
];

export function StepTemplate({ data, updateData }: StepTemplateProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Choose a Template</h2>
        <p className="text-muted-foreground mb-6">
          Select a template that best fits your use case. You can customize it in the next steps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => updateData({ 
                template: template.name, 
                templateIcon: template.icon,
                name: `My ${template.name}`,
                description: template.description,
              })}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                data.template === template.name
                  ? 'border-primary bg-primary/5 shadow-glow'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl flex-shrink-0">
                  {template.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
