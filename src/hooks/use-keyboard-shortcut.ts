'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  ignoreInputs?: boolean;
}

export function useKeyboardShortcut(
  keys: string | string[],
  callback: () => void,
  options: ShortcutOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    ignoreInputs = true,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if typing in input
    if (ignoreInputs) {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
    }

    const keysArray = Array.isArray(keys) ? keys : [keys];
    const pressed = formatKeyEvent(event);
    if (!pressed) return; // Guard against undefined event.key

    if (keysArray.some(k => matchKeys(pressed, k))) {
      if (preventDefault) {
        event.preventDefault();
      }
      callback();
    }
  }, [keys, callback, enabled, preventDefault, ignoreInputs]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

function formatKeyEvent(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey || event.metaKey) parts.push('mod');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');

  // Normalize key - guard against undefined event.key
  if (!event.key) return '';
  let key = event.key.toLowerCase();
  if (key === ' ') key = 'space';
  if (key === 'escape') key = 'esc';

  parts.push(key);

  return parts.join('+');
}

function matchKeys(pressed: string, shortcut: string): boolean {
  // Normalize shortcut
  const normalized = shortcut
    .toLowerCase()
    .replace(/ctrl|cmd|meta/g, 'mod')
    .replace(/\s/g, '');
  
  return pressed === normalized;
}

// Predefined shortcuts configuration
export const shortcuts = {
  global: {
    search: { keys: ['mod+k'], description: 'ძიება' },
    newCase: { keys: ['mod+shift+c'], description: 'ახალი ქეისი' },
    newInvoice: { keys: ['mod+shift+i'], description: 'ახალი ინვოისი' },
    help: { keys: ['?'], description: 'კლავიატურის მალსახმობები' },
  },
  navigation: {
    dashboard: { keys: ['g d'], description: 'დეშბორდი' },
    cases: { keys: ['g c'], description: 'ქეისები' },
    invoices: { keys: ['g i'], description: 'ინვოისები' },
    partners: { keys: ['g p'], description: 'პარტნიორები' },
  },
  actions: {
    save: { keys: ['mod+s'], description: 'შენახვა' },
    close: { keys: ['esc'], description: 'დახურვა' },
    refresh: { keys: ['r'], description: 'განახლება' },
  },
};

export default useKeyboardShortcut;
