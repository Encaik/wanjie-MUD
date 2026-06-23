/**
 * 战斗结果弹窗组件
 * 
 * 使用弹窗形式展示战斗结果，替代旧的卡片式 BattleRecord
 * 
 * 【设计规范 - 弹窗右上角空位】
 * 所有 DialogContent 必须添加 pt-10 类，预留右上角空位。
 * 原因：shadcn/ui 的 Dialog 组件默认将关闭按钮定位在右上角，
 *       如果不预留空间，标题栏或其他元素可能与关闭按钮重叠。
 *       这是一个强制性的设计约束，请勿移除 pt-10。
 */

'use client';

import {
  Swords,
  Heart,
  Shield,
  Zap,
  Trophy,
  Skull,
  User,
  Sparkles,
  Wind,
  Flame,
  X,
} from 'lucide-react';

import { BattleState, BattleLog, Technique, Equipment } from '@/core/types';
import { formatCombatPower, getCombatPowerRank } from '@/modules/combat/logic/combatPower';
import { 
  getElementIcon, 
  getWeaponCategoryIcon, 
  ELEMENT_NAMES, 
  WEAPON_CATEGORY_NAMES,
  EnemyAttributes,
} from '@/modules/combat/logic/restraintSystem';
import { Button } from '@/shared/ui/actions/button';
import { Badge } from '@/shared/ui/data-display/badge';
import { Progress } from '@/shared/ui/feedback/progress';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';
import { Separator } from '@/shared/ui/layout/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/overlay/dialog';

import { CombatantPanel } from './CombatantPanel';

interface BattleResultDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 战斗状态 */
  battleState: BattleState | null;
  /** 关闭回调 */
  onClose?: () => void;
  /** 玩家功法信息 */
  playerTechniques?: Technique[];
  /** 玩家武器信息 */
  playerWeapons?: { melee: Equipment | null; ranged: Equipment | null };
}

