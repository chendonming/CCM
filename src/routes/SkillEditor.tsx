import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSkillsStore } from '@/stores/useSkillsStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';

export default function SkillEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { skills, fetchSkills } = useSkillsStore();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (id && skills.length > 0) {
      const skill = skills.find((s) => s.id === id);
      if (skill) {
        loadContent(skill.source_path);
      }
    }
  }, [id, skills]);

  const loadContent = async (path: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const text = await invoke<string>('get_skill_content', { path });
      setContent(text);
      setOriginalContent(text);
    } catch (err) {
      console.error('Failed to load content:', err);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const skill = skills.find((s) => s.id === id);
      if (skill) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_skill_content', { path: skill.source_path, content });
        setOriginalContent(content);
        setDirty(false);
      }
    } catch (err) {
      console.error('Failed to save:', err);
    }
    setSaving(false);
  };

  const skill = skills.find((s) => s.id === id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/skills/${id}`)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回
          </Button>
          <span className="text-sm font-medium">
            {skill?.name || '加载中...'}
          </span>
          {skill?.is_git_repo && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              只读（Git 仓库中的 SKILL）
            </span>
          )}
        </div>
        {!skill?.is_git_repo && (
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={content}
          onChange={(val) => {
            setContent(val);
            setDirty(val !== originalContent);
          }}
          extensions={[markdown({ base: markdownLanguage }), yamlLang()]}
          theme={oneDark}
          height="100%"
          readOnly={skill?.is_git_repo}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
          }}
        />
      </div>
    </div>
  );
}
