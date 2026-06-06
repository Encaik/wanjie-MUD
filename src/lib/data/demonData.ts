/**
 * 心魔事件配置数据
 * 定义不同的心魔事件和选择
 */

import { DemonEncounter, DemonChoice } from '../game/typesExtension';
import { LegacyStats, StatKey } from '../game/types';

// 心魔事件列表
export const DEMON_ENCOUNTERS: DemonEncounter[] = [
  {
    id: 'demon_greed',
    name: '贪念之魔',
    description: '一道黑影从你心中浮现，它有着与你相同的面孔，眼中却充满贪婪。"修仙之路，资源为先。为何不取他人之物，成就自身大道？"',
    choices: [
      {
        text: '斩杀心魔，坚守本心',
        successRate: 0.6,
        statModifiers: { '灵根': 0.02 },
        successEffect: { stability: 20, stats: { '灵根': 1 } },
        failEffect: { stability: -25, stats: { '灵根': -1 }, demonChance: 5 }
      },
      {
        text: '以理说服，承认欲望',
        successRate: 0.5,
        statModifiers: { '幸运': 0.015 },
        successEffect: { stability: 10, stats: {} },
        failEffect: { stability: -15, stats: { '灵根': -1 }, demonChance: 3 }
      },
      {
        text: '尝试炼化心魔',
        successRate: 0.35,
        statModifiers: { '灵根': 0.03, '幸运': 0.02 },
        successEffect: { stability: 30, stats: { '灵根': 2, '体质': 1 } },
        failEffect: { stability: -40, stats: { '灵根': -2, '体质': -1 }, demonChance: 10 }
      }
    ]
  },
  {
    id: 'demon_fear',
    name: '恐惧之魔',
    description: '黑暗中，无数画面在你眼前闪过——渡劫失败、道消身陨、大道难成...恐惧如潮水般涌来。"放弃吧，凡人如何能逆天而行？"',
    choices: [
      {
        text: '直面恐惧，以勇气破魔',
        successRate: 0.55,
        statModifiers: { '体质': 0.02 },
        successEffect: { stability: 15, stats: { '体质': 1 } },
        failEffect: { stability: -20, stats: { '体质': -1 }, demonChance: 4 }
      },
      {
        text: '接受恐惧，化恐惧为动力',
        successRate: 0.65,
        statModifiers: { '灵根': 0.01 },
        successEffect: { stability: 10, stats: {} },
        failEffect: { stability: -15, stats: {}, demonChance: 2 }
      },
      {
        text: '请神明庇佑',
        successRate: 0.4,
        statModifiers: { '幸运': 0.03 },
        successEffect: { stability: 25, stats: { '幸运': 1 } },
        failEffect: { stability: -35, stats: { '幸运': -1 }, demonChance: 8 }
      }
    ]
  },
  {
    id: 'demon_arrogance',
    name: '傲慢之魔',
    description: '你看到自己站在山巅，俯瞰众生。"你已经超越了所有人，何必再苦修？"傲慢的化身在你耳边低语，让你迷失自我。',
    choices: [
      {
        text: '收敛起心，重新审视自己',
        successRate: 0.7,
        statModifiers: { '灵根': 0.01 },
        successEffect: { stability: 15, stats: { '灵根': 1 } },
        failEffect: { stability: -10, stats: {}, demonChance: 2 }
      },
      {
        text: '以实力镇压心魔',
        successRate: 0.45,
        statModifiers: { '体质': 0.02 },
        successEffect: { stability: 20, stats: { '体质': 1 } },
        failEffect: { stability: -30, stats: { '体质': -1 }, demonChance: 6 }
      },
      {
        text: '承认傲慢，但不被其控制',
        successRate: 0.55,
        statModifiers: { '灵根': 0.015 },
        successEffect: { stability: 12, stats: {} },
        failEffect: { stability: -20, stats: { '灵根': -1 }, demonChance: 4 }
      }
    ]
  },
  {
    id: 'demon_regret',
    name: '悔恨之魔',
    description: '过往的遗憾在你眼前重演——错过的机缘、伤害过的人、错误的决定..."如果当初..."悔恨化作心魔，让你难以自拔。',
    choices: [
      {
        text: '斩断过去，展望未来',
        successRate: 0.6,
        statModifiers: { '灵根': 0.02 },
        successEffect: { stability: 20, stats: { '灵根': 1 } },
        failEffect: { stability: -25, stats: { '灵根': -1 }, demonChance: 5 }
      },
      {
        text: '接受过去，将其化为经验',
        successRate: 0.65,
        statModifiers: { '幸运': 0.01 },
        successEffect: { stability: 15, stats: {} },
        failEffect: { stability: -15, stats: {}, demonChance: 3 }
      },
      {
        text: '寻找弥补之法',
        successRate: 0.4,
        statModifiers: { '幸运': 0.02, '灵根': 0.01 },
        successEffect: { stability: 30, stats: { '灵根': 1, '幸运': 1 } },
        failEffect: { stability: -35, stats: { '灵根': -1 }, demonChance: 7 }
      }
    ]
  },
  {
    id: 'demon_doubt',
    name: '疑惑之魔',
    description: '"你的道路真的正确吗？你的修法真的适合吗？你真的能成仙吗？"无数疑问在你脑海盘旋，让你对修仙之路产生动摇。',
    choices: [
      {
        text: '坚定信念，不为所动',
        successRate: 0.5,
        statModifiers: { '灵根': 0.025 },
        successEffect: { stability: 25, stats: { '灵根': 2 } },
        failEffect: { stability: -30, stats: { '灵根': -2 }, demonChance: 6 }
      },
      {
        text: '审思己过，推敲道路',
        successRate: 0.7,
        statModifiers: { '灵根': 0.01 },
        successEffect: { stability: 10, stats: {} },
        failEffect: { stability: -12, stats: {}, demonChance: 2 }
      },
      {
        text: '向天地求证',
        successRate: 0.35,
        statModifiers: { '幸运': 0.03, '灵根': 0.01 },
        successEffect: { stability: 35, stats: { '灵根': 2, '幸运': 1 } },
        failEffect: { stability: -45, stats: { '灵根': -2, '幸运': -1 }, demonChance: 10 }
      }
    ]
  }
];

