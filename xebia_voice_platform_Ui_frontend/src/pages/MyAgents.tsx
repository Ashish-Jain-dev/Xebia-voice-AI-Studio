import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, SortAsc, Play, Pencil, Trash2, MoreVertical, Grid, List } from 'lucide-react';
import { useAppStore, Agent } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VoiceTestModal } from '@/components/voice/VoiceTestModal';
import { agentsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function MyAgents() {
  const navigate = useNavigate();
  const { agents, setAgents, deleteAgent: removeAgentFromStore } = useAppStore();
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [testAgent, setTestAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch agents from backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await agentsAPI.list();
        setAgents(response.data);
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast.error('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [setAgents]);

  // Delete agent
  const handleDeleteAgent = async (id: string) => {
    try {
      await agentsAPI.delete(id);
      removeAgentFromStore(id);
      toast.success('Agent deleted successfully');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const templates = [...new Set(agents.map(a => a.template))];

  const filteredAgents = agents
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    .filter(a => templateFilter === 'all' || a.template === templateFilter)
    .sort((a, b) => {
      if (sortBy === 'recent') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'queries') return b.queryCount - a.queryCount;
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">My Agents</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor all your voice AI agents
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-xl border border-border"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={templateFilter} onValueChange={setTemplateFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            {templates.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SortAsc className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="queries">Most Queries</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Agents Table/Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {viewMode === 'list' ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Agent</TableHead>
                  <TableHead className="text-muted-foreground">Template</TableHead>
                  <TableHead className="text-muted-foreground">Queries</TableHead>
                  <TableHead className="text-muted-foreground">Last Used</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg">
                          {agent.templateIcon}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{agent.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{agent.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{agent.template}</TableCell>
                    <TableCell className="text-muted-foreground">{agent.queryCount}</TableCell>
                    <TableCell className="text-muted-foreground">{agent.lastUsed}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agent.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                        agent.status === 'draft' ? 'bg-amber-100 text-amber-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setTestAgent(agent)} className="h-8 w-8">
                          <Play className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/agents/${agent.id}/edit`)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteAgent(agent.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="agent-card p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                      {agent.templateIcon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.template}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    agent.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                    agent.status === 'draft' ? 'bg-amber-100 text-amber-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{agent.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>{agent.queryCount} queries</span>
                  <span>•</span>
                  <span>{agent.lastUsed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setTestAgent(agent)} variant="outline" size="sm" className="flex-1">
                    <Play className="w-4 h-4 mr-2" /> Test
                  </Button>
                  <Button onClick={() => navigate(`/agents/${agent.id}/edit`)} variant="outline" size="sm" className="flex-1">
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <VoiceTestModal
        agent={testAgent}
        isOpen={!!testAgent}
        onClose={() => setTestAgent(null)}
      />
    </div>
  );
}
