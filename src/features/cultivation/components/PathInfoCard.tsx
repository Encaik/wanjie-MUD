/**
 * 流派信息卡片组件
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CultivationPath } from '@/lib/game/types';
import { CULTIVATION_PATHS } from '@/lib/data/cultivationPathData';
import { Sparkles, Shield, Swords, Zap, Flame } from 'lucide-react';
import { getPathColor } from '../utils/pathStyles';

// 获取流派图标
function getPathIcon(pathType: string) {
  switch (pathType) {
    case 'body': return <Shield className="w-3.5 h-3.5" />;
    case 'sword': return <Swords className="w-3.5 h-3.5" />;
    case 'spell': return <Sparkles className="w-3.5 h-3.5" />;
    case 'alchemy': return <Zap className="w-3.5 h-3.5" />;
    case 'demon': return <Flame className="w-3.5 h-3.5" />;
    default: return <Sparkles className="w-3.5 h-3.5" />;
  }
}

interface PathInfoCardProps {
  /** 当前流派 */
  cultivationPath: CultivationPath | null | undefined;
  /** 流派等级 */
  pathLevel?: number;
  /** 选择流派回调 */
  onSelectPath?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

export function PathInfoCard({
  cultivationPath,
  pathLevel = 1,
  onSelectPath,
  disabled,
}: PathInfoCardProps) {
  const pathConfig = cultivationPath ? CULTIVATION_PATHS[cultivationPath] : null;

  if (pathConfig) {
    return (
      <div className={`border rounded-lg p-2 ${getPathColor(pathConfig.id)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {getPathIcon(pathConfig.id)}
            <span className="text-xs font-medium">{pathConfig.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px]">
              Lv.{pathLevel}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {pathConfig.skills[0]?.name || '基础技能'}
            </Badge>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {pathConfig.description}
        </p>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-full h-8 text-xs border-dashed border-2"
      onClick={onSelectPath}
      disabled={disabled}
    >
      <Sparkles className="w-3 h-3 mr-1" />
      选择修炼流派
    </Button>
  );
}
