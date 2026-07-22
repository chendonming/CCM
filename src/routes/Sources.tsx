import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSourcesStore } from '@/stores/useSourcesStore';
import { useSkillsStore } from '@/stores/useSkillsStore';
import { useMessage } from '@/hooks/useMessage';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  FolderOpen,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  FolderGit2,
  AlertTriangle,
  FileText,
  Loader2,
} from 'lucide-react';
import type { ConflictInfo } from '@/types';

export default function SourcesPage() {
  const navigate = useNavigate();
  const { sources, fetchSources, addSource, removeSource } = useSourcesStore();
  const { skills, fetchSkills } = useSkillsStore();
  const message = useMessage();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const nameManuallyEdited = useRef(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const extractFolderName = (path: string) => {
    const normalized = path.replace(/\\/g, '/');
    const segments = normalized.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  };

  useEffect(() => {
    fetchSources();
    fetchSkills();
  }, []);

  useEffect(() => {
    if (!nameManuallyEdited.current && newPath) {
      const name = extractFolderName(newPath);
      if (name) setNewName(name);
    }
  }, [newPath]);

  const openInExplorer = async (path: string) => {
    if (loadingPath) return;
    setLoadingPath(path);
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('open_in_explorer', { path });
    } catch (err) {
      message.error(`无法打开路径：${String(err)}`);
    } finally {
      setLoadingPath(null);
    }
  };

  const handleAdd = async () => {
    if (!newName) {
      message.warning('请填写显示名称');
      return;
    }
    if (!newPath) {
      message.warning('请填写目录路径');
      return;
    }
    try {
      await addSource(newName, newPath);
      message.success(`源目录「${newName}」添加成功`);
      setNewName('');
      setNewPath('');
      setAddDialogOpen(false);
      fetchSkills();
    } catch (err) {
      const errStr = String(err);
      if (errStr.startsWith('CONFLICT:')) {
        try {
          const parsed = JSON.parse(errStr.slice(9)) as ConflictInfo[];
          setConflicts(parsed);
          setConflictDialogOpen(true);
        } catch {
          console.error('Failed to parse conflict info');
        }
      } else {
        message.error(`添加失败：${errStr}`);
      }
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeSource(id);
      fetchSkills();
    } catch (err) {
      message.error(`删除失败：${String(err)}`);
    }
  };

  const getSkillCount = (sourcePath: string) => {
    return skills.filter((s) => s.source_path.startsWith(sourcePath)).length;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">源目录管理</h1>
          <p className="text-sm text-muted-foreground">
            管理 SKILL 文件的来源目录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchSources();
              fetchSkills();
            }}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            刷新
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) {
              setNewName('');
              setNewPath('');
              nameManuallyEdited.current = false;
            }
          }}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-1 h-4 w-4" />
              添加源目录
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加源目录</DialogTitle>
                <DialogDescription>
                  添加一个包含 SKILL/AGENT/RULE 文件的目录
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">显示名称</label>
                  <Input
                    placeholder="例如：ECC"
                    value={newName}
                    onChange={(e) => {
                      nameManuallyEdited.current = true;
                      setNewName(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">目录路径</label>
                  <Input
                    placeholder="例如：E:\\workplace\\ECC\\skills"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAdd}>添加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sources.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <FolderOpen className="mx-auto mb-2 h-8 w-8" />
            <p>暂无源目录，点击上方按钮添加</p>
          </div>
        ) : (
          sources.map((source) => (
            <Card key={source.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {source.name}
                      {source.is_builtin && (
                        <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          内置
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs">
                      {source.path}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={source.is_builtin}
                    onClick={() => handleRemove(source.id)}
                    title={source.is_builtin ? '内置源不可删除' : '删除源目录'}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FolderGit2 className="h-4 w-4" />
                  <span>
                    包含 {getSkillCount(source.path)} 个技能
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/sources/${source.id}`)}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  查看详情
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Conflict Dialog */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DialogTitle>检测到名称冲突</DialogTitle>
            </div>
            <DialogDescription>
              该源目录中包含与已有 SKILL/AGENT/RULE 名称或 ID 冲突的实体，无法添加。
              请自行处理以下冲突后重试：
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-3 overflow-y-auto py-2">
            {conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      conflict.conflict_type === 'name'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}
                  >
                    {conflict.conflict_type === 'name' ? '名称' : 'ID'}
                  </span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    {conflict.value}
                  </code>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span className="text-muted-foreground shrink-0">新源:</span>
                    <button
                      className={`flex-1 truncate rounded px-1.5 py-0.5 text-left font-mono text-xs text-blue-600 underline-offset-2 hover:bg-accent hover:underline dark:text-blue-400 ${
                        loadingPath === conflict.new_path ? 'cursor-wait opacity-60' : ''
                      }`}
                      title="在资源管理器中打开"
                      disabled={!!loadingPath}
                      onClick={() => openInExplorer(conflict.new_path)}
                    >
                      {loadingPath === conflict.new_path ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          打开中...
                        </span>
                      ) : (
                        conflict.new_path
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground shrink-0">已有:</span>
                    <button
                      className={`flex-1 truncate rounded px-1.5 py-0.5 text-left font-mono text-xs text-blue-600 underline-offset-2 hover:bg-accent hover:underline dark:text-blue-400 ${
                        loadingPath === conflict.existing_path ? 'cursor-wait opacity-60' : ''
                      }`}
                      title="在资源管理器中打开"
                      disabled={!!loadingPath}
                      onClick={() => openInExplorer(conflict.existing_path)}
                    >
                      {loadingPath === conflict.existing_path ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          打开中...
                        </span>
                      ) : (
                        conflict.existing_path
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConflictDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
