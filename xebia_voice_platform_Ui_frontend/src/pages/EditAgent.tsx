import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { agentsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';

export default function EditAgent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agents, setAgents } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
  });

  // Fetch agent details
  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) {
        toast.error('Agent ID is required');
        navigate('/agents');
        return;
      }

      try {
        setLoading(true);
        const response = await agentsAPI.get(id);
        const agent = response.data;
        
        setFormData({
          name: agent.name || '',
          description: agent.description || '',
          system_prompt: agent.system_prompt || '',
        });
      } catch (error) {
        console.error('Error fetching agent:', error);
        toast.error('Failed to load agent details');
        navigate('/agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!id) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    if (!formData.system_prompt.trim()) {
      toast.error('System prompt is required');
      return;
    }

    setSaving(true);
    try {
      await agentsAPI.update(id, formData);
      
      // Update local store
      const response = await agentsAPI.list();
      setAgents(response.data);
      
      toast.success('Agent updated successfully!');
      navigate('/agents');
    } catch (error: any) {
      console.error('Error updating agent:', error);
      toast.error(error.response?.data?.detail || 'Failed to update agent');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agent details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/agents')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Agent</h1>
          <p className="text-muted-foreground mt-1">
            Update your agent's configuration
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-6 space-y-6"
      >
        {/* Agent Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Agent Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter agent name"
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">
            Give your agent a descriptive name
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What does this agent do?"
            rows={3}
            className="resize-none text-base"
          />
          <p className="text-xs text-muted-foreground">
            Optional: Describe the agent's purpose and capabilities
          </p>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="system_prompt">System Prompt *</Label>
          <Textarea
            id="system_prompt"
            value={formData.system_prompt}
            onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
            placeholder="You are a helpful AI assistant..."
            rows={10}
            className="resize-none font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Define the agent's behavior, personality, and capabilities
          </p>
        </div>

        {/* System Prompt Tips */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">💡 System Prompt Tips:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be specific about the agent's role and expertise</li>
            <li>• Define how the agent should communicate (formal, casual, etc.)</li>
            <li>• Specify what the agent should and shouldn't do</li>
            <li>• Include instructions for using the knowledge base if relevant</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => navigate('/agents')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="btn-gradient"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Changes to the system prompt will take effect immediately. 
          The agent will use the updated configuration in the next conversation.
        </p>
      </motion.div>
    </div>
  );
}
