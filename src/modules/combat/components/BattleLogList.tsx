/**
 * 战斗日志列表组件
 */

'use client';

import { 
  Swords, 
  Shield, 
  Sparkles, 
  Heart, 
  Zap, 
  AlertTriangle,
  Flame,
  Wind,
  Star,
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';

interface BattleLogListProps {
  logs: string[];
}

export function BattleLogList({ logs }: BattleLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        战斗尚未开始
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {logs.map((log, index) => (
        <BattleLogItem key={index} log={log} index={index} />
      ))}
    </div>
  );
}

interface BattleLogItemProps {
  log: string;
  index: number;
}

function BattleLogItem({ log, index }: BattleLogItemProps) {
  // 解析日志类型
  const getLogStyle = (log: string) => {
    if (log.startsWith('[玩家]')) {
      return { icon: <Swords className="w-3 h-3 text-blue-500" />, className: 'text-blue-700 dark:text-blue-300' };
    }
    if (log.startsWith('[敌人]')) {
      return { icon: <Swords className="w-3 h-3 text-red-500" />, className: 'text-red-700 dark:text-red-300' };
    }
    if (log.startsWith('[事件]')) {
      return { icon: <Sparkles className="w-3 h-3 text-purple-500" />, className: 'text-purple-700 dark:text-purple-300' };
    }
    return { icon: null, className: 'text-muted-foreground' };
  };

  const style = getLogStyle(log);

  // 格式化日志文本
  const formatLog = (log: string) => {
    // 移除前缀标签
    return log.replace(/^\[(玩家|敌人|事件)\]/, '').trim();
  };

  return (
    <div className={`flex items-start gap-2 text-xs ${style.className}`}>
      {style.icon}
      <span>{formatLog(log)}</span>
    </div>
  );
}

/** 详细战斗日志项（用于完整战斗记录） */
interface DetailedBattleLogItemProps {
  round: number;
  attacker: 'player' | 'enemy' | 'system';
  action: string;
  damage?: number;
  healing?: number;
  special?: string;
}

export function DetailedBattleLogItem({
  round,
  attacker,
  action,
  damage,
  healing,
  special,
}: DetailedBattleLogItemProps) {
  const getAttackerStyle = () => {
    switch (attacker) {
      case 'player':
        return 'text-blue-700 dark:text-blue-300';
      case 'enemy':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSpecialBadge = () => {
    if (!special) return null;

    switch (special) {
      case 'crit':
        return (
          <Badge variant="default" className="text-[10px] bg-yellow-500">
            <Star className="w-2 h-2 mr-1" /> 暴击
          </Badge>
        );
      case 'dodge':
        return (
          <Badge variant="secondary" className="text-[10px]">
            <Wind className="w-2 h-2 mr-1" /> 闪避
          </Badge>
        );
      case 'technique':
        return (
          <Badge variant="secondary" className="text-[10px]">
            <Sparkles className="w-2 h-2 mr-1" /> 功法
          </Badge>
        );
      case 'restraint_counter':
        return (
          <Badge variant="default" className="text-[10px] bg-green-500">
            <Flame className="w-2 h-2 mr-1" /> 克制
          </Badge>
        );
      case 'restraint_countered':
        return (
          <Badge variant="destructive" className="text-[10px]">
            <AlertTriangle className="w-2 h-2 mr-1" /> 被克
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs py-1 border-b border-border/50 last:border-0 ${getAttackerStyle()}`}>
      <span className="text-muted-foreground w-6">R{round}</span>
      <span className="flex-1">{action}</span>
      {damage !== undefined && damage > 0 && (
        <Badge variant="destructive" className="text-[10px]">
          -{damage}
        </Badge>
      )}
      {healing !== undefined && healing > 0 && (
        <Badge variant="default" className="text-[10px] bg-green-500">
          +{healing}
        </Badge>
      )}
      {getSpecialBadge()}
    </div>
  );
}
