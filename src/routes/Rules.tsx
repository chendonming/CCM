import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';

export default function RulesPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">RULES 管理</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          浏览和管理 Claude Code 的 RULES 配置文件（与 SKILL 共享管理引擎）
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            RULES 管理说明
          </CardTitle>
          <CardDescription>
            RULES 与 SKILL 共享同一套管理引擎。您可以在 SKILL 页面中查看和管理 RULE 类型的实体。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            RULE 配置文件通常命名为 <code className="rounded bg-muted px-1">RULE.md</code>，存放在技能目录中。
          </p>
          <p className="text-sm">
            在 SKILL 管理器中，使用类型筛选器选择 "rule" 即可查看所有 RULE。
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/skills')}>
            前往 SKILL 管理器
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
