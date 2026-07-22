import { useEffect, useState } from 'react';
import { useSkillsStore } from '@/stores/useSkillsStore';
import { useSourcesStore } from '@/stores/useSourcesStore';
import { useNavigate, Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MoreHorizontal,
  Download,
  Globe,
  FolderGit2,
  PlusCircle,
  BookOpen,
} from 'lucide-react';
import type { Entity } from '@/types';

const languageLabel: Record<string, string> = {
  en: 'EN',
  zh: '中文',
  bilingual: '双语',
};

const languageColor: Record<string, string> = {
  en: 'bg-blue-100 text-blue-800',
  zh: 'bg-green-100 text-green-800',
  bilingual: 'bg-purple-100 text-purple-800',
};

export default function SkillsPage() {
  const navigate = useNavigate();
  const { skills, loading, filter, setFilter, fetchSkills } = useSkillsStore();
  const { fetchSources } = useSourcesStore();
  const [selectedSkill, setSelectedSkill] = useState<Entity | null>(null);

  useEffect(() => {
    fetchSkills();
    fetchSources();
  }, []);

  const filteredSkills = skills.filter((s) => {
    if (filter.category && s.category !== filter.category) return false;
    if (filter.language && s.language !== filter.language) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !s.description.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SKILL 管理器</h1>
          <p className="text-sm text-muted-foreground">
            共 {skills.length} 个技能 | 已筛选 {filteredSkills.length} 个
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSkills} disabled={loading}>
            <Download className="mr-1 h-4 w-4" />
            刷新
          </Button>
          <Button size="sm" onClick={() => navigate('/skills/new')}>
            <PlusCircle className="mr-1 h-4 w-4" />
            新建 SKILL
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索技能名称或描述..."
            className="pl-8"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>
        <Select
          value={filter.category}
          onValueChange={(v) => setFilter({ category: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.language}
          onValueChange={(v) => setFilter({ language: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="全部语言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部语言</SelectItem>
            <SelectItem value="en">英文</SelectItem>
            <SelectItem value="zh">中文</SelectItem>
            <SelectItem value="bilingual">双语</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>语言</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>部署</TableHead>
              <TableHead>Git</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredSkills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {skills.length === 0
                    ? '暂无 SKILL。请先在"源目录"中添加一个源目录。'
                    : '没有匹配的 SKILL。'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSkills.map((skill) => (
                <TableRow
                  key={skill.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/skills/${skill.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{skill.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {skill.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{skill.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${languageColor[skill.language] || ''}`}>
                      {languageLabel[skill.language] || skill.language}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {skill.origin || '-'}
                  </TableCell>
                  <TableCell>
                    {skill.deployments.length > 0 ? (
                      <div className="flex gap-1">
                        {skill.deployments.map((d, i) => (
                          <Badge key={i} variant="default" className="text-xs">
                            {d.target.type === 'global' ? (
                              <Globe className="mr-1 h-3 w-3" />
                            ) : (
                              <FolderGit2 className="mr-1 h-3 w-3" />
                            )}
                            {d.target.type === 'global' ? '全局' : '项目'}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">未部署</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {skill.is_git_repo ? (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600"
                      >
                        已跟踪
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/skills/${skill.id}`)}>
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/skills/${skill.id}/edit`)}
                          disabled={skill.is_git_repo}
                        >
                          编辑
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