// 随机获取一个心魔事件
export function getRandomDemonEncounter(): DemonEncounter {
  const index = Math.floor(Math.random() * DEMON_ENCOUNTERS.length);
  return DEMON_ENCOUNTERS[index];
}

// 计算选择成功率
export function calculateDemonChoiceSuccessRate(
  choice: DemonChoice,
  stats: Partial<LegacyStats>
): number {
  let rate = choice.successRate;
  
  // 添加属性修正
  Object.entries(choice.statModifiers).forEach(([stat, modifier]) => {
    const statKey = stat as StatKey;
    const statValue = stats[statKey] || 0;
    if (typeof modifier === 'number') {
      rate += statValue * modifier;
    }
  });
  
  // 上限90%，下限10%
  return Math.min(0.9, Math.max(0.1, rate));
}

// 计算心魔触发概率
export function calculateDemonTriggerChance(
  stability: number,
  karma: number,
  cultivationPath: string | null
): number {
  let chance = 0;
  
  // 心境稳定度影响
  if (stability < 30) {
    chance += 0.1; // 低稳定度+10%
  } else if (stability < 50) {
    chance += 0.05; // 中低稳定度+5%
  }
  
  // 业力影响（负业力增加概率）
  if (karma < 0) {
    chance += Math.abs(karma) / 100 * 0.05;
  }
  
  // 魔修流派影响
  if (cultivationPath === 'demon') {
    chance += 0.05;
  }
  
  return Math.min(0.3, chance); // 最大30%
}
