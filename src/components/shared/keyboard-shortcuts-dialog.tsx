'use client';

import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useKeyboardShortcut, shortcuts } from '@/hooks/use-keyboard-shortcut';

interface KeyboardShortcutsDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ isOpen: controlledOpen, onOpenChange }: KeyboardShortcutsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  // Open with ? key
  useKeyboardShortcut('?', () => setIsOpen(true), { ignoreInputs: true });

  const categories = [
    { key: 'global', title: 'ძირითადი' },
    { key: 'navigation', title: 'ნავიგაცია' },
    { key: 'actions', title: 'მოქმედებები' },
  ];

  const formatKey = (key: string) => {
    return key
      .replace(/mod/gi, '⌘')
      .replace(/shift/gi, '⇧')
      .replace(/alt/gi, '⌥')
      .replace(/\+/g, ' ')
      .toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            კლავიატურის მალსახმობები
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          {categories.map((category) => (
            <div key={category.key}>
              <h3 className="font-semibold text-gray-900 mb-3">
                {category.title}
              </h3>
              <div className="space-y-2">
                {Object.entries(shortcuts[category.key as keyof typeof shortcuts] || {}).map(([name, shortcut]) => (
                  <div key={name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-700"
                        >
                          {formatKey(key)}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 text-center">
          <p className="text-xs text-gray-500">
            დააჭირეთ <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">?</kbd> კლავიშს ამ ფანჯრის გასახსნელად
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default KeyboardShortcutsDialog;
