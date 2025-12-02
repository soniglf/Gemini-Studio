import { useEffect } from 'react';

interface ShortcutHandlers {
    onGenerate?: () => void;
    onCancel?: () => void;
    onSave?: () => void;
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support both Mac (Meta) and Windows/Linux (Ctrl)
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      
      // Trigger Generate: Cmd+Enter or Ctrl+Enter
      if (cmdOrCtrl && e.key === 'Enter') {
          e.preventDefault();
          if (handlers.onGenerate) handlers.onGenerate();
      }
      
      // Trigger Cancel/Close: Escape
      if (e.key === 'Escape') {
          if (handlers.onCancel) handlers.onCancel();
      }

      // Trigger Save/Export: Cmd+S or Ctrl+S
      if (cmdOrCtrl && e.key === 's') {
          e.preventDefault();
          if (handlers.onSave) handlers.onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};