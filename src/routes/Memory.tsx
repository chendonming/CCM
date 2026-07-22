import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function MemoryPage() {
  const navigate = useNavigate();
  const { entries, graph, loading, scanMemory, getReferenceGraph } = useMemoryStore();
  const [memoryPath, setMemoryPath] = useState('');

  useEffect(() => {
    // Try the default Claude memory path
    const defaultPath = `${process.env.HOME || process.env.USERPROFILE || ''}\\.claude\\memory`;
    setMemoryPath(defaultPath);
  }, []);

  const handleScan = async () => {
    if (!memoryPath) return;
    await getReferenceGraph(memoryPath);
  };

  const orphans = graph?.orphan_references || [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Memory 管理器</h1>
          <p className="text-sm text-muted-foreground">
            浏览和管理 Claude Code 的 Memory 文件
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleScan} disabled={loading}>
          <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          扫描
        </Button>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">Memory 目录路径</label>
        <div className="flex gap-2">
          <Input
            value={memoryPath}
            onChange={(e) => setMemoryPath(e.target.value)}
            placeholder="~/.claude/memory/"
          />
        </div>
      </div>

      {orphans.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              发现 {orphans.length} 个孤儿引用
            </CardTitle>
            <CardDescription className="text-xs text-amber-600">
              以下引用指向不存在的 Memory 条目
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs">
              {orphans.slice(0, 10).map((orphan, i) => (
                <li key={i} className="text-amber-700">
                  {orphan}
                </li>
              ))}
              {orphans.length > 10 && (
                <li className="text-amber-500">...还有 {orphans.length - 10} 个</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">扫描中...</div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Database className="mx-auto mb-2 h-8 w-8" />
          <p>暂无 Memory 条目，请先指定路径并扫描</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(`/memory/${entry.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{entry.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {entry.entry_type || '参考'}
                  </Badge>
                </div>
                {entry.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {entry.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    引用 {entry.references.length} 处
                  </span>
                  <span>·</span>
                  <span>
                    被引 {entry.referenced_by.length} 处
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
