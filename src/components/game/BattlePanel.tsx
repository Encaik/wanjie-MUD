/**
 * 组件：BattlePanel
 *
 * 职责：手动回合制战斗界面，展示敌我HP/MP、招式选择、行动按钮
 * 依赖：useBattle Hook
 */
'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AutoBattleStrategy, CombatTechniqueSlot, ManualBattleState } from '@/lib/game/combat/types';
import type { UseBattleReturn } from '@/hooks/combat/useBattle';

interface BattlePanelProps {
  /** 战斗 Hook 返回值 */
  battle: UseBattleReturn;
  /** 战斗结算回调 */
  onBattleEnd?: (state: ManualBattleState) => void;
}

/** 元素克制状态的中文标签 */
const STATUS_LABELS: Record<string, string> = {
  advantage: '克制',
  disadvantage: '被克',
  neutral: '',
};

/** 元素克制状态的颜色 */
const STATUS_COLORS: Record<string, string> = {
  advantage: 'text-green-400',
  disadvantage: 'text-red-400',
  neutral: 'text-gray-400',
};

/** AI 策略选项 */
const STRATEGY_OPTIONS: { value: AutoBattleStrategy; label: string }[] = [
  { value: 'aggressive', label: '激进' },
  { value: 'balanced', label: '均衡' },
  { value: 'conservative', label: '保守' },
];

/** HP/MP 条组件 */
function StatusBars({ state, isEnemy }: { state: ManualBattleState; isEnemy?: boolean }) {
  const hp = isEnemy ? state.enemyCurrentHp : state.playerCurrentHp;
  const maxHp = isEnemy ? state.enemyMaxHp : state.playerMaxHp;
  const mp = isEnemy ? 0 : state.playerCurrentMp;
  const maxMp = isEnemy ? 0 : state.playerMaxMp;
  const name = isEnemy ? state.enemyName : '你';
  const realm = isEnemy ? state.enemyRealm : '';
  const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const mpPercent = maxMp > 0 ? (mp / maxMp) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{name}</span>
        {realm && <span className="text-muted-foreground text-xs">{realm}</span>}
        <span>{hp}/{maxHp}</span>
      </div>
      <div className="h-3 bg-gray-700 rounded overflow-hidden">
        <div
          className={`h-full rounded transition-all ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${Math.max(0, hpPercent)}%` }}
        />
      </div>
      {!isEnemy && maxMp > 0 && (
        <>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>真气</span>
            <span>{mp}/{maxMp}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-blue-500 rounded transition-all" style={{ width: `${Math.max(0, mpPercent)}%` }} />
          </div>
        </>
      )}
    </div>
  );
}

