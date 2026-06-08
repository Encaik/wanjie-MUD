'use client';

import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Protagonist, BattleState, Technique, Equipment } from '@/lib/game/types';
import { MentalState } from '@/lib/game/typesExtension';

import { BattleResultDialog } from '../battle';
import { SaveLoadPanel } from '../sidebar/SaveLoadPanel';
import { StatusPanel } from '../sidebar/StatusPanel';

interface MobileLayoutProps {
  protagonist: Protagonist;
  cultivationPath?: Protagonist['cultivationPath'];
  pathLevel?: number;
  pathExp?: number;
  mentalState?: MentalState;
  battleState: BattleState | null;
  onReset: () => void;
  onExportSave: () => string;
  onImportSave: (content: string) => void;
  onCloseResult: () => void;
  TabsContentSection: React.ReactNode;
  /** 玩家功法信息 */
  playerTechniques?: Technique[];
  /** 玩家武器信息 */
  playerWeapons?: { melee: Equipment | null; ranged: Equipment | null };
}

export function MobileLayout({
  protagonist,
  cultivationPath,
  pathLevel,
  pathExp,
  mentalState,
  battleState,
  onReset,
  onExportSave,
  onImportSave,
  onCloseResult,
  TabsContentSection,
  playerTechniques = [],
  playerWeapons = { melee: null, ranged: null },
}: MobileLayoutProps) {
  return (
    <main className="flex-1 md:hidden overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-3 space-y-3">
        {/* 个人信息面板 - 完整展示 */}
        <StatusPanel 
          protagonist={protagonist}
        />
        
        {/* 重新开始按钮 */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs h-9"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          重新来过
        </Button>
        
        {/* 存档按钮 */}
        <SaveLoadPanel 
          onExportSave={onExportSave} 
          onImportSave={onImportSave}
          variant="mobile"
        />
        
        {/* Tabs 操作面板 */}
        {TabsContentSection}
        
        {/* 战斗记录弹窗 */}
        <BattleResultDialog
          open={!!battleState}
          onOpenChange={(open) => {
            if (!open) onCloseResult();
          }}
          battleState={battleState}
          onClose={onCloseResult}
          playerTechniques={playerTechniques}
          playerWeapons={playerWeapons}
        />
      </div>
    </main>
  );
}
