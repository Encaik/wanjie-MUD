'use client';

import { Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { 
  getRealmName, 
  getNextRealm, 
  getNextMainRealmLevel 
} from '@/lib/data/realmData';
import { getTerminology } from '@/lib/game/utils/terminology';
import { Protagonist } from '@/lib/game/types';

interface CharacterInfoProps {
  protagonist: Protagonist;
  showLevel?: boolean;
  compact?: boolean;
  showAscension?: boolean; // 是否显示飞升次数
}

/**
 * 统一的角色信息显示组件
 * 用于在整个应用中显示一致的等级、境界信息
 */
export function CharacterInfo({ protagonist, showLevel = true, compact = false, showAscension = true }: CharacterInfoProps) {
  const realmSystem = protagonist.world.realmSystem;
  const terminology = getTerminology(protagonist.world.type);
  const ascensionCount = protagonist.ascensionMark?.count ?? 0;
  
  const currentRealm = getRealmName(realmSystem, protagonist.level);
  const nextRealm = getNextRealm(realmSystem, protagonist.level);
  const nextRealmLevel = getNextMainRealmLevel(realmSystem, protagonist.level);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Lv.{protagonist.level}
        </Badge>
        <span className="text-sm font-medium text-primary">{currentRealm}</span>
        {showAscension && ascensionCount > 0 && (
          <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
            <Sparkles className="w-3 h-3 mr-0.5" />
            飞升{ascensionCount}次
          </Badge>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary">{currentRealm}</span>
        <div className="flex items-center gap-2">
          {showLevel && (
            <Badge variant="secondary" className="text-xs">
              Lv.{protagonist.level}
            </Badge>
          )}
          {showAscension && ascensionCount > 0 && (
            <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
              <Sparkles className="w-3 h-3 mr-0.5" />
              飞升{ascensionCount}次
            </Badge>
          )}
        </div>
      </div>
      {nextRealm && nextRealmLevel && (
        <div className="text-xs text-muted-foreground">
          下一境界: {nextRealm} (Lv.{nextRealmLevel})
        </div>
      )}
    </div>
  );
}

/**
 * 角色信息行内显示（用于标题栏等）
 */
export function CharacterInfoInline({ protagonist, showAscension = true }: { protagonist: Protagonist; showAscension?: boolean }) {
  const currentRealm = getRealmName(protagonist.world.realmSystem, protagonist.level);
  const ascensionCount = protagonist.ascensionMark?.count ?? 0;
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-primary">{currentRealm}</span>
      <Badge variant="outline" className="text-xs">Lv.{protagonist.level}</Badge>
      {showAscension && ascensionCount > 0 && (
        <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
          <Sparkles className="w-3 h-3 mr-0.5" />
          飞升{ascensionCount}次
        </Badge>
      )}
    </div>
  );
}

/**
 * 角色境界徽章（最小化显示）
 */
export function RealmBadge({ protagonist }: { protagonist: Protagonist }) {
  const currentRealm = getRealmName(protagonist.world.realmSystem, protagonist.level);
  
  return (
    <Badge variant="outline" className="text-xs font-medium">
      {currentRealm}
    </Badge>
  );
}

/**
 * 获取角色的完整信息对象（用于需要纯数据的场景）
 */
export function getCharacterInfoData(protagonist: Protagonist) {
  const realmSystem = protagonist.world.realmSystem;
  
  return {
    level: protagonist.level,
    realm: getRealmName(realmSystem, protagonist.level),
    nextRealm: getNextRealm(realmSystem, protagonist.level),
    nextRealmLevel: getNextMainRealmLevel(realmSystem, protagonist.level),
    ascensionCount: protagonist.ascensionMark?.count ?? 0,
  };
}

/**
 * 飞升次数徽章组件
 */
export function AscensionCountBadge({ protagonist }: { protagonist: Protagonist }) {
  const ascensionCount = protagonist.ascensionMark?.count ?? 0;
  
  if (ascensionCount === 0) return null;
  
  return (
    <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
      <Sparkles className="w-3 h-3 mr-1" />
      飞升 {ascensionCount} 次
    </Badge>
  );
}
