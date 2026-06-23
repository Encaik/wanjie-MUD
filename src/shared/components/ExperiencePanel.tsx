'use client';

import { Compass, Swords } from 'lucide-react';

import { AdventureEvent, WorldType } from '@/core/types';
import { CooldownButton } from '@/shared/components/CooldownButton';
import { Button } from '@/shared/ui/actions/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';


interface ExperiencePanelProps {
  currentEvent: AdventureEvent | null;
  onExplore: () => void;
  onChoose: (index: number) => void;
  disabled?: boolean;
  worldType: WorldType;
  lastExploreTime: number; // 上次历练的时间戳
}

// 历练CD时间（3秒）
const EXPLORE_COOLDOWN = 3000;

export function ExperiencePanel({ 
  currentEvent, 
  onExplore, 
  onChoose, 
  disabled,
  lastExploreTime,
}: ExperiencePanelProps) {
  if (!currentEvent) {
    return (
      <Card>
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Compass className="w-4 h-4 text-primary" />
            历练
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 space-y-1.5">
          <CooldownButton
            className="w-full h-8 text-xs"
            onClick={onExplore}
            disabled={disabled}
            cooldown={EXPLORE_COOLDOWN}
            lastTriggerTime={lastExploreTime}
          >
            <Compass className="w-3 h-3 mr-1" />
            开始历练
          </CooldownButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {currentEvent.choices[0]?.battle ? (
            <Swords className="w-4 h-4 text-game-combat" />
          ) : (
            <Compass className="w-4 h-4 text-primary" />
          )}
          {currentEvent.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2 space-y-1.5">
        <p className="text-xs leading-relaxed text-muted-foreground">{currentEvent.description}</p>
        
        <div className="space-y-1.5">
          {currentEvent.choices.map((choice: any, index: number) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left h-auto py-2 px-3 text-xs"
              onClick={() => onChoose(index)}
              disabled={disabled}
            >
              <span className="mr-2 font-bold text-primary shrink-0">
                {['甲', '乙', '丙'][index]}.
              </span>
              <span>{choice.text}</span>
              {choice.battle && (
                <Swords className="w-3 h-3 ml-auto text-game-combat" />
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
