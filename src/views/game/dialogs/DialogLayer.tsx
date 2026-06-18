/**
 * DialogLayer — 弹窗渲染层
 *
 * 读取弹窗注册表，渲染所有活跃弹窗。
 * 在 GameLayout 中渲染一次。
 */

'use client';

import { AlertTriangle, LogOut, PartyPopper, Trophy } from 'lucide-react';

import type { Equipment, InheritanceChoice, NewWorldInfo, Protagonist, Technique } from '@/core/types';
import { GuardianBattle } from '@/modules/combat/components/GuardianBattle';
import { DeveloperPanel } from '@/shared/components/DeveloperPanel';
import { isDebugMode } from '@/shared/config/env';
import { Button } from '@/shared/ui/actions/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/overlay/dialog';

import { InheritanceSelect } from './InheritanceSelect';
import { UpgradePanel } from './UpgradePanel';
import { closeDialog, useDialogController } from './useDialogController';
import { WorldReveal } from './WorldReveal';

interface DialogLayerProps {
  protagonist: Protagonist;
  onReset: () => void;
  onExitAdventure?: (exitType?: 'completed' | 'stamina_exhausted' | 'quit' | 'fled') => void;
  onUpgradeTechnique: (targetId: string, materialIds: string[]) => void;
  onUpgradeEquipment: (targetId: string, materialIds: string[]) => void;
  devInvincible: boolean;
  onToggleDevInvincible: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  devHandlers: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAscensionBattleEnd?: (result: any) => void;
  onInheritanceConfirm?: (choice: InheritanceChoice) => void;
  onInheritanceSkip?: () => void;
  onWorldConfirm?: (world: NewWorldInfo) => void;
  onWorldReroll?: () => void;
  ascensionBattleEndedRef: React.MutableRefObject<boolean>;
}

