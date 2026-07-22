import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSkillsStore } from '@/stores/useSkillsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, GitBranch } from 'lucide-react';

export default function SkillImportPage() {
  const navigate = useNavigate();
  const { fetchSkills } = useSkillsStore();
  const [sshUrl, setSshUrl] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!sshUrl || !targetDir) return;
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await invoke<string>('import_from_github', {
        url: sshUrl,
        targetDir,
      });
      setResult(`成功导入到: ${path}`);
      await fetchSkills();
    } catch (err) {
      setError(String(err));
    }

    setImporting(false);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate('/skills')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回列表
        </Button>
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">从 GitHub 导入 SKILL</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>导入配置</CardTitle>
          <CardDescription>
            通过 SSH 链接克隆远程仓库中的 SKILL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">SSH 克隆地址</label>
            <Input
              placeholder="git@github.com:user/repo.git"
              value={sshUrl}
              onChange={(e) => setSshUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              支持 SSH 格式（推荐）和 HTTPS 格式
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">目标目录</label>
            <Input
              placeholder="例如：C:\Users\Admin\my-skills\imported\"
              value={targetDir}
              onChange={(e) => setTargetDir(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              克隆后的仓库将存放在此目录下
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-md bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-700 dark:text-green-300">
              {result}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/skills')}>
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || !sshUrl || !targetDir}
            >
              <Download className="mr-1 h-4 w-4" />
              {importing ? '导入中...' : '导入'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
