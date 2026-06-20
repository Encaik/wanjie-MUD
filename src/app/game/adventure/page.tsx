/**
 * Fortune adventure page with unified settlement wiring.
 */

'use client';

import { emitAdventureCompleted, emitAdventureEntered, emitItemObtained, emitSpiritStonesGained } from '@/core/statistics';
import { getTemplate, hasTemplate } from '@/modules/item/data';
import { addItem } from '@/modules/item/logic';
import { useFortune } from '@/modules/fortune';
import type { SettlementResult } from '@/modules/fortune';
import { getWorldviewCurrencyItemId } from '@/modules/reward-pool/logic/poolEngine';
import { FortunePage } from '@/views/game/pages/FortunePage';
import { useGameStore } from '@/views/game/state/GameStore';

function mergeFragmentInventory(
  prev: Record<string, unknown> | undefined,
  settlement: SettlementResult,
): Record<string, unknown> | undefined {
  if (settlement.finalLoot.fragments.length === 0) return prev;

  const next = { ...(prev ?? {}) } as Record<string, number>;
  for (const fragment of settlement.finalLoot.fragments) {
    next[fragment.sourceName] = (next[fragment.sourceName] ?? 0) + fragment.count;
  }
  return next;
}

export default function Page() {
  const { gameState, dispatch: setGameState } = useGameStore();
  const protagonist = gameState.protagonist;

  const fortune = useFortune({
    slice: gameState.fortuneSlice,
    updateSlice: (updater) => {
      const emittedEvents: Array<() => void> = [];

      setGameState((prev) => {
        const previousSlice = prev.fortuneSlice;
        const nextSlice = updater(previousSlice);
        const settlement = nextSlice.settlement;

        if (!prev.protagonist) {
          return { ...prev, fortuneSlice: nextSlice };
        }

        let nextProtagonist = prev.protagonist;

        if (previousSlice.phase !== 'exploring' && nextSlice.phase === 'exploring') {
          emittedEvents.push(() => emitAdventureEntered());
        }

        if (
          previousSlice.phase !== 'result'
          && nextSlice.phase === 'result'
          && settlement
          && previousSlice.settlement !== settlement
        ) {
          const currencyId = getWorldviewCurrencyItemId(nextProtagonist.world.worldviewId);
          let nextItems = [...nextProtagonist.items, ...settlement.finalLoot.items];

          if (settlement.finalLoot.spiritStones > 0 && hasTemplate(currencyId)) {
            nextItems = addItem(nextItems, currencyId, settlement.finalLoot.spiritStones, { source: 'drop' });
          }

          nextProtagonist = {
            ...nextProtagonist,
            items: nextItems,
            experience: nextProtagonist.experience + settlement.finalLoot.experience,
            fragmentInventory: mergeFragmentInventory(nextProtagonist.fragmentInventory, settlement),
          };

          if (settlement.type !== 'death') {
            emittedEvents.push(() => emitAdventureCompleted());
          }

          if (settlement.finalLoot.spiritStones > 0) {
            emittedEvents.push(() => emitSpiritStonesGained(settlement.finalLoot.spiritStones));
            emittedEvents.push(() => emitItemObtained(currencyId, settlement.finalLoot.spiritStones));
          }

          for (const item of settlement.finalLoot.items) {
            emittedEvents.push(() => {
              const rarity = hasTemplate(item.templateId) ? getTemplate(item.templateId).rarity : undefined;
              emitItemObtained(item.templateId, item.quantity, rarity);
            });
          }
        }

        return {
          ...prev,
          protagonist: nextProtagonist,
          fortuneSlice: nextSlice,
        };
      });

      for (const emitEvent of emittedEvents) {
        emitEvent();
      }
    },
    wuxing: protagonist?.stats?.base?.['\u609f\u6027'] ?? 10,
    lingshi: protagonist?.stats?.base?.['\u7075\u6839'] ?? 10,
    maxHp: protagonist?.maxHp ?? 100,
    maxMp: protagonist?.maxMp ?? 100,
    playerLevel: protagonist?.level ?? 1,
    seed: Date.now(),
  });

  return <FortunePage fortuneSlice={gameState.fortuneSlice} fortune={fortune} />;
}
