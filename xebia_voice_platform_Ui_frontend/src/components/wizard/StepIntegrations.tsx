import { motion } from 'framer-motion';
import { useState } from 'react';
import { WizardData } from '@/pages/CreateAgent';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Server, Github, Zap, Code, Database, FileText, Calendar, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface StepIntegrationsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

interface MCPServer {
  name: string;
  type: 'github' | 'predefined' | 'custom';
  config?: string;
}

const integrations = [
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Sync customer data and interactions',
    icon: '📊',
    category: 'crm',
    available: true,
  },
  {
    id: 'knowledge',
    name: 'Internal Knowledge Base',
    description: 'Connect to internal documentation systems',
    icon: '📚',
    category: 'knowledge',
    available: true,
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Access project tasks and tickets',
    icon: '🎯',
    category: 'project',
    available: true,
  },
  {
    id: 'confluence',
    name: 'Confluence',
    description: 'Connect to Confluence pages and spaces',
    icon: '📝',
    category: 'knowledge',
    available: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Search messages and channels',
    icon: '💬',
    category: 'communication',
    available: false,
  },
  {
    id: 'hr',
    name: 'HR Tools',
    description: 'Access employee and HR information',
    icon: '👥',
    category: 'hr',
    available: false,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Schedule meetings and check availability',
    icon: '📅',
    category: 'productivity',
    available: false,
  },
  {
    id: 'api',
    name: 'Internal APIs',
    description: 'Connect to custom internal APIs',
    icon: '🔌',
    category: 'custom',
    available: false,
  },
];

export function StepIntegrations({ data, updateData }: StepIntegrationsProps) {
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);
  const [mcpType, setMcpType] = useState<'github' | 'predefined' | 'custom'>('github');
  const [mcpName, setMcpName] = useState('');
  const [mcpConfig, setMcpConfig] = useState('');

  const toggleIntegration = (id: string) => {
    const newIntegrations = data.integrations.includes(id)
      ? data.integrations.filter(i => i !== id)
      : [...data.integrations, id];
    updateData({ integrations: newIntegrations });
  };

  const addMCPServer = () => {
    const newServer: MCPServer = {
      name: mcpName || 'Custom MCP Server',
      type: mcpType,
      config: mcpType === 'custom' ? mcpConfig : undefined
    };
    
    const updatedServers = [...mcpServers, newServer];
    setMcpServers(updatedServers);
    
    // Build MCP config payload for backend (only for custom type)
    if (mcpType === 'custom' && mcpConfig) {
      try {
        // Parse the JSON config
        const parsed = JSON.parse(mcpConfig);
        
        // Build the backend-compatible MCP config
        const mcpConfigPayload = {
          servers: updatedServers
            .filter(s => s.type === 'custom' && s.config)
            .map(server => {
              try {
                const serverParsed = JSON.parse(server.config!);
                return {
                  name: server.name,
                  type: serverParsed.type || 'http',
                  url: serverParsed.url,
                  headers: serverParsed.headers || {},
                };
              } catch (e) {
                console.error('Invalid MCP config JSON:', e);
                return null;
              }
            })
            .filter(Boolean)
        };
        
        // Update wizard data with MCP config
        updateData({ mcpConfig: mcpConfigPayload });
        
      } catch (e) {
        console.error('Invalid JSON format:', e);
        toast.error('Invalid JSON configuration format');
        return;
      }
    }
    
    setMcpDialogOpen(false);
    setMcpName('');
    setMcpConfig('');
  };

  const removeMCPServer = (index: number) => {
    const updatedServers = mcpServers.filter((_, i) => i !== index);
    setMcpServers(updatedServers);
    
    // Update wizard data - rebuild MCP config payload
    const mcpConfigPayload = {
      servers: updatedServers
        .filter(s => s.type === 'custom' && s.config)
        .map(server => {
          try {
            const serverParsed = JSON.parse(server.config!);
            return {
              name: server.name,
              type: serverParsed.type || 'http',
              url: serverParsed.url,
              headers: serverParsed.headers || {},
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
    };
    
    updateData({ mcpConfig: mcpConfigPayload });
  };

  return (
    <div className="space-y-6">
      {/* MCP Servers Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              MCP Servers
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect Model Context Protocol servers to extend agent capabilities
            </p>
          </div>
          <Dialog open={mcpDialogOpen} onOpenChange={setMcpDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add MCP Server
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add MCP Server</DialogTitle>
                <DialogDescription>
                  Connect an MCP server to provide additional tools and context to your agent.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={mcpType} onValueChange={(v) => setMcpType(v as typeof mcpType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="github">
                    <Github className="w-4 h-4 mr-1" />
                    GitHub
                  </TabsTrigger>
                  <TabsTrigger value="predefined">
                    <Zap className="w-4 h-4 mr-1" />
                    Predefined
                  </TabsTrigger>
                  <TabsTrigger value="custom">
                    <Code className="w-4 h-4 mr-1" />
                    Custom
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="github" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="mcp-github">GitHub MCP Server</Label>
                    <Input
                      id="mcp-github"
                      placeholder="e.g., @modelcontextprotocol/server-github"
                      value={mcpName}
                      onChange={(e) => setMcpName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use official MCP servers from the Model Context Protocol GitHub organization
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="predefined" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Label>Select Integration</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Filesystem', 'Git', 'PostgreSQL', 'Slack'].map((name) => (
                        <button
                          key={name}
                          onClick={() => setMcpName(name)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            mcpName === name
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="font-medium text-sm">{name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="mcp-custom-name">Server Name</Label>
                    <Input
                      id="mcp-custom-name"
                      placeholder="My Custom MCP Server"
                      value={mcpName}
                      onChange={(e) => setMcpName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mcp-config">JSON Configuration</Label>
                    <Textarea
                      id="mcp-config"
                      placeholder='{\n  "command": "node",\n  "args": ["path/to/server.js"],\n  "env": {}\n}'
                      value={mcpConfig}
                      onChange={(e) => setMcpConfig(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setMcpDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addMCPServer} disabled={!mcpName.trim()}>
                  Add Server
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Connected MCP Servers */}
        {mcpServers.length > 0 ? (
          <div className="space-y-2">
            {mcpServers.map((server, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <Server className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{server.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{server.type} MCP Server</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMCPServer(index)}
                >
                  Remove
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No MCP servers connected. Click "Add MCP Server" to get started.
          </div>
        )}
      </div>

      {/* Standard Integrations Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Standard Integrations</h2>
        <p className="text-muted-foreground mb-6">
          Connect your agent to Xebia's internal tools and external services.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-5 rounded-xl border transition-all ${
                data.integrations.includes(integration.id)
                  ? 'border-primary bg-primary/5'
                  : integration.available
                  ? 'border-border hover:border-primary/50'
                  : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{integration.name}</h3>
                      {!integration.available && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {integration.description}
                    </p>
                  </div>
                </div>
                {integration.available && (
                  <Switch
                    checked={data.integrations.includes(integration.id)}
                    onCheckedChange={() => toggleIntegration(integration.id)}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-primary text-xs">ℹ️</span>
          </div>
          <div>
            <p className="text-sm text-foreground font-medium mb-1">
              Extensible Integration Platform
            </p>
            <p className="text-xs text-muted-foreground">
              MCP Servers and standard integrations are UI mockups showcasing future extensibility. 
              They demonstrate how agents can connect to various internal tools, knowledge bases, 
              and external services to provide comprehensive assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
