/**
 * 决策面板组件
 * 
 * 显示可用的战斗决策选项
 */

'use client';

import {
  Swords,
  Shield,
  Sparkles,
  FlaskConical,
  Footprints,
  Star,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BattleAction, DecisionOption } from '@/lib/game/battle';

interface DecisionPanelProps {
  decisions: DecisionOption[];
  onAction: (action: BattleAction) => void;
  disabled?: boolean;
  autoMode?: boolean;
}

/** 行动类型图标 */
const ACTION_ICONS: Record<string, React.ReactNode> = {
  normal_attack: <Swords className="w-4 h-4" />,
  technique_attack: <Sparkles className="w-4 h-4" />,
  combat_technique: <Swords className="w-4 h-4" />,
  defend: <Shield className="w-4 h-4" />,
  use_item: <FlaskConical className="w-4 h-4" />,
  flee: <Footprints className="w-4 h-4" />,
};

export function DecisionPanel({
  decisions,
  onAction,
  disabled = false,
  autoMode = false,
}: DecisionPanelProps) {
  // 按类型分组决策
  const groupedDecisions = {
    attack: decisions.filter(d => d.action.type === 'normal_attack'),
    techniqueSkills: decisions.filter(d => d.action.type === 'technique_attack'), // 法技（功法）
    combatTechniques: decisions.filter(d => d.action.type === 'combat_technique'), // 斗技（武器）
    items: decisions.filter(d => d.action.type === 'use_item'),
    defend: decisions.filter(d => d.action.type === 'defend'),
    flee: decisions.filter(d => d.action.type === 'flee'),
  };

  if (decisions.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        <span className="text-sm">等待中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {autoMode && (
        <div className="text-center text-xs text-muted-foreground mb-2">
          <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
          自动战斗中...
        </div>
      )}

      {/* 攻击选项 */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground font-medium mb-1">攻击</div>
        <div className="flex flex-wrap gap-2">
          {groupedDecisions.attack.map((decision, index) => (
            <DecisionButton
              key={`attack-${index}`}
              decision={decision}
              onClick={() => onAction(decision.action)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* 斗技（武器技巧：无消耗） */}
      {groupedDecisions.combatTechniques.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-orange-500 font-medium mb-1">斗技</div>
          <div className="flex flex-wrap gap-2">
            {groupedDecisions.combatTechniques.map((decision, index) => (
              <DecisionButton
                key={`combat-${index}`}
                decision={decision}
                onClick={() => onAction(decision.action)}
                disabled={disabled}
                variant="default"
                icon="⚔️"
              />
            ))}
          </div>
        </div>
      )}

      {/* 法技（功法技能：消耗MP） */}
      {groupedDecisions.techniqueSkills.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-blue-500 font-medium mb-1">法技</div>
          <div className="flex flex-wrap gap-2">
            {groupedDecisions.techniqueSkills.map((decision, index) => (
              <DecisionButton
                key={`technique-${index}`}
                decision={decision}
                onClick={() => onAction(decision.action)}
                disabled={disabled}
                variant="secondary"
                icon="✨"
              />
            ))}
          </div>
        </div>
      )}

      {/* 物品 */}
      {groupedDecisions.items.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-medium mb-1">物品</div>
          <div className="flex flex-wrap gap-2">
            {groupedDecisions.items.map((decision, index) => (
              <DecisionButton
                key={`item-${index}`}
                decision={decision}
                onClick={() => onAction(decision.action)}
                disabled={disabled}
                variant="outline"
              />
            ))}
          </div>
        </div>
      )}

      {/* 防御和逃跑 */}
      <div className="flex gap-2 pt-2">
        {groupedDecisions.defend.map((decision, index) => (
          <DecisionButton
            key={`defend-${index}`}
            decision={decision}
            onClick={() => onAction(decision.action)}
            disabled={disabled}
            variant="outline"
          />
        ))}
        {groupedDecisions.flee.map((decision, index) => (
          <DecisionButton
            key={`flee-${index}`}
            decision={decision}
            onClick={() => onAction(decision.action)}
            disabled={disabled}
            variant="ghost"
          />
        ))}
      </div>
    </div>
  );
}

/** 决策按钮组件 */
interface DecisionButtonProps {
  decision: DecisionOption;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  icon?: string;
}

function DecisionButton({
  decision,
  onClick,
  disabled = false,
  variant = 'default',
  icon: customIcon,
}: DecisionButtonProps) {
  const icon = customIcon || (decision.icon ? (
    <span className="mr-1">{decision.icon}</span>
  ) : (
    ACTION_ICONS[decision.action.type]
  ));

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      disabled={disabled || decision.disabled}
      className={`relative ${decision.recommended ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
    >
      {icon}
      <span>{decision.label}</span>
      
      {/* 推荐标记 */}
      {decision.recommended && (
        <Star className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 fill-yellow-500" />
      )}

      {/* 禁用原因提示 */}
      {decision.disabled && decision.disabledReason && (
        <span className="text-[10px] text-muted-foreground ml-1">
          ({decision.disabledReason})
        </span>
      )}

      {/* 额外信息 */}
      {decision.extraInfo && !decision.disabled && (
        <span className="text-[10px] text-muted-foreground ml-1">
          {decision.extraInfo.mpCost !== undefined && decision.extraInfo.mpCost > 0 && (
            <span className="text-blue-500">{decision.extraInfo.mpCost}MP</span>
          )}
          {decision.extraInfo.cooldown !== undefined && decision.extraInfo.cooldown > 0 && (
            <span className="text-orange-500 ml-1">CD:{decision.extraInfo.cooldown}</span>
          )}
        </span>
      )}
    </Button>
  );
}
