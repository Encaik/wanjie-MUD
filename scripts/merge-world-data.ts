/**
 * 将 mods/wanjie-core/data/ 中的所有数据合并为自包含世界文件
 *
 * 每个 world/{type}.json 包含该世界的全部数据：
 * 世界信息 + 境界 + 势力 + 姓名 + 文案 + 词条 + 危险 + 机缘
 *
 * 用法: npx tsx scripts/merge-world-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve('mods/wanjie-core/data');

const WORLD_MAP: Record<string, { id: number; type: string }> = {
  '修仙': { id: 1, type: 'cultivation' },
  '高武': { id: 2, type: 'martial' },
  '科技': { id: 3, type: 'tech' },
  '魔幻': { id: 4, type: 'magic' },
  '异能': { id: 5, type: 'psi' },
  '仙侠': { id: 6, type: 'xianxia' },
  '武侠': { id: 7, type: 'wuxia' },
  '末世': { id: 8, type: 'apocalypse' },
};

/** 危险效果归属（dangerId → 适用世界 type 列表） */
const DANGER_ASSIGNMENTS: Record<string, string[]> = {
  weak_lingqi:       ['cultivation', 'xianxia'],           // 灵气稀薄
  chaotic_elements:  ['martial', 'magic', 'wuxia'],        // 元素/内力紊乱
  restless_mind:     ['tech', 'psi', 'apocalypse'],         // 心神不宁 → 科技干扰/源能干扰
  demon_erosion:     ['cultivation', 'magic', 'apocalypse'], // 魔气/变异侵蚀
  spirit_drain:      ['cultivation', 'magic', 'xianxia'],   // 灵力/魔力/仙元枯竭
  weak_enemies:      ['martial', 'tech', 'wuxia', 'apocalypse'], // 敌强我弱
  reduced_insight:   ['cultivation', 'psi', 'xianxia', 'wuxia'],  // 悟性压制
  enemy_territory:   ['martial', 'tech', 'psi', 'wuxia', 'apocalypse'], // 敌人领地
  cursed_ground:     ['magic', 'apocalypse'],               // 诅咒/辐射之地
  exp_reduction:     ['cultivation', 'xianxia'],             // 天道压制
};

/** 机缘效果归属（opportunityId → 适用世界 type 列表） */
const OPPORTUNITY_ASSIGNMENTS: Record<string, string[]> = {
  abundant_lingqi:    ['cultivation', 'magic', 'xianxia'],  // 灵气/魔力/仙气充沛
  harmonious_elements: ['martial', 'magic', 'wuxia'],       // 元素/内力和谐
  clear_mind:          ['tech', 'psi', 'xianxia', 'wuxia'], // 心神清明
};

function readJson(name: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(SRC, name), 'utf-8'));
}

// 读取源文件
const worldsData = readJson('worlds.json');
const dangersData = readJson('dangers.json');
const oppsData = readJson('opportunities.json');
const factionsData = readJson('factions.json');
const realmsData = readJson('realms.json');
const traitsData = readJson('traits.json');
const namesData = readJson('names.json');
const textData = readJson('text.json');

const worlds = (worldsData.worlds || []) as Record<string, unknown>[];
const allDangers = (dangersData.dangers || []) as Record<string, unknown>[];
const allOpportunities = (oppsData.opportunities || []) as Record<string, unknown>[];

const outDir = path.join(SRC, 'world');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let count = 0;
for (const world of worlds) {
  const oldId = world.id as string;
  const mapping = WORLD_MAP[oldId];
  if (!mapping) {
    console.warn(`未知世界类型: ${oldId}`);
    continue;
  }
  const type = mapping.type;

  // 筛选该世界的危险和机缘
  const worldDangers = allDangers.filter(d =>
    DANGER_ASSIGNMENTS[d.id as string]?.includes(type)
  );
  const worldOpportunities = allOpportunities.filter(o =>
    OPPORTUNITY_ASSIGNMENTS[o.id as string]?.includes(type)
  );

  const merged = {
    id: mapping.id,
    type,
    name: world.name,
    description: world.description,
    baseCoefficient: world.baseCoefficient,
    namePrefixes: world.namePrefixes,
    nameSuffixes: world.nameSuffixes,
    descriptions: world.descriptions,
    powerSystems: world.powerSystems,
    majorForces: world.majorForces,
    // 世界描述中的简易危险/机缘（模板描述）
    worldDangers: world.dangers,
    worldOpportunities: world.opportunities,
    // 数值配置
    stats: world.stats,
    // 视觉配置
    visualConfig: world.visualConfig,
    // 机制配置
    mechanics: world.mechanics,
    // 该世界专属的危险效果（从全局池按归属筛选）
    dangers: worldDangers,
    // 该世界专属的机缘效果
    opportunities: worldOpportunities,
    // 境界体系
    realmSystem: (realmsData as Record<string, unknown>)[oldId] ?? null,
    // 势力模板
    factions: (factionsData as Record<string, Record<string, unknown>>)[oldId] ?? null,
    // 词条池
    traits: (traitsData as Record<string, unknown>)[oldId] ?? null,
    // 姓名池
    names: (namesData as Record<string, unknown>)[oldId] ?? null,
    // 世界观文案
    text: (textData as Record<string, unknown>)[oldId] ?? null,
  };

  const outPath = path.join(outDir, `${type}.json`);
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`  ${type}.json — dangers:${worldDangers.length} opportunities:${worldOpportunities.length}`);
  count++;
}

console.log(`\n合并完成: ${count} 个自包含世界文件`);
