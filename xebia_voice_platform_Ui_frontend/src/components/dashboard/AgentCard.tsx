import { motion } from 'framer-motion';
import { MoreVertical, Play, Pencil, FileText, MessageSquare } from 'lucide-react';
import { Agent } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface AgentCardProps {
  agent: Agent;
  delay?: number;
  onTest: (agent: Agent) => void;
}

export function AgentCard({ agent, delay = 0, onTest }: AgentCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="agent-card"
    >
      <div className="p-5">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={() => onTest(agent)}>
                <Play className="w-4 h-4 mr-2" /> Test Agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/agents/${agent.id}/edit`)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{agent.description}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{agent.documents.length} docs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>{agent.queryCount} queries</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">Last used: {agent.lastUsed}</span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            agent.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
            agent.status === 'draft' ? 'bg-amber-100 text-amber-700' : 
            'bg-gray-100 text-gray-700'
          }`}>
            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
