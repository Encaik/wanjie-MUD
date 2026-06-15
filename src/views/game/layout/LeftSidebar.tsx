'use client';

import { RotateCcw } from 'lucide-react';

import type { Protagonist, MentalState } from '@/core/types';
import { Button } from '@/shared/ui/actions/button';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';

import { SaveLoadPanel } from '../cards/SaveLoadPanel';
import { StatusPanel } from '../cards/StatusPanel';
import { WorldInfoPanel } from '../cards/WorldInfoPanel';


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
            cultivationPath={cultivationPath}
            pathLevel={pathLevel}
            pathExp={pathExp}
            mentalState={mentalState}
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