export function DialogLayer({
  protagonist,
  onReset,
  onExitAdventure,
  onUpgradeTechnique,
  onUpgradeEquipment,
  devInvincible,
  onToggleDevInvincible,
  devHandlers,
  onAscensionBattleEnd,
  onInheritanceConfirm,
  onInheritanceSkip,
  onWorldConfirm,
  onWorldReroll,
  ascensionBattleEndedRef,
}: DialogLayerProps) {
  const { activeDialogs } = useDialogController();

  return (
    <>
      {/* 重置确认弹窗 */}
      <Dialog open={activeDialogs.some(d => d.type === 'resetConfirm')} onOpenChange={(open) => !open && closeDialog('resetConfirm')}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif tracking-[0.1em]">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              确认重新开始
            </DialogTitle>
            <DialogDescription>当前角色的所有进度将被清空。确认要重新选择化身吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={() => closeDialog('resetConfirm')}>取消</Button>
            <Button variant="destructive" onClick={() => { closeDialog('resetConfirm'); onReset(); }}>确认重开</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退出机缘确认弹窗 */}
      <Dialog open={activeDialogs.some(d => d.type === 'exitAdventure')} onOpenChange={(open) => !open && closeDialog('exitAdventure')}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif tracking-[0.1em]">
              <LogOut className="w-5 h-5" />
              确认退出机缘
            </DialogTitle>
            <DialogDescription>确认要中途退出当前的机缘探索吗？退出将丢失50%的战利品。</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={() => closeDialog('exitAdventure')}>继续探索</Button>
            <Button variant="destructive" onClick={() => { closeDialog('exitAdventure'); onExitAdventure?.('quit'); }}>确认退出</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 升级面板弹窗 */}
      <Dialog open={activeDialogs.some(d => d.type === 'upgrade')} onOpenChange={(open) => !open && closeDialog('upgrade')}>
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          <DialogTitle className="sr-only">升级面板</DialogTitle>
          {(() => {
            const d = activeDialogs.find(d => d.type === 'upgrade');
            if (!d) return null;
            const { item, type } = d.props as { item: Technique | Equipment; type: 'technique' | 'equipment' };
            return (
              <UpgradePanel
                targetItem={item}
                allItems={type === 'technique' ? protagonist.techniques : protagonist.equipments}
                onClose={() => closeDialog('upgrade')}
                onConfirm={(targetId, materialIds, t) => {
                  if (t === 'technique') { onUpgradeTechnique(targetId, materialIds); }
                  else { onUpgradeEquipment(targetId, materialIds); }
                  const upgraded = type === 'technique'
                    ? protagonist.techniques.find(tech => tech.id === targetId)
                    : protagonist.equipments.find(eq => eq.id === targetId);
                  return upgraded ? { upgradedItem: upgraded } : null;
                }}
              />
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 新手引导完成弹窗 */}
      <Dialog open={activeDialogs.some(d => d.type === 'noviceComplete')} onOpenChange={(open) => !open && closeDialog('noviceComplete')}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500 font-serif tracking-[0.1em]">
              <PartyPopper className="w-5 h-5" />新手引导完成！
            </DialogTitle>
            <DialogDescription className="text-base">恭喜你完成了新手机缘探索！</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button className="w-full" onClick={() => closeDialog('noviceComplete')}>开始新的冒险！</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新手任务完成弹窗 */}
      <Dialog open={activeDialogs.some(d => d.type === 'tutorialComplete')} onOpenChange={(open) => !open && closeDialog('tutorialComplete')}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500 font-serif tracking-[0.1em]">
              <Trophy className="w-5 h-5" />新手任务全部完成！
            </DialogTitle>
            <DialogDescription className="text-base">恭喜你完成了所有新手引导任务！</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button className="w-full" onClick={() => closeDialog('tutorialComplete')}>继续修仙之旅！</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 开发者面板 */}
      {isDebugMode() && devHandlers && (
        <DeveloperPanel
          protagonist={protagonist} devInvincible={devInvincible} onToggleDevInvincible={onToggleDevInvincible}
          onUpdateLevel={devHandlers.onUpdateLevel} onUpdateExperience={devHandlers.onUpdateExperience}
          onUpdateHp={devHandlers.onUpdateHp} onUpdateMp={devHandlers.onUpdateMp}
          onUpdateStat={devHandlers.onUpdateStat} onUpdateMentalState={devHandlers.onUpdateMentalState}
          onUpdatePathLevel={devHandlers.onUpdatePathLevel} onAddItem={devHandlers.onAddItem}
          onAddSpiritStones={devHandlers.onAddSpiritStones} onAddTechnique={devHandlers.onAddTechnique}
          onAddEquipment={devHandlers.onAddEquipment}
          onSetCultivationPath={devHandlers.onSetCultivationPath}
          onTriggerBreakthrough={devHandlers.onTriggerBreakthrough} onTriggerTribulation={devHandlers.onTriggerTribulation}
          onTriggerDemon={devHandlers.onTriggerDemon} onResetCooldowns={devHandlers.onResetCooldowns}
          onSetWorldType={devHandlers.onSetWorldType} onFullRestore={devHandlers.onFullRestore}
          onAddAllItems={devHandlers.onAddAllItems} onMaxStats={devHandlers.onMaxStats}
        />
      )}

      {/* 飞升 - 守卫战斗 */}
      <GuardianBattle
        open={activeDialogs.some(d => d.type === 'guardianBattle')}
        onOpenChange={(open) => {
          if (!open) {
            if (ascensionBattleEndedRef.current) { ascensionBattleEndedRef.current = false; return; }
            if (onAscensionBattleEnd) onAscensionBattleEnd({ victory: false, turnsUsed: 0, remainingHpPercent: 0, phasesCleared: 0 });
          }
        }}
        protagonist={protagonist} devInvincible={devInvincible}
        onBattleEnd={(result) => { ascensionBattleEndedRef.current = true; if (onAscensionBattleEnd) onAscensionBattleEnd(result); }}
      />

      {/* 飞升 - 传承选择 */}
      <InheritanceSelect
        open={activeDialogs.some(d => d.type === 'inheritanceSelect')}
        onOpenChange={() => {}}
        protagonist={protagonist} ascensionCount={protagonist.ascensionMark?.count ?? 0}
        onConfirm={(choice) => onInheritanceConfirm?.(choice)}
        onSkip={() => onInheritanceSkip?.()}
      />

      {/* 飞升 - 世界揭示 */}
      {activeDialogs.some(d => d.type === 'worldReveal') && (() => {
        const d = activeDialogs.find(dialog => dialog.type === 'worldReveal');
        const newWorld = d?.props.newWorld as NewWorldInfo | undefined;
        if (!newWorld) return null;
        return (
          <WorldReveal
            open={true} onOpenChange={() => {}}
            newWorld={newWorld} hasReroll={protagonist.ascensionMark?.rerollAvailable ?? false}
            onConfirm={() => onWorldConfirm?.(newWorld)} onReroll={() => onWorldReroll?.()}
          />
        );
      })()}
    </>
  );
}
