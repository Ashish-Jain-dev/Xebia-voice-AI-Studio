import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Bot } from 'lucide-react';
import { Activity } from '@/store/appStore';

interface ActivityFeedProps {
  activities: Activity[];
}

const statusIcons = {
  success: CheckCircle2,
  pending: Clock,
  error: AlertCircle,
};

const statusColors = {
  success: 'text-emerald-500',
  pending: 'text-amber-500',
  error: 'text-red-500',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity, index) => {
          const StatusIcon = statusIcons[activity.status];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{activity.query}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.agentName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusIcon className={`w-4 h-4 ${statusColors[activity.status]}`} />
                <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
