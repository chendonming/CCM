import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSourcesStore } from '@/stores/useSourcesStore';
import { useSkillsStore } from '@/stores/useSkillsStore';
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
} from 'lucide-react';
import type { SourceDirectory } from '@/types';

export default function SourcesPage() {
  const navigate = useNavigate();
  const { sources, fetchSources, addSource, removeSource } = useSourcesStore();
  const { skills, fetchSkills } = useSkillsStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');

  useEffect(() => {
    fetchSources();
    fetchSkills();
  }, []);

  const handleAdd = async () => {
    if (!newName || !newPath) return;
    await addSource(newName, newPath);
    setNewName('');
    setNewPath('');
    setAddDialogOpen(false);
    fetchSkills(); // Refresh skills after adding source
  };

  const handleRemove = async (id: string) => {
    await removeSource(id);
    fetchSkills();
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
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                添加源目录
              </Button>
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
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">目录路径</label>
                  <Input
                    placeholder="例如：E:\workplace\ECC\skills"
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
    </div>
  );
}
