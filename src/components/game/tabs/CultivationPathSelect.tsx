'use client';

import { useState, useEffect, useRef } from 'react';

import {
  Shield,
  Swords,
  Sparkles,
  FlaskConical,
  Flame,
  Check,
  Lock,
  AlertCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CULTIVATION_PATHS,
  checkPathUnlockConditions,
  getPathLevelExp,
  PATH_LEVEL_CONFIG,
} from '@/lib/data/cultivationPathData';
import { CharacterStats, WorldType, LegacyStats } from '@/lib/game/types';
import {
  CultivationPath,
} from '@/lib/game/typesExtension';
import { getWorldText } from '@/lib/text/WorldTextContext';

interface CultivationPathSelectProps {
  isOpen: boolean;
  onClose: () => void;
  playerLevel: number;
  playerStats: LegacyStats;
  currentPath: CultivationPath | null;
  pathLevel?: number;  // 当前流派等级
  worldType: WorldType;  // 当前世界观
  onSelectPath: (path: CultivationPath) => void;
}

// 流派图标映射
const PathIcons: Record<CultivationPath, React.ReactNode> = {
  body: <Shield className="w-6 h-6" />,
  sword: <Swords className="w-6 h-6" />,
  spell: <Sparkles className="w-6 h-6" />,
  alchemy: <FlaskConical className="w-6 h-6" />,
  demon: <Flame className="w-6 h-6" />,
};

// 流派类型映射：从 CultivationPath 到 PathTypeId
const PATH_TO_ID: Record<CultivationPath, 'body' | 'sword' | 'spell' | 'alchemy' | 'demon'> = {
  body: 'body',
  sword: 'sword',
  spell: 'spell',
  alchemy: 'alchemy',
  demon: 'demon',
};

