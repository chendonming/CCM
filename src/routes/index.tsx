import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import SkillsPage from '@/routes/Skills';
import SkillDetailPage from '@/routes/SkillDetail';
import SkillEditorPage from '@/routes/SkillEditor';
import SkillNewPage from '@/routes/SkillNew';
import SkillImportPage from '@/routes/SkillImport';
import SourcesPage from '@/routes/Sources';
import SourceDetailPage from '@/routes/SourceDetail';
import MemoryPage from '@/routes/Memory';
import MemoryDetailPage from '@/routes/MemoryDetail';
import AgentsPage from '@/routes/Agents';
import RulesPage from '@/routes/Rules';
import SettingsPage from '@/routes/Settings';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/skills" replace /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'skills/new', element: <SkillNewPage /> },
      { path: 'skills/import', element: <SkillImportPage /> },
      { path: 'skills/:id', element: <SkillDetailPage /> },
      { path: 'skills/:id/edit', element: <SkillEditorPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'sources/:id', element: <SourceDetailPage /> },
      { path: 'memory', element: <MemoryPage /> },
      { path: 'memory/:id', element: <MemoryDetailPage /> },
      { path: 'agents', element: <AgentsPage /> },
      { path: 'rules', element: <RulesPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