export function BattleResultDialog({
  open,
  onOpenChange,
  battleState,
  onClose,
  playerTechniques = [],
  playerWeapons = { melee: null, ranged: null },
}: BattleResultDialogProps) {
  // 空值保护
  const logs = battleState?.logs ?? [];
  
  // 计算总伤害
  const playerTotalDamage = logs
    .filter((log) => log.attacker === 'player' && log.damage)
    .reduce((sum, log) => sum + (log.damage || 0), 0);
  const enemyTotalDamage = logs
    .filter((log) => log.attacker === 'enemy' && log.damage)
    .reduce((sum, log) => sum + (log.damage || 0), 0);

  // 统计特殊事件
  const critCount = logs.filter((log) => log.special === 'crit').length;
  const dodgeCount = logs.filter((log) => log.special === 'dodge').length;
  const techniqueCount = logs.filter((log) => log.special === 'technique').length;

  // 获取敌人属性（如果有）
  const enemyAttributes = (battleState as any)?.enemyAttributes as EnemyAttributes | undefined;

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  // 如果 battleState 为空，不渲染内容
  if (!battleState) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 右上角必须预留空位 (pt-10)，避免关闭按钮与其他UI元素重叠 */}
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col pt-10">
        {/* 标题 */}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Swords className="w-4 h-4 text-red-500" />
            战斗记录
            <Badge variant="outline" className="ml-1 text-[10px] h-5">
              回合 {battleState.currentRound}
            </Badge>
            {battleState.isOver && (
              battleState.victory ? (
                <Badge className="bg-green-500 text-white ml-auto text-[10px] h-5">
                  <Trophy className="w-3 h-3 mr-1" />
                  胜利
                </Badge>
              ) : (
                <Badge className="bg-red-500 text-white ml-auto text-[10px] h-5">
                  <Skull className="w-3 h-3 mr-1" />
                  失败
                </Badge>
              )
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            第 {battleState.currentRound} 回合战斗记录
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* 战斗双方信息 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 玩家面板 */}
            <CombatantPanel
              name="你"
              level={1}
              currentHp={Math.max(0, battleState.playerCurrentHp)}
              maxHp={battleState.playerMaxHp}
              currentMp={battleState.playerCurrentMp || 0}
              maxMp={battleState.playerMaxMp || 0}
              attack={battleState.playerAttack}
              defense={battleState.playerDefense}
              isPlayer
              techniques={playerTechniques}
              weapons={playerWeapons}
            />

            {/* 敌人面板 */}
            <CombatantPanel
              name={battleState.enemyName}
              level={battleState.enemyLevel}
              currentHp={Math.max(0, battleState.enemyCurrentHp)}
              maxHp={battleState.enemyMaxHp}
              currentMp={0}
              maxMp={0}
              attack={battleState.enemyAttack}
              defense={battleState.enemyDefense}
              isPlayer={false}
              attributes={enemyAttributes}
            />
          </div>

          {/* 战斗统计 */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/30">
              <div className="text-muted-foreground text-[10px]">你的伤害</div>
              <div className="font-bold text-green-600 dark:text-green-400">{playerTotalDamage}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30">
              <div className="text-muted-foreground text-[10px]">敌方伤害</div>
              <div className="font-bold text-red-600 dark:text-red-400">{enemyTotalDamage}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
              <div className="text-muted-foreground text-[10px]">暴击</div>
              <div className="font-bold text-yellow-600 dark:text-yellow-400">{critCount}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <div className="text-muted-foreground text-[10px]">闪避</div>
              <div className="font-bold text-blue-600 dark:text-blue-400">{dodgeCount}</div>
            </div>
          </div>

          {/* 敌人属性显示 */}
          {enemyAttributes && (enemyAttributes.element || enemyAttributes.weaponCategory) && (
            <div className="flex gap-2 items-center text-xs">
              <span className="text-muted-foreground">敌人属性:</span>
              {enemyAttributes.element && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {getElementIcon(enemyAttributes.element)} {ELEMENT_NAMES[enemyAttributes.element]}
                </Badge>
              )}
              {enemyAttributes.weaponCategory && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {getWeaponCategoryIcon(enemyAttributes.weaponCategory)} {WEAPON_CATEGORY_NAMES[enemyAttributes.weaponCategory]}
                </Badge>
              )}
            </div>
          )}

          <Separator className="my-2" />

          {/* 战斗日志 */}
          <div className="flex-shrink-0">
            <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <Swords className="w-3 h-3" />
              战斗过程
            </div>
            <ScrollArea className="h-[180px] border rounded-md p-2">
              <div className="space-y-0.5">
                {logs.map((log, index) => (
                  <BattleLogItem key={index} log={log} />
                ))}
                {logs.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    暂无战斗记录
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* 底部按钮 */}
        <DialogFooter className="flex-shrink-0 mt-3">
          <Button onClick={handleClose} className="w-full h-8 text-sm">
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** 战斗日志项组件 */
function BattleLogItem({ log }: { log: BattleLog }) {
  const getLogStyle = () => {
    switch (log.special) {
      case 'victory':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'defeat':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'crit':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'dodge':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'technique':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
      default:
        return log.attacker === 'player'
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <div
      className={`text-[11px] flex items-center gap-1.5 py-0.5 px-1.5 rounded ${getLogStyle()}`}
    >
      <span className="text-muted-foreground font-mono text-[9px] w-5 flex-shrink-0">
        R{log.round}
      </span>
      <span className="truncate flex-1">{log.action}</span>
      {log.damage && (
        <Badge variant="destructive" className="text-[9px] h-4 px-1 flex-shrink-0">
          -{log.damage}
        </Badge>
      )}
      {log.heal && (
        <Badge className="text-[9px] h-4 px-1 bg-green-500 flex-shrink-0">
          +{log.heal}
        </Badge>
      )}
      {log.special === 'crit' && <Sparkles className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
      {log.special === 'dodge' && <Wind className="w-3 h-3 text-blue-500 flex-shrink-0" />}
      {log.special === 'technique' && <Flame className="w-3 h-3 text-orange-500 flex-shrink-0" />}
    </div>
  );
}
