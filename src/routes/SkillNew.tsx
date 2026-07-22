import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSkillsStore } from '@/stores/useSkillsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { BUILTIN_CATEGORIES } from '@/types';

export default function SkillNewPage() {
  const navigate = useNavigate();
  const { fetchSkills } = useSkillsStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('未分类');
  const [entityType, setEntityType] = useState('skill');
  const [targetDir, setTargetDir] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name || !targetDir) return;
    setCreating(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const filePath = await invoke<string>('create_new_skill', {
        name,
        description,
        category,
        entityType,
        targetDir,
      });
      await fetchSkills();
      // Navigate to edit page
      const { skills } = await import('@/stores/useSkillsStore');
      const skill = skills.getState().skills.find((s) => s.name === name);
      if (skill) {
        navigate(`/skills/${skill.id}/edit`);
      } else {
        navigate('/skills');
      }
    } catch (err) {
      console.error('Failed to create skill:', err);
    }
    setCreating(false);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate('/skills')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回列表
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">新建 SKILL</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SKILL 信息</CardTitle>
          <CardDescription>
            创建一个新的 Skill/Agent/Rule 实体文件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">实体类型</label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skill">SKILL</SelectItem>
                <SelectItem value="agent">AGENT</SelectItem>
                <SelectItem value="rule">RULE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">名称</label>
            <Input
              placeholder="例如：my-awesome-skill"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">描述</label>
            <Textarea
              placeholder="描述这个技能的作用..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">分类</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUILTIN_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">目标目录</label>
            <Input
              placeholder="SKILL 文件存放的目录路径"
              value={targetDir}
              onChange={(e) => setTargetDir(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              例如：C:\Users\Admin\my-skills\ 或 E:\workplace\ECC\skills\
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => navigate('/skills')}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name || !targetDir}>
              <Save className="mr-1 h-4 w-4" />
              {creating ? '创建中...' : '创建'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
