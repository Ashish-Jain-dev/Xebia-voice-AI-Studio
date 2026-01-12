import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Bot, 
  PlusCircle, 
  BarChart3, 
  BookOpen, 
  Settings,
  LogOut,
  Mic
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Agents', href: '/agents', icon: Bot },
  { name: 'Create Agent', href: '/create-agent', icon: PlusCircle },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user, usageStats } = useAppStore();
  
  const agentPercent = (usageStats.agentsUsed / usageStats.agentsLimit) * 100;
  const queryPercent = (usageStats.queriesUsed / usageStats.queriesLimit) * 100;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Xebia Voice AI</h1>
            <p className="text-xs text-sidebar-muted">Studio</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-8 bg-accent rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage Stats */}
      <div className="p-4 mx-4 mb-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Usage</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-sidebar-muted mb-1">
              <span>Agents</span>
              <span>{usageStats.agentsUsed} / {usageStats.agentsLimit}</span>
            </div>
            <Progress value={agentPercent} className="h-1.5 bg-sidebar-border" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-sidebar-muted mb-1">
              <span>Queries</span>
              <span>{usageStats.queriesUsed} / {usageStats.queriesLimit}</span>
            </div>
            <Progress value={queryPercent} className="h-1.5 bg-sidebar-border" />
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-sidebar-border">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.name?.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
