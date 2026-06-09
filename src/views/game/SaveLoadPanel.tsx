'use client';

import { useState } from 'react';
import { Download, Upload, X } from 'lucide-react';

import { Button } from '@/shared/ui/button';

interface SaveLoadPanelProps {
  onExportSave: () => string;
  onImportSave: (content: string) => void;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export function SaveLoadPanel({
  onExportSave,
  onImportSave,
  variant = 'desktop',
  className = ''
}: SaveLoadPanelProps) {
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const saveData = onExportSave();
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `存档_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            onImportSave(content);
          } catch {
            setImportError('导入失败：存档格式无效');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-9"
          onClick={handleExport}
        >
          <Download className="w-4 h-4 mr-1.5" />
          导出存档
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-9"
          onClick={handleImport}
        >
          <Upload className="w-4 h-4 mr-1.5" />
          导入存档
        </Button>
      </div>
      {importError && (
        <div className="flex items-center gap-1 mt-1.5 p-1.5 rounded bg-destructive/10 border border-destructive/30 text-destructive text-[11px]">
          <X className="w-3 h-3 shrink-0" />
          <span>{importError}</span>
          <button
            className="ml-auto p-0.5 rounded hover:bg-destructive/20 transition-colors"
            onClick={() => setImportError(null)}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
