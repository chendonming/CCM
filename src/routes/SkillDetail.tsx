import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSkillsStore } from '@/stores/useSkillsStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Globe,
  FolderGit2,
  Trash2,
  Languages,
  GitBranch,
  ExternalLink,
  Edit,
  BookOpen,
} from 'lucide-react';
import type { Entity } from '@/types';

const languageLabel: Record<string, string> = {
  en: '英文',
  zh: '中文',
  bilingual: '双语',
};

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { skills, fetchSkills, deploySkill, undeploySkill } = useSkillsStore();
  const [skill, setSkill] = useState<Entity | null>(null);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployTarget, setDeployTarget] = useState('global');
  const [loading, setLoading] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [gitStatus, setGitStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (skills.length > 0 && id) {
      const found = skills.find((s) => s.id === id);
      setSkill(found || null);

      // Check for translation
      if (found) {
        checkTranslation(found.id);
        if (found.is_git_repo && found.remote_url) {
          checkGitStatus(found.resource_dir);
        }
      }
    }
  }, [skills, id]);

  const checkTranslation = async (skillId: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const has = await invoke<boolean>('has_translation', { skillId });
      if (has) {
        const content = await invoke<string | null>('get_translation', { skillId });
        setTranslatedContent(content);
      }
    } catch { /* ignore */ }
  };

  const checkGitStatus = async (path: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const status = await invoke<string>('check_git_updates', { path });
      setGitStatus(status);
    } catch { /* ignore */ }
  };

  const handleTranslate = async () => {
    if (!skill) return;
    setTranslationLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      // First get the full content
      const content = await invoke<string>('get_skill_content', { path: skill.source_path });
      const translated = await invoke<string>('translate_skill', {
        skillId: skill.id,
        body: content,
      });
      setTranslatedContent(translated);
    } catch (err) {
      console.error('Translation failed:', err);
    }
    setTranslationLoading(false);
  };

  const handleDeploy = async () => {
    if (!skill) return;
    setLoading(true);
    try {
      await deploySkill(
        skill.source_path,
        deployTarget,
        deployTarget === 'project' ? undefined : undefined,
      );
      setDeployDialogOpen(false);
    } catch (err) {
      console.error('Deploy failed:', err);
    }
    setLoading(false);
  };

  const handleUndeploy = async (targetPath: string) => {
    try {
      await undeploySkill(targetPath);
    } catch (err) {
      console.error('Undeploy failed:', err);
    }
  };

  if (!skill) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => navigate('/skills')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回列表
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">{skill.name}</h1>
              <Badge variant="secondary">{skill.category}</Badge>
              <span className="text-xs text-muted-foreground">
                {languageLabel[skill.language] || skill.language}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{skill.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTranslate}
              disabled={translationLoading}
            >
              <Languages className="mr-1 h-4 w-4" />
              {translatedContent ? '重新翻译' : '翻译为中文'}
            </Button>
            <Link to={`/skills/${skill.id}/edit`}>
              <Button variant="outline" size="sm" disabled={skill.is_git_repo}>
                <Edit className="mr-1 h-4 w-4" />
                编辑
              </Button>
            </Link>
            <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">部署技能</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>部署 {skill.name}</DialogTitle>
                  <DialogDescription>
                    选择部署目标位置
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Select value={deployTarget} onValueChange={setDeployTarget}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          全局 (~/.claude/skills/)
                        </div>
                      </SelectItem>
                      <SelectItem value="project">
                        <div className="flex items-center gap-2">
                          <FolderGit2 className="h-4 w-4" />
                          项目级
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {deployTarget === 'project' && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      // TODO: 项目级部署需要选择一个项目路径
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeployDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleDeploy} disabled={loading}>
                    确认部署
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2">
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">预览</TabsTrigger>
              <TabsTrigger value="translated" disabled={!translatedContent}>
                中文翻译
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardContent className="prose prose-sm max-w-none p-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {`# ${skill.name}\n\n${skill.description}\n\n${skill.body}`}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="translated" className="mt-4">
              <Card>
                <CardContent className="prose prose-sm max-w-none p-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {translatedContent || ''}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">部署状态</CardTitle>
            </CardHeader>
            <CardContent>
              {skill.deployments.length > 0 ? (
                <div className="space-y-2">
                  {skill.deployments.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {d.target.type === 'global' ? (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">
                          {d.target.type === 'global' ? '全局' : '项目'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUndeploy(d.target_path)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">未部署</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">文件信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">路径</span>
                <span className="font-mono text-xs truncate max-w-[160px]">
                  {skill.source_path}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">来源</span>
                <span>{skill.origin || '未知'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">类型</span>
                <span className="capitalize">{skill.entity_type}</span>
              </div>
            </CardContent>
          </Card>

          {skill.is_git_repo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Git 状态</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  {skill.remote_url ? (
                    <span className="text-xs truncate max-w-[200px]">
                      {skill.remote_url}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">无远程仓库</span>
                  )}
                </div>
                {gitStatus && (
                  <Badge variant={gitStatus === 'up_to_date' ? 'outline' : 'secondary'}>
                    {gitStatus === 'up_to_date' ? '已是最新' : gitStatus === 'behind' ? '有更新' : '状态未知'}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
