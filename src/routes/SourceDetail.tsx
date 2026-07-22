import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSourcesStore } from '@/stores/useSourcesStore';
import { useSkillsStore } from '@/stores/useSkillsStore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen } from 'lucide-react';
import type { Entity } from '@/types';

export default function SourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sources } = useSourcesStore();
  const { skills, fetchSkills } = useSkillsStore();
  const [sourceSkills, setSourceSkills] = useState<Entity[]>([]);

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (id && skills.length > 0) {
      const source = sources.find((s) => s.id === id);
      if (source) {
        setSourceSkills(
          skills.filter((s) => s.source_path.startsWith(source.path)),
        );
      }
    }
  }, [id, skills, sources]);

  const source = sources.find((s) => s.id === id);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => navigate('/sources')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回源目录列表
        </Button>
        <h1 className="text-2xl font-bold">{source?.name || '未知源目录'}</h1>
        <p className="text-sm text-muted-foreground font-mono">{source?.path}</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>语言</TableHead>
              <TableHead>部署</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sourceSkills.map((skill) => (
              <TableRow
                key={skill.id}
                className="cursor-pointer"
                onClick={() => navigate(`/skills/${skill.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{skill.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{skill.category}</Badge>
                </TableCell>
                <TableCell className="capitalize">{skill.entity_type}</TableCell>
                <TableCell>{skill.language}</TableCell>
                <TableCell>
                  {skill.deployments.length > 0
                    ? `${skill.deployments.length} 处部署`
                    : '未部署'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
