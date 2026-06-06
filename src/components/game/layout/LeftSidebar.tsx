'use client';

import { Protagonist } from '@/lib/game/types';
import { MentalState } from '@/lib/game/typesExtension';
import { StatusPanel } from '../sidebar/StatusPanel';
import { WorldInfoPanel } from '../sidebar/WorldInfoPanel';
import { SaveLoadPanel } from '../sidebar/SaveLoadPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface LeftSidebarProps {
  protagonist: Protagonist;
  cultivationPath?: Protagonist['cultivationPath'];
  pathLevel?: number;
  pathExp?: number;
  mentalState?: MentalState;
  onReset: () => void;
  onExportSave: () => string;
  onImportSave: (content: string) => void;
}

export function LeftSidebar({
  protagonist,
  cultivationPath,
  pathLevel,
  pathExp,
  mentalState,
  onReset,
  onExportSave,
  onImportSave,
}: LeftSidebarProps) {
  return (
    <div className="col-span-4 lg:col-span-3 h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="space-y-3 pr-1">
          <StatusPanel 
            protagonist={protagonist}
          />
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs h-9"
            onClick={onReset}
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            重新来过
          </Button>
          
          <SaveLoadPanel 
            onExportSave={onExportSave} 
            onImportSave={onImportSave}
          />
          
          <WorldInfoPanel world={protagonist.world} />
        </div>
      </ScrollArea>
    </div>
  );
}