export function CultivationPathSelect({
  isOpen,
  onClose,
  playerLevel,
  playerStats,
  currentPath,
  pathLevel = 1,
  worldType,
  onSelectPath,
}: CultivationPathSelectProps) {
  const paths = Object.keys(CULTIVATION_PATHS) as CultivationPath[];
  
  // 直接从 worldType 获取对应的文案（不依赖 Context）
  const worldText = getWorldText(worldType);
  
  // 找到第一个流派作为默认选择（用于显示详情）
  const getFirstPath = (): CultivationPath => {
    return paths[0];
  };
  
  const [selectedPath, setSelectedPath] = useState<CultivationPath | null>(() => 
    currentPath || getFirstPath()
  );
  
  // 记录上一次 isOpen 状态，用于检测 Dialog 打开
  const prevIsOpenRef = useRef(isOpen);
  
  // 当 Dialog 打开时，同步 selectedPath 状态
  useEffect(() => {
    // 只在 Dialog 从关闭变为打开时同步
    if (isOpen && !prevIsOpenRef.current) {
      setSelectedPath(currentPath || getFirstPath());
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentPath]);

  const handleConfirm = () => {
    if (selectedPath && !currentPath) {
      onSelectPath(selectedPath);
      onClose();
    }
  };

  const displayPath = selectedPath;
  const displayConfig = displayPath ? CULTIVATION_PATHS[displayPath] : null;
  
  // 获取流派文案
  const getPathDisplayText = (pathId: CultivationPath) => {
    const pathIdKey = PATH_TO_ID[pathId];
    return worldText.paths[pathIdKey];
  };
  
  // 获取属性名
  const getStatName = (statKey: string) => {
    return worldText.stats[statKey as keyof typeof worldText.stats] || statKey;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1000px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            {currentPath ? '流派详情' : '选择修炼流派'}
          </DialogTitle>
          <DialogDescription>
            {currentPath 
              ? '查看你的修炼流派详情和技能。流派一旦选定无法更改。' 
              : '选择一个流派将决定你的修炼方向和特殊能力。流派一旦选定无法更改，请谨慎选择！'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* 左侧流派列表 - 约1/3宽度 */}
          <div className="w-[280px] shrink-0 space-y-2">
            {paths.map((path) => {
              const config = CULTIVATION_PATHS[path];
              const pathText = getPathDisplayText(path);
              const check = checkPathUnlockConditions(path, playerLevel, playerStats);
              const isUnlocked = check.canUnlock;
              const isSelected = selectedPath === path;
              const isCurrent = currentPath === path;

              return (
                <Card
                  key={path}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : isCurrent
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedPath(path)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`shrink-0 p-2 rounded-lg bg-muted ${config.color}`}>
                        {PathIcons[path]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${config.color}`}>
                            {pathText.name}
                          </span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-green-600 border-green-500/50">
                              <Check className="w-3 h-3 mr-1" />
                              当前
                            </Badge>
                          )}
                          {!isUnlocked && (
                            <Badge variant="outline" className="text-gray-500">
                              <Lock className="w-3 h-3 mr-1" />
                              未解锁
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pathText.description}
                        </p>
                      </div>
                    </div>
                    
                    {!isUnlocked && (
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {check.reason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 右侧详情面板 - 约2/3宽度 */}
          <div className="flex-1 min-w-0 border-l pl-4">
            {displayConfig ? (() => {
              const displayPathText = getPathDisplayText(displayPath!);
              const pathCheck = checkPathUnlockConditions(displayPath!, playerLevel, playerStats);
              const isPathUnlocked = pathCheck.canUnlock;
              
              return (
              <div className="space-y-3 h-full overflow-y-auto pr-2">
                {/* 标题 */}
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-muted ${displayConfig.color}`}>
                    {PathIcons[displayPath!]}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-lg font-bold ${displayConfig.color}`}>
                      {displayPathText.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {displayPathText.description}
                    </p>
                  </div>
                </div>

                {/* 属性加成 - 使用统一键名获取属性显示名 */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium text-muted-foreground">属性加成</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <span className="text-xs text-muted-foreground">主属性</span>
                      <p className="font-medium">{getStatName(displayPathText.primaryStatKey)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <span className="text-xs text-muted-foreground">副属性</span>
                      <p className="font-medium">{getStatName(displayPathText.secondaryStatKey)}</p>
                    </div>
                  </div>
                </div>

                {/* 修炼加成 */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium text-muted-foreground">修炼加成</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`p-2 rounded-lg flex items-center gap-2 ${
                      displayConfig.cultivationBonus > 0 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-muted/50'
                    }`}>
                      {displayConfig.cultivationBonus > 0 
                        ? <TrendingUp className="w-4 h-4" /> 
                        : <Minus className="w-4 h-4" />
                      }
                      <div>
                        <span className="text-xs">修炼效率</span>
                        <p className="font-medium">+{displayConfig.cultivationBonus}%</p>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg flex items-center gap-2 ${
                      displayConfig.breakthroughBonus > 0 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : displayConfig.breakthroughBonus < 0
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-muted/50'
                    }`}>
                      {displayConfig.breakthroughBonus > 0 
                        ? <TrendingUp className="w-4 h-4" />
                        : displayConfig.breakthroughBonus < 0
                        ? <TrendingDown className="w-4 h-4" />
                        : <Minus className="w-4 h-4" />
                      }
                      <div>
                        <span className="text-xs">突破成功率</span>
                        <p className="font-medium">
                          {displayConfig.breakthroughBonus > 0 ? '+' : ''}{displayConfig.breakthroughBonus}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 流派升级说明 - 显示行为获取经验 */}
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    流派升级方式
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    完成以下行为可获得流派经验，流派等级上限为 Lv.{PATH_LEVEL_CONFIG.maxLevel}
                  </p>
                  <div className="space-y-1">
                    {displayConfig.actionExp.map((action, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
                        <span>{action.description}</span>
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-400">
                          +{action.baseExp} 经验
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    当前等级下一级需要：<span className="font-medium text-blue-600">{getPathLevelExp(pathLevel)}</span> 经验
                  </p>
                </div>

                {/* 流派技能预览 - 显示所有技能 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      流派技能（共{displayConfig.skills.length}个）
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      当前流派等级：Lv.{pathLevel}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {displayConfig.skills.map((skill) => {
                      const isSkillUnlocked = pathLevel >= skill.level;
                      
                      return (
                        <div 
                          key={skill.level} 
                          className={`flex items-start gap-2 text-xs p-2 rounded ${
                            isSkillUnlocked 
                              ? 'bg-green-500/10 border border-green-500/30' 
                              : 'bg-muted/30'
                          }`}
                        >
                          <Badge 
                            variant={isSkillUnlocked ? "default" : "outline"} 
                            className={`shrink-0 text-[10px] mt-0.5 ${
                              isSkillUnlocked 
                                ? 'bg-green-600' 
                                : ''
                            }`}
                          >
                            Lv.{skill.level}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{skill.name}</span>
                              {isSkillUnlocked && (
                                <Check className="w-3 h-3 text-green-600" />
                              )}
                            </div>
                            <span className="text-muted-foreground">{skill.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 终极技能 */}
                <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    终极能力（流派 Lv.{PATH_LEVEL_CONFIG.maxLevel} 解锁）
                  </h4>
                  <p className="text-sm font-medium mt-1">{displayPathText.ultimateAbility.name}</p>
                  <p className="text-xs text-muted-foreground">{displayPathText.ultimateAbility.description}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {displayPathText.ultimateAbility.effect}
                  </p>
                </div>

                {/* 劣势 */}
                {displayConfig.drawbacks.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      劣势
                    </h4>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {displayConfig.drawbacks.map((drawback, i) => (
                        <li key={i}>• {drawback}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* 解锁条件提示 */}
                {!isPathUnlocked && (
                  <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      解锁条件
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pathCheck.reason}
                    </p>
                  </div>
                )}
              </div>
              );
            })() : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>选择一个流派查看详情</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          {currentPath ? (
            // 已选择流派时，只显示关闭按钮
            <Button onClick={onClose}>
              关闭
            </Button>
          ) : (
            // 未选择流派时，显示取消和确认按钮
            <>
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedPath || !checkPathUnlockConditions(selectedPath, playerLevel, playerStats).canUnlock}
              >
                确认选择
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 流派进度显示组件
interface CultivationPathDisplayProps {
  progress: {
    path: CultivationPath | null;
    level: number;
    exp: number;
    skills: string[];
  };
  onOpenSelect: () => void;
  worldType: WorldType;
}

export function CultivationPathDisplay({
  progress,
  onOpenSelect,
  worldType,
}: CultivationPathDisplayProps) {
  // 直接从 worldType 获取对应的文案
  const worldText = getWorldText(worldType);
  
  if (!progress.path) {
    return (
      <Card className="p-3 border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={onOpenSelect}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="w-5 h-5" />
          <span className="text-sm">选择修炼流派</span>
        </div>
      </Card>
    );
  }

  const config = CULTIVATION_PATHS[progress.path];
  const pathText = worldText.paths[PATH_TO_ID[progress.path]];
  const statName = (key: string) => worldText.stats[key as keyof typeof worldText.stats] || key;

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
          {PathIcons[progress.path]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${config.color}`}>{pathText.name}</span>
            <Badge variant="outline" className="text-xs">
              Lv.{progress.level}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            主属性: {statName(pathText.primaryStatKey)}
          </p>
        </div>
      </div>
    </Card>
  );
}
