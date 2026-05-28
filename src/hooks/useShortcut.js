import { useEffect } from 'react';

export function useShortcut(combo, handler, { enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const parts = combo.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needCtrlOrMeta = parts.includes('mod') || parts.includes('ctrl') || parts.includes('cmd');
    const needShift = parts.includes('shift');
    const needAlt = parts.includes('alt');

    const onKey = (e) => {
      const matchesKey = e.key.toLowerCase() === key;
      if (!matchesKey) return;
      if (needCtrlOrMeta && !(e.metaKey || e.ctrlKey)) return;
      if (needShift && !e.shiftKey) return;
      if (needAlt && !e.altKey) return;

      e.preventDefault();
      handler(e);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [combo, handler, enabled]);
}
