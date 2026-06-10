/**
 * 将 wanjie-core Mod 的单文件数据拆分为目录 + 独立文件布局
 *
 * 用法: npx tsx scripts/split-mod-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const MOD_DIR = path.resolve('public/mods/wanjie-core/data');

/** 世界类型英文 type 映射 */
const WORLD_TYPE_MAP: Record<string, { id: number; type: string }> = {
  '修仙': { id: 1, type: 'cultivation' },
  '高武': { id: 2, type: 'martial' },
  '科技': { id: 3, type: 'tech' },
  '魔幻': { id: 4, type: 'magic' },
  '异能': { id: 5, type: 'psi' },
  '仙侠': { id: 6, type: 'xianxia' },
  '武侠': { id: 7, type: 'wuxia' },
  '末世': { id: 8, type: 'apocalypse' },
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`  ✓ ${path.basename(filePath)}`);
}

/**
 * 拆分世界数据：每个世界类型一个文件
 */
function splitWorlds() {
  const src = path.join(MOD_DIR, 'worlds.json');
  if (!fs.existsSync(src)) {
    console.log('  worlds.json 不存在，跳过（可能已拆分）');
    return;
  }
  const data = JSON.parse(fs.readFileSync(src, 'utf-8'));
  const worlds = data.worlds || [];
  const dir = path.join(MOD_DIR, 'world');
  ensureDir(dir);

  for (const world of worlds) {
    const mapping = WORLD_TYPE_MAP[world.id];
    if (!mapping) {
      console.warn(`  警告: 未知世界类型 "${world.id}"，跳过`);
      continue;
    }
    const newData = {
      id: mapping.id,
      type: mapping.type,
      name: world.name,
      legacyId: world.id,
      ...Object.fromEntries(
        Object.entries(world).filter(([key]) => !['id', 'name'].includes(key))
      ),
    };
    writeJson(path.join(dir, `${mapping.type}.json`), newData);
  }
  console.log(`  拆分完成: ${worlds.length} 个世界类型 → world/`);
}

/**
 * 拆分数组类数据：每个条目一个文件，以条目的 id 为文件名
 */
function splitArrayFile(srcName: string, destDir: string) {
  const src = path.join(MOD_DIR, srcName);
  if (!fs.existsSync(src)) {
    console.log(`  ${srcName} 不存在，跳过`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(src, 'utf-8'));
  // 尝试从多种容器键中提取数组
  const list = data[destDir] || data.data || [];
  if (!Array.isArray(list) || list.length === 0) {
    console.log(`  ${srcName}: 未找到有效数组，跳过`);
    return;
  }
  const dir = path.join(MOD_DIR, destDir);
  ensureDir(dir);

  let count = 0;
  for (const item of list) {
    const id = item.id;
    if (!id) {
      console.warn(`  警告: 条目无 id，跳过`);
      continue;
    }
    writeJson(path.join(dir, `${id}.json`), item);
    count++;
  }
  console.log(`  拆分完成: ${count} 个条目 → ${destDir}/`);
}

/**
 * 拆分键值对类数据（如 factions、realms、traits、names、text）
 * 格式: { "worldTypeId": { ... } }
 * 每个 worldTypeId 一个文件
 */
function splitKeyedFile(srcName: string, destDir: string) {
  const src = path.join(MOD_DIR, srcName);
  if (!fs.existsSync(src)) {
    console.log(`  ${srcName} 不存在，跳过`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(src, 'utf-8'));
  // 尝试从容器键中提取
  const map = data[destDir] || data;
  if (typeof map !== 'object' || map === null || Array.isArray(map)) {
    console.log(`  ${srcName}: 格式不是键值对对象，跳过`);
    return;
  }
  const dir = path.join(MOD_DIR, destDir);
  ensureDir(dir);

  let count = 0;
  for (const [key, value] of Object.entries(map as Record<string, unknown>)) {
    if (value && typeof value === 'object') {
      // 用世界英文 type 或原 key 作为文件名
      const mapping = WORLD_TYPE_MAP[key];
      const fileName = mapping ? mapping.type : key;
      writeJson(path.join(dir, `${fileName}.json`), value);
      count++;
    }
  }
  console.log(`  拆分完成: ${count} 个条目 → ${destDir}/`);
}

// ============================================
console.log('拆分 Mod 数据文件...\n');

console.log('[1/8] 世界类型 (worlds.json)');
splitWorlds();

console.log('\n[2/8] 危险效果 (dangers.json)');
splitArrayFile('dangers.json', 'dangers');

console.log('\n[3/8] 机缘效果 (opportunities.json)');
splitArrayFile('opportunities.json', 'opportunities');

console.log('\n[4/8] 势力模板 (factions.json)');
splitKeyedFile('factions.json', 'factions');

console.log('\n[5/8] 境界体系 (realms.json)');
splitKeyedFile('realms.json', 'realms');

console.log('\n[6/8] 词条池 (traits.json)');
splitKeyedFile('traits.json', 'traits');

console.log('\n[7/8] 姓名池 (names.json)');
splitKeyedFile('names.json', 'names');

console.log('\n[8/8] 世界观文案 (text.json)');
splitKeyedFile('text.json', 'text');

console.log('\n✅ 全部拆分完成！');
