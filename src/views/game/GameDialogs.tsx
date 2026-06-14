'use client';

import { AlertTriangle, LogOut, PartyPopper, Trophy } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { isDebugMode } from '@/shared/config/env';
import { Protagonist, Technique, Equipment, InventoryItem } from '@/core/types';
import { NewWorldInfo, InheritanceChoice } from '@/core/types';

import { InheritanceSelect } from './InheritanceSelect';
import { WorldReveal } from './WorldReveal';
import { GuardianBattle } from '@/modules/combat/components/GuardianBattle';
import { DeveloperPanel } from '@/shared/components/DeveloperPanel';
import { UpgradePanel } from '@/views/game/UpgradePanel';


// Props 类型
interface UpgradeTarget {
  item: Technique | Equipment;
  type: 'technique' | 'equipment';
}

interface GameDialogsProps {
  // 重置相关
  showResetConfirm: boolean;
  onCloseResetConfirm: () => void;
  onReset: () => void;
  
  // 机缘退出相关
  showExitConfirm: boolean;
  adventureLoot: InventoryItem[];
  isExplorationComplete?: boolean; // 探索是否完成
  isBossDefeated?: boolean; // 是否打败了Boss
  onCloseExitConfirm: () => void;
  onExitAdventure: (exitType?: 'completed' | 'stamina_exhausted' | 'quit' | 'fled') => void;
  
  // 新手引导完成弹窗
  showNoviceCompletionDialog?: boolean;
  onCloseNoviceCompletionDialog?: () => void;
  
  // 新手任务全部完成弹窗
  showTutorialCompletionDialog?: boolean;
  onCloseTutorialCompletionDialog?: () => void;
  
  // 升级相关
  upgradeTarget: UpgradeTarget | null;
  onCloseUpgradeTarget: () => void;
  protagonist: Protagonist;
  onUpgradeTechnique: (targetId: string, materialIds: string[]) => void;
  onUpgradeEquipment: (targetId: string, materialIds: string[]) => void;
  
  // 开发者模式
  devHandlers?: Record<string, any>;
  devInvincible?: boolean;
  onToggleDevInvincible?: () => void;
  
  // 飞升相关
  showGuardianBattle: boolean;
  onOpenChangeGuardianBattle: (open: boolean) => void;
  ascensionBattleEndedRef: React.MutableRefObject<boolean>;
  onAscensionBattleEnd?: (result: any) => void;
  
  showInheritanceSelect: boolean;
  onInheritanceConfirm?: (choice: InheritanceChoice) => void;
  onInheritanceSkip?: () => void;
  
  showWorldReveal: boolean;
  ascensionNewWorld: NewWorldInfo | null;
  onWorldConfirm?: (world: NewWorldInfo) => void;
  onWorldReroll?: () => void;
}

