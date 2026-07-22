import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/ThemeProvider';
import { MessageToast } from '@/components/MessageToast';

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <MessageToast />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
