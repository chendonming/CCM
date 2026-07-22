import { useCallback } from 'react';
import { useMessageStore, type MessageType } from '@/stores/useMessageStore';

export function useMessage() {
  const showMessage = useMessageStore((s) => s.showMessage);

  const success = useCallback(
    (content: string) => showMessage(content, 'success'),
    [showMessage],
  );
  const error = useCallback(
    (content: string) => showMessage(content, 'error'),
    [showMessage],
  );
  const warning = useCallback(
    (content: string) => showMessage(content, 'warning'),
    [showMessage],
  );
  const info = useCallback(
    (content: string) => showMessage(content, 'info'),
    [showMessage],
  );

  return { success, error, warning, info };
}
