import { motion } from 'framer-motion';
import { PlusCircle, Upload, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { name: 'Create Agent', icon: PlusCircle, href: '/create-agent', color: 'from-primary to-accent' },
  { name: 'Upload Documents', icon: Upload, href: '/knowledge-base', color: 'from-emerald-500 to-teal-500' },
  { name: 'View Analytics', icon: BarChart3, href: '/analytics', color: 'from-violet-500 to-purple-500' },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(action.href)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-foreground">{action.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
