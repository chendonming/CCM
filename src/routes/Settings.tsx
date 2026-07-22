import { useEffect, useState } from 'react';
import { useConfigStore } from '@/stores/useConfigStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Plus,
  Trash2,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import type { DeployableProject } from '@/types';

export default function SettingsPage() {
  const { config, fetchConfig, updateConfig } = useConfigStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [symlinkSupported, setSymlinkSupported] = useState<boolean | null>(null);

  useEffect(() => {
    fetchConfig();
    checkSymlink();
  }, []);

  const checkSymlink = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<boolean>('check_symlink_support');
      setSymlinkSupported(result);
    } catch {
      setSymlinkSupported(null);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName || !newProjectPath || !config) return;
    const updated: DeployableProject[] = [
      ...config.deployable_projects,
      { name: newProjectName, root_path: newProjectPath },
    ];
    await updateConfig({ ...config, deployable_projects: updated });
    setNewProjectName('');
    setNewProjectPath('');
  };

  const handleRemoveProject = async (index: number) => {
    if (!config) return;
    const updated = config.deployable_projects.filter((_, i) => i !== index);
    await updateConfig({ ...config, deployable_projects: updated });
  };

  const handleToggleSymlinkCheck = async () => {
    if (!config) return;
    await updateConfig({
      ...config,
      ui_preferences: {
        ...config.ui_preferences,
        skip_symlink_check: !config.ui_preferences.skip_symlink_check,
      },
    });
  };

  if (!config) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">设置</h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Symlink */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">符号链接检测</CardTitle>
            <CardDescription>
              Windows 上创建符号链接需要管理员权限或开发者模式
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {symlinkSupported !== null && (
              <div className="flex items-center gap-2 text-sm">
                <span>状态：</span>
                {symlinkSupported ? (
                  <span className="text-green-600">符号链接可用</span>
                ) : (
                  <span className="text-amber-600">符号链接不可用（需要提权）</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skip-symlink"
                checked={config.ui_preferences.skip_symlink_check}
                onChange={handleToggleSymlinkCheck}
                className="h-4 w-4"
              />
              <label htmlFor="skip-symlink" className="text-sm">
                启动时跳过符号链接权限检测
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">主题</CardTitle>
            <CardDescription>选择界面主题外观</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={config.ui_preferences.theme}
              onValueChange={(value) => {
                if (!value) return;
                updateConfig({
                  ...config,
                  ui_preferences: {
                    ...config.ui_preferences,
                    theme: value,
                  },
                });
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">
                  <Monitor className="h-4 w-4" />
                  跟随系统
                </SelectItem>
                <SelectItem value="light">
                  <Sun className="h-4 w-4" />
                  浅色
                </SelectItem>
                <SelectItem value="dark">
                  <Moon className="h-4 w-4" />
                  深色
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Deployable Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">可部署项目</CardTitle>
            <CardDescription>
              管理项目级 SKILL 部署的目标项目
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.deployable_projects.map((project, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{project.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {project.root_path}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveProject(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                placeholder="项目名称"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-36"
              />
              <Input
                placeholder="项目根路径"
                value={newProjectPath}
                onChange={(e) => setNewProjectPath(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddProject}
                disabled={!newProjectName || !newProjectPath}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">关于</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Claude Code Manager v0.1.0</p>
            <p>使用 Rust + Tauri 2 + React 构建</p>
            <p>配置位置：~/.claude-ccm/config.json</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