/** 招式选择面板 */
function TechniquePanel({
  techniques,
  playerMp,
  onSelect,
}: {
  techniques: CombatTechniqueSlot[];
  playerMp: number;
  onSelect: (tech: CombatTechniqueSlot) => void;
}) {
  if (techniques.length === 0) {
    return <p className="text-sm text-muted-foreground">没有可用的招式</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-1">选择招式：</p>
      <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
        {techniques.map(tech => {
          const canUse = !tech.isOnCooldown && tech.mpCost <= playerMp;
          const statusClass = STATUS_COLORS[tech.elementalStatus || 'neutral'];
          return (
            <button
              key={tech.techniqueId}
              disabled={!canUse}
              onClick={() => onSelect(tech)}
              className={`text-left px-2 py-1 rounded text-xs border transition-colors ${
                canUse
                  ? 'border-gray-600 hover:border-blue-400 bg-gray-800'
                  : 'border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed'
              }`}
              title={!canUse ? (tech.isOnCooldown ? '冷却中' : '真气不足') : ''}
            >
              <span className="font-medium">{tech.name}</span>
              <span className="text-muted-foreground ml-1">({tech.mpCost}气)</span>
              {tech.elementalStatus && tech.elementalStatus !== 'neutral' && (
                <span className={`ml-1 ${statusClass}`}>
                  {STATUS_LABELS[tech.elementalStatus]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 战斗日志 */
function BattleLog({ state }: { state: ManualBattleState }) {
  const recentLogs = state.turnHistory.slice(-5);

  return (
    <div className="max-h-24 overflow-y-auto text-xs space-y-0.5 border-t border-gray-700 pt-2 mt-2">
      {recentLogs.map((log, i) => (
        <p
          key={i}
          className={
            log.actor === 'player' ? 'text-blue-300' : 'text-red-300'
          }
        >
          [回合{state.currentRound - recentLogs.length + i + 1}] {log.description}
        </p>
      ))}
    </div>
  );
}

/** 战斗结果展示 */
function BattleResult({ state, onClose }: { state: ManualBattleState; onClose: () => void }) {
  const victory = state.victory;
  const fled = state.fled;

  return (
    <div className="text-center space-y-3 py-4">
      <p className={`text-xl font-bold ${victory ? 'text-green-400' : fled ? 'text-yellow-400' : 'text-red-400'}`}>
        {victory ? '战斗胜利！' : fled ? '已逃跑' : '战斗失败...'}
      </p>
      <p className="text-sm text-muted-foreground">
        {victory
          ? `击败了 ${state.enemyName}，共 ${state.currentRound} 回合`
          : fled
            ? '你成功逃离了战斗'
            : `被 ${state.enemyName} 击败了`}
      </p>
      <Button onClick={onClose}>
        {victory ? '收取战利品' : '退出'}
      </Button>
    </div>
  );
}

export function BattlePanel({ battle, onBattleEnd }: BattlePanelProps) {
  const { battleState, isActive, isAuto, autoStrategy, executeAction, toggleAuto, setAutoStrategy, getAvailableTechniques } = battle;
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  const handleTechniqueSelect = useCallback((tech: CombatTechniqueSlot) => {
    setSelectedTechId(tech.techniqueId);
  }, []);

  const handleAttack = useCallback(() => {
    executeAction({ type: 'attack', techniqueId: selectedTechId || undefined, source: 'player' });
  }, [executeAction, selectedTechId]);

  const handleDefend = useCallback(() => {
    executeAction({ type: 'defend', source: 'player' });
  }, [executeAction]);

  const handleFlee = useCallback(() => {
    executeAction({ type: 'flee', source: 'player' });
  }, [executeAction]);

  const handleClose = useCallback(() => {
    if (battleState && onBattleEnd) {
      onBattleEnd(battleState);
    }
  }, [battleState, onBattleEnd]);

  if (!battleState) return null;

  // 战斗结束展示结果
  if (battleState.isOver) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
        <BattleResult state={battleState} onClose={handleClose} />
      </div>
    );
  }

  const techniques = getAvailableTechniques();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md mx-auto space-y-3">
      {/* 敌方状态 */}
      <StatusBars state={battleState} isEnemy />

      {/* 玩家状态 */}
      <StatusBars state={battleState} />

      {/* 控制栏 */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isAuto}
              onChange={toggleAuto}
              className="w-3 h-3"
            />
            <span>自动</span>
          </label>
          {isAuto && (
            <select
              value={autoStrategy}
              onChange={e => setAutoStrategy(e.target.value as AutoBattleStrategy)}
              className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs"
            >
              {STRATEGY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </div>
        <span className="text-muted-foreground">回合 {battleState.currentRound}/{battleState.maxRounds}</span>
      </div>

      {/* 招式选择（手动模式） */}
      {!isAuto && (
        <TechniquePanel
          techniques={techniques}
          playerMp={battleState.playerCurrentMp}
          onSelect={handleTechniqueSelect}
        />
      )}

      {/* 行动按钮（手动模式） */}
      {!isAuto && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAttack} className="flex-1">
            攻击{selectedTechId ? '' : '（普攻）'}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDefend} className="flex-1">
            防御
          </Button>
          {(battleState.enemyLevel - (battleState.playerDefense / 10) <= 10 || true) && (
            <Button size="sm" variant="outline" onClick={handleFlee} className="flex-1">
              逃跑
            </Button>
          )}
        </div>
      )}

      {/* 战斗日志 */}
      <BattleLog state={battleState} />
    </div>
  );
}
