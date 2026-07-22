import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Database,
  Bot,
  Shield,
  Settings,
  FolderOpen,
  PlusCircle,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from '@/components/ThemeProvider';

const navItems = [
  { to: '/skills', icon: BookOpen, label: 'SKILL' },
  { to: '/memory', icon: Database, label: 'Memory' },
  { to: '/agents', icon: Bot, label: 'AGENTS' },
  { to: '/rules', icon: Shield, label: 'RULES' },
  { to: '/sources', icon: FolderOpen, label: '源目录' },
  { to: '/settings', icon: Settings, label: '设置' },
];

const modeLabels: Record<string, string> = {
  light: '浅色',
  dark: '深色',
  system: '跟随系统',
};

const modeIcons: Record<string, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const modeCycle: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const Icon = modeIcons[mode];

  const cycleMode = () => {
    const idx = modeCycle.indexOf(mode);
    const next = modeCycle[(idx + 1) % modeCycle.length];
    setMode(next);
  };

  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-xs" />} onClick={cycleMode}>
        <Icon className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>主题：{modeLabels[mode]}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Bot className="h-5 w-5 text-primary" />
        <span className="font-semibold">CCM</span>
      </div>

      <div className="p-3">
        <NavLink to="/skills/import" className="w-full">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <PlusCircle className="h-4 w-4" />
            导入 SKILL
          </Button>
        </NavLink>
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/skills'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <Separator />
      <div className="flex items-center justify-between p-3">
        <span className="text-xs text-muted-foreground">Claude Code Manager v0.1.0</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
