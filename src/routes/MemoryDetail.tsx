import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Trash2,
  Link,
  Link2Off,
  AlertTriangle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { entries, graph, deleteMemory } = useMemoryStore();
  const [memoryPath, setMemoryPath] = useState(
    `${process.env.HOME || process.env.USERPROFILE || ''}\\.claude\\memory`,
  );

  const entry = entries.find((e) => e.id === id);

  const handleDelete = async () => {
    if (!entry || !confirm(`确定删除 "${entry.name}"？相关的引用将会被自动清理。`))
      return;
    const cleaned = await deleteMemory(memoryPath, entry.id);
    alert(`已删除并清理了 ${cleaned} 处引用`);
    navigate('/memory');
  };

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">条目未找到</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => navigate('/memory')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回列表
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{entry.name}</h1>
            <p className="text-sm text-muted-foreground">{entry.description}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">内容</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {entry.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Link className="h-4 w-4" />
                引用 ({entry.references.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entry.references.length > 0 ? (
                <ul className="space-y-1">
                  {entry.references.map((ref, i) => {
                    const exists = entries.some((e) => e.name === ref);
                    return (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {exists ? (
                          <Link className="h-3 w-3 text-green-500" />
                        ) : (
                          <Link2Off className="h-3 w-3 text-amber-500" />
                        )}
                        <span className={exists ? '' : 'text-amber-600 line-through'}>
                          {ref}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">无引用</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                被引用 ({entry.referenced_by.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entry.referenced_by.length > 0 ? (
                <ul className="space-y-1">
                  {entry.referenced_by.map((ref, i) => (
                    <li key={i} className="text-sm">
                      {ref}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">没有被引用</p>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            文件路径：{entry.file_path}
          </div>
        </div>
      </div>
    </div>
  );
}
