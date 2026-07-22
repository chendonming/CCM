import { useMessageStore } from '@/stores/useMessageStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const styles = {
  success:
    'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300',
  error: 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
  warning:
    'border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  info: 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
} as const;

function MessageItem({
  id,
  type,
  content,
}: {
  id: number;
  type: keyof typeof styles;
  content: string;
}) {
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const Icon = iconMap[type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 shadow-lg transition-all duration-300 ${
        styles[type]
      } ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-sm">{content}</p>
      <button
        onClick={() => removeMessage(id)}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function MessageToast() {
  const messages = useMessageStore((s) => s.messages);

  if (messages.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-80 flex-col gap-2">
      {messages.map((msg) => (
        <MessageItem key={msg.id} id={msg.id} type={msg.type} content={msg.content} />
      ))}
    </div>
  );
}