export function GameDialogs({
  showResetConfirm,
  onCloseResetConfirm,
  onReset,
  showExitConfirm,
  adventureLoot,
  isExplorationComplete,
  isBossDefeated,
  onCloseExitConfirm,
  onExitAdventure,
  showNoviceCompletionDialog,
  onCloseNoviceCompletionDialog,
  showTutorialCompletionDialog,
  onCloseTutorialCompletionDialog,
  upgradeTarget,
  onCloseUpgradeTarget,
  protagonist,
  onUpgradeTechnique,
  onUpgradeEquipment,
  devHandlers,
  devInvincible,
  onToggleDevInvincible,
  showGuardianBattle,
  ascensionBattleEndedRef,
  onAscensionBattleEnd,
  showInheritanceSelect,
  onInheritanceConfirm,
  onInheritanceSkip,
  showWorldReveal,
  ascensionNewWorld,
  onWorldConfirm,
  onWorldReroll,
}: GameDialogsProps) {
  return (
    <>
      {/* 重新开始确认弹窗 */}
      <Dialog open={showResetConfirm} onOpenChange={onCloseResetConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif tracking-[0.1em]">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              确认重新开始
            </DialogTitle>
            <DialogDescription>
              当前角色的所有进度将被清空，包括等级、装备、物品等。确认要重新选择化身吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={onCloseResetConfirm}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onCloseResetConfirm();
                onReset();
              }}
            >
              确认重开
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 退出机缘确认弹窗 */}
      <Dialog open={showExitConfirm} onOpenChange={onCloseExitConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif tracking-[0.1em]">
              <LogOut className="w-5 h-5" />
              {isBossDefeated ? '完成机缘' : '确认退出机缘'}
            </DialogTitle>
            <DialogDescription>
              {isBossDefeated 
                ? adventureLoot.length > 0 
                  ? `恭喜击败Boss！你已获得 ${adventureLoot.length} 种战利品，确认退出将获得全部奖励。`
                  : '恭喜击败Boss！确认退出将完成本次机缘探索。'
                : adventureLoot.length > 0 
                  ? `主动退出将丢失50%的战利品。当前有 ${adventureLoot.length} 种战利品。`
                  : '确认要中途退出当前的机缘探索吗？退出将丢失50%的战利品。'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={onCloseExitConfirm}>
              继续探索
            </Button>
            <Button 
              variant={isBossDefeated ? "default" : "destructive"} 
              onClick={() => {
                onCloseExitConfirm();
                // 打败Boss才算完成，否则是主动退出（有惩罚）
                onExitAdventure(isBossDefeated ? 'completed' : 'quit');
              }}
            >
              {isBossDefeated ? '完成机缘' : '确认退出'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 新手引导完成弹窗 */}
      <Dialog open={showNoviceCompletionDialog} onOpenChange={onCloseNoviceCompletionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500 font-serif tracking-[0.1em]">
              <PartyPopper className="w-5 h-5" />
              新手引导完成！
            </DialogTitle>
            <DialogDescription className="text-base">
              恭喜你完成了新手机缘探索！
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            <p>你已掌握机缘探索的基本玩法，现在可以挑战更高难度的机缘了！</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>更高难度的机缘有更好的奖励</li>
              <li>击败Boss可获得稀有功法和装备碎片</li>
              <li>探索完成后记得领取战利品</li>
            </ul>
          </div>
          <DialogFooter>
            <Button 
              className="w-full"
              onClick={() => onCloseNoviceCompletionDialog?.()}
            >
              开始新的冒险！
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 新手任务全部完成弹窗 */}
      <Dialog open={showTutorialCompletionDialog} onOpenChange={onCloseTutorialCompletionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500 font-serif tracking-[0.1em]">
              <Trophy className="w-5 h-5" />
              新手任务全部完成！
            </DialogTitle>
            <DialogDescription className="text-base">
              恭喜你完成了所有新手引导任务！
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            <p>你已掌握了修仙世界的基本玩法，正式踏上修仙之路！</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>继续修炼提升境界</li>
              <li>加入势力获取更多资源</li>
              <li>挑战更高难度的机缘</li>
              <li>收集稀有功法和装备</li>
            </ul>
          </div>
          <DialogFooter>
            <Button 
              className="w-full"
              onClick={() => onCloseTutorialCompletionDialog?.()}
            >
              继续修仙之旅！
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 升级面板弹窗 */}
      <Dialog open={!!upgradeTarget} onOpenChange={(open) => !open && onCloseUpgradeTarget()}>
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          <DialogTitle className="sr-only">升级面板</DialogTitle>
          {upgradeTarget && (
            <UpgradePanel
              targetItem={upgradeTarget.item}
              allItems={upgradeTarget.type === 'technique' ? protagonist.techniques : protagonist.equipments}
              onClose={onCloseUpgradeTarget}
              onConfirm={(targetId, materialIds, type) => {
                if (type === 'technique') {
                  onUpgradeTechnique(targetId, materialIds);
                  const upgradedItem = protagonist.techniques.find(t => t.id === targetId);
                  return upgradedItem ? { upgradedItem } : null;
                } else {
                  onUpgradeEquipment(targetId, materialIds);
                  const upgradedItem = protagonist.equipments.find(e => e.id === targetId);
                  return upgradedItem ? { upgradedItem } : null;
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* 开发者面板 */}
      {isDebugMode() && devHandlers && (
        <DeveloperPanel
          protagonist={protagonist}
          devInvincible={devInvincible}
          onToggleDevInvincible={onToggleDevInvincible}
          onUpdateLevel={devHandlers.onUpdateLevel}
          onUpdateExperience={devHandlers.onUpdateExperience}
          onUpdateHp={devHandlers.onUpdateHp}
          onUpdateMp={devHandlers.onUpdateMp}
          onUpdateStat={devHandlers.onUpdateStat}
          onUpdateMentalState={devHandlers.onUpdateMentalState}
          onUpdatePathLevel={devHandlers.onUpdatePathLevel}
          onAddItem={devHandlers.onAddItem}
          onAddSpiritStones={devHandlers.onAddSpiritStones}
          onAddTechnique={devHandlers.onAddTechnique}
          onAddEquipment={devHandlers.onAddEquipment}
          onAddTechniqueByConfig={devHandlers.onAddTechniqueByConfig}
          onAddEquipmentByConfig={devHandlers.onAddEquipmentByConfig}
          onSetCultivationPath={devHandlers.onSetCultivationPath}
          onTriggerBreakthrough={devHandlers.onTriggerBreakthrough}
          onTriggerTribulation={devHandlers.onTriggerTribulation}
          onTriggerDemon={devHandlers.onTriggerDemon}
          onResetCooldowns={devHandlers.onResetCooldowns}
          onSetWorldType={devHandlers.onSetWorldType}
          onFullRestore={devHandlers.onFullRestore}
          onAddAllItems={devHandlers.onAddAllItems}
          onMaxStats={devHandlers.onMaxStats}
        />
      )}
      
      {/* 飞升系统 - 守卫战斗对话框 */}
      <GuardianBattle
        open={showGuardianBattle}
        onOpenChange={(open) => {
          if (!open) {
            if (ascensionBattleEndedRef.current) {
              ascensionBattleEndedRef.current = false;
              return;
            }
            if (onAscensionBattleEnd) {
              onAscensionBattleEnd({ victory: false, turnsUsed: 0, remainingHpPercent: 0, phasesCleared: 0 });
            }
          }
        }}
        protagonist={protagonist}
        devInvincible={devInvincible}
        onBattleEnd={(result) => {
          ascensionBattleEndedRef.current = true;
          if (onAscensionBattleEnd) {
            onAscensionBattleEnd(result);
          }
        }}
      />
      
      {/* 飞升系统 - 传承选择对话框 */}
      <InheritanceSelect
        open={showInheritanceSelect}
        onOpenChange={() => {}}
        protagonist={protagonist}
        ascensionCount={protagonist.ascensionMark?.count ?? 0}
        onConfirm={(choice) => onInheritanceConfirm?.(choice)}
        onSkip={() => onInheritanceSkip?.()}
      />
      
      {/* 飞升系统 - 世界揭示对话框 */}
      {ascensionNewWorld && (
        <WorldReveal
          open={showWorldReveal}
          onOpenChange={() => {}}
          newWorld={ascensionNewWorld}
          hasReroll={protagonist.ascensionMark?.rerollAvailable ?? false}
          onConfirm={() => onWorldConfirm?.(ascensionNewWorld)}
          onReroll={() => onWorldReroll?.()}
        />
      )}
    </>
  );
}
