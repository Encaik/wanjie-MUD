'use client';

import { Download, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
            alert('导入失败：存档格式无效');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 移动端布局：grid-cols-2
  // PC端布局：grid grid-cols-2 gap-2
  const containerClass = variant === 'mobile' 
    ? `grid grid-cols-2 gap-2 ${className}`
    : `grid grid-cols-2 gap-2 ${className}`;

  return (
    <div className={containerClass}>
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
  );
}
