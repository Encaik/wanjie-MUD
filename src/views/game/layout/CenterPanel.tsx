'use client';

import { BattleState, Technique, Equipment } from '@/core/types';
import { BattleResultDialog } from '@/modules/combat/components';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';

interface CenterPanelProps {
  TabsContentSection: React.ReactNode;
  battleState: BattleState | null;
  onCloseResult: () => void;
  /** 玩家功法信息 */
  playerTechniques?: Technique[];
  /** 玩家武器信息 */
  playerWeapons?: { melee: Equipment | null; ranged: Equipment | null };
}

export function CenterPanel({ 
  TabsContentSection, 
  battleState, 
  onCloseResult,
  playerTechniques = [],
  playerWeapons = { melee: null, ranged: null },
}: CenterPanelProps) {
  return (
    <>
      <div className="col-span-8 lg:col-span-6 h-full overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-1">
            {TabsContentSection}
          </div>
        </ScrollArea>
      </div>
      
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
    </>
  );
}
