'use client';

import { useState, useEffect } from 'react';

import { 
  Globe, Sparkles, ChevronRight, RotateCcw,
  Mountain, Sword, Cpu, Wand2, Zap, Trees, Heart,
  AlertTriangle, Star
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { WORLD_NAME_GENERATORS } from '@/lib/data/ascensionData';
import { WorldType } from '@/lib/game/types';
import { NewWorldInfo } from '@/lib/game/typesExtension';

interface WorldRevealProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newWorld: NewWorldInfo;
  hasReroll: boolean;
  onConfirm: () => void;
  onReroll: () => void;
}

// 世界类型图标
const WORLD_ICONS: Record<WorldType, React.ReactNode> = {
  '修仙': <Mountain className="w-8 h-8" />,
  '高武': <Sword className="w-8 h-8" />,
  '科技': <Cpu className="w-8 h-8" />,
  '魔幻': <Wand2 className="w-8 h-8" />,
  '异能': <Zap className="w-8 h-8" />,
  '仙侠': <Trees className="w-8 h-8" />,
  '武侠': <Sword className="w-8 h-8" />,
  '末世': <Heart className="w-8 h-8" />,
};

// 世界类型颜色
const WORLD_COLORS: Record<WorldType, string> = {
  '修仙': 'from-purple-500 to-blue-500',
  '高武': 'from-red-500 to-orange-500',
  '科技': 'from-cyan-500 to-blue-500',
  '魔幻': 'from-pink-500 to-purple-500',
  '异能': 'from-yellow-500 to-orange-500',
  '仙侠': 'from-emerald-500 to-teal-500',
  '武侠': 'from-amber-500 to-yellow-500',
  '末世': 'from-gray-500 to-red-500',
};

export function WorldReveal({
  open,
  onOpenChange,
  newWorld,
  hasReroll,
  onConfirm,
  onReroll,
}: WorldRevealProps) {
  const [isRevealing, setIsRevealing] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // 处理揭示动画
  useEffect(() => {
    if (open) {
      setIsRevealing(true);
      setShowContent(false);
      
      // 2秒后显示内容
      const timer = setTimeout(() => {
        setIsRevealing(false);
        setShowContent(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // 处理确认
  const handleConfirm = () => {
    onConfirm();
  };

  // 处理重新随机
  const handleReroll = () => {
    setIsRevealing(true);
    setShowContent(false);
    onReroll();
    
    // 重新开始动画
    setTimeout(() => {
      setIsRevealing(false);
      setShowContent(true);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[500px] border-0 bg-transparent shadow-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        {/* 揭示动画 */}
        {isRevealing && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse flex items-center justify-center">
                <Globe className="w-16 h-16 text-white animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-30" />
            </div>
            <p className="mt-8 text-xl font-bold text-white animate-pulse">
              命运之轮转动中...
            </p>
            <div className="flex gap-1 mt-4">
              {[0, 1, 2].map(i => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 世界揭示内容 */}
        {showContent && (
          <Card className={`bg-gradient-to-br ${WORLD_COLORS[newWorld.type]} border-0 text-white overflow-hidden`}>
            <div className="absolute inset-0 bg-black/20" />
            <CardHeader className="relative z-10 text-center pb-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-lg font-bold">新世界已确定</span>
                <Sparkles className="w-5 h-5" />
              </div>
              <DialogTitle className="text-3xl font-bold">
                {newWorld.name}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {WORLD_ICONS[newWorld.type]}
                <span className="ml-2">{newWorld.type}世界</span>
              </DialogDescription>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-4">
              {/* 世界描述 */}
              <div className="bg-black/20 rounded-lg p-4">
                <p className="text-sm text-white/90">{newWorld.description}</p>
              </div>

              {/* 世界特性 */}
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  世界特性
                </div>
                <div className="flex flex-wrap gap-2">
                  {newWorld.specialFeatures.map((feature, idx) => (
                    <Badge 
                      key={idx}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 世界参数 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-xs text-white/60">难度系数</div>
                  <div className="text-lg font-bold">{newWorld.difficulty.toFixed(1)}x</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-xs text-white/60">危险等级</div>
                  <div className="text-lg font-bold flex items-center gap-1">
                    {newWorld.danger === '死亡之地' && <AlertTriangle className="w-4 h-4" />}
                    {newWorld.danger}
                  </div>
                </div>
              </div>

              {/* 资源丰富度 */}
              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/60">资源丰富度</span>
                  <span className="text-sm font-medium">
                    {(newWorld.resourceAbundance * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${newWorld.resourceAbundance * 100}%` }}
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2">
                {hasReroll && (
                  <Button
                    variant="outline"
                    onClick={handleReroll}
                    className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    重新随机
                  </Button>
                )}
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-white text-gray-900 hover:bg-white/90"
                >
                  确认前往
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
