import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, Timer, TrendingUp, PlusCircle } from 'lucide-react';
import { useAppStore, Agent } from '@/store/appStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { AgentCard } from '@/components/dashboard/AgentCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { VoiceTestModal } from '@/components/voice/VoiceTestModal';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { agentsAPI, sessionsAPI, analyticsAPI, Activity as APIActivity } from '@/lib/api';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, agents, setAgents, activities, setActivities } = useAppStore();
  const navigate = useNavigate();
  const [testAgent, setTestAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    total_agents: 0,
    total_queries: 0,
    total_documents: 0,
    total_sessions: 0,
  });

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch agents
        const agentsResponse = await agentsAPI.list();
        const fetchedAgents = agentsResponse.data;
        setAgents(fetchedAgents);
        
        // Fetch recent activities
        const activitiesResponse = await sessionsAPI.getRecent(20);
        const fetchedActivities = activitiesResponse.data;
        setActivities(fetchedActivities);
        
        // Fetch analytics overview
        const analyticsResponse = await analyticsAPI.overview();
        setAnalyticsData(analyticsResponse.data);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setAgents, setActivities]);

  const activeAgents = agents?.filter(a => a.status === 'active').length || 0;
  const totalQueries = analyticsData.total_queries || agents?.reduce((sum, a) => sum + a.queryCount, 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your agents
          </p>
        </div>
        <Button onClick={() => navigate('/create-agent')} className="btn-gradient">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Agent
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Agents"
          value={activeAgents}
          change="+2 this month"
          changeType="positive"
          icon={Bot}
          delay={0}
        />
        <StatCard
          title="Total Queries"
          value={totalQueries.toLocaleString()}
          change="+18% from last week"
          changeType="positive"
          icon={Zap}
          delay={0.1}
        />
        <StatCard
          title="Avg Response Time"
          value="1.2s"
          change="-0.3s improvement"
          changeType="positive"
          icon={Timer}
          delay={0.2}
        />
        <StatCard
          title="Success Rate"
          value="98.5%"
          change="+0.5% from last week"
          changeType="positive"
          icon={TrendingUp}
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} />
        </div>
        
        {/* Quick Actions */}
        <QuickActions />
      </div>

      {/* Agent Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Your Agents</h2>
          <Button variant="ghost" onClick={() => navigate('/agents')} className="text-primary hover:text-primary/80">
            View All →
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.slice(0, 3).map((agent, index) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              delay={0.1 * index}
              onTest={setTestAgent}
            />
          ))}
        </div>
      </div>

      {/* Voice Test Modal */}
      <VoiceTestModal
        agent={testAgent}
        isOpen={!!testAgent}
        onClose={() => setTestAgent(null)}
      />
    </div>
  );
}
