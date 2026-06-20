import { emit } from '@/core/events';
import {
  adventureEvents,
  collectionEvents,
  combatEvents,
  cultivationEvents,
  economyEvents,
  itemEvents,
  playerEvents,
} from './eventTypes';

export function emitPlayerLevelUp(oldLevel: number, newLevel: number): void {
  emit(playerEvents.events.level_up, { oldLevel, newLevel });
}

export function emitEnemyKilled(params: {
  enemyId?: string;
  enemyName?: string;
  enemyTier: 'normal' | 'elite' | 'miniboss' | 'boss';
  enemyLevel?: number;
  count?: number;
}): void {
  const payload = {
    enemyId: params.enemyId ?? params.enemyName ?? 'unknown_enemy',
    enemyName: params.enemyName ?? params.enemyId ?? 'Unknown Enemy',
    tier: params.enemyTier,
    enemyLevel: params.enemyLevel,
    count: params.count ?? 1,
  };

  emit(combatEvents.events.enemy_killed, payload);

  if (params.enemyTier === 'boss') {
    emit(combatEvents.events.boss_killed, {
      enemyId: payload.enemyId,
      enemyName: payload.enemyName,
      count: payload.count,
    });
  } else if (params.enemyTier === 'elite' || params.enemyTier === 'miniboss') {
    emit(combatEvents.events.elite_killed, {
      enemyId: payload.enemyId,
      enemyName: payload.enemyName,
      count: payload.count,
    });
  }
}

export function emitCultivationPerformed(count: number = 1): void {
  emit(cultivationEvents.events.performed, { count });
}

export function emitCultivationBreakthrough(oldRealm: string, newRealm: string, count: number = 1): void {
  emit(cultivationEvents.events.breakthrough, { oldRealm, newRealm, count });
}

export function emitAdventureEntered(difficulty?: number): void {
  emit(adventureEvents.events.entered, difficulty === undefined ? {} : { difficulty });
}

export function emitAdventureCompleted(difficulty?: number, count: number = 1): void {
  emit(adventureEvents.events.completed, difficulty === undefined ? { count } : { difficulty, count });
}

export function emitItemObtained(templateId: string, count: number = 1, rarity?: string): void {
  emit(itemEvents.events.obtained, { templateId, count, rarity });
}

export function emitItemUsed(templateId: string, count: number = 1): void {
  emit(itemEvents.events.used, { templateId, count });
}

export function emitSpiritStonesGained(amount: number): void {
  if (amount > 0) {
    emit(economyEvents.events.spirit_stones_gained, { amount });
  }
}

export function emitSpiritStonesSpent(amount: number): void {
  if (amount > 0) {
    emit(economyEvents.events.spirit_stones_spent, { amount });
  }
}

export function emitTechniqueObtained(name: string): void {
  emit(collectionEvents.events.technique_obtained, { name });
}

export function emitEquipmentObtained(name: string): void {
  emit(collectionEvents.events.equipment_obtained, { name });
}

export function emitLegendaryObtained(count: number = 1): void {
  emit(collectionEvents.events.legendary_obtained, { count });
}
