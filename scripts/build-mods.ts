/**
 * Mod 构建脚本
 *
 * 构建时将 mods/ 目录复制到 public/mods/，并生成 mod-list.json 索引文件。
 *
 * 用法：
 *   npx tsx scripts/build-mods.ts
 *
 * 集成到 pnpm build 流程中自动执行。
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

const scriptFilePath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFilePath);
const MODS_SOURCE = path.resolve(scriptDir, '../mods');
const MODS_TARGET = path.resolve(scriptDir, '../public/mods');

interface ModListEntry {
  id: string;
  path: string;
}

interface ModList {
  mods: ModListEntry[];
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src: string, dest: string) {
  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 合并 Mod 的分散 JSON 数据文件为单个 data.json
 *
 * 读取 mod.json 的 dataFiles 字段，按 content type 分组读取各文件，
 * 合并后写入目标目录的 data.json。
 *
 * world 类型数据以每个文件的 type 字段为 key 合并为对象映射。
 */
function bundleModData(modDir: string, targetDir: string, modJson: Record<string, unknown>) {
  const dataFiles = modJson.dataFiles as Record<string, string | string[]> | undefined;
  if (!dataFiles || Object.keys(dataFiles).length === 0) {
    return;
  }

  const merged: Record<string, unknown> = {};

  for (const [contentType, dataPathValue] of Object.entries(dataFiles)) {
    // 归一化为数组处理
    const dataPaths = Array.isArray(dataPathValue) ? dataPathValue : [dataPathValue];
    const isArrayMode = Array.isArray(dataPathValue);
    const entries: Record<string, unknown> = {};

    for (const dataPath of dataPaths) {
      const filePath = path.join(modDir, dataPath);
      if (!fs.existsSync(filePath)) {
        console.warn(`  ⚠ 数据文件不存在，跳过: ${dataPath}`);
        continue;
      }

      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (contentType === 'world' && isArrayMode && content && typeof content === 'object' && !Array.isArray(content)) {
          // world 类型：以 type 字段为 key 合并
          const worldType = (content as Record<string, unknown>).type as string;
          if (worldType) {
            entries[worldType] = content;
          } else {
            console.warn(`  ⚠ world 数据文件缺少 type 字段，跳过: ${dataPath}`);
          }
        } else {
          // 其他类型：直接使用内容（单文件用内容本身，多文件用数组合并）
          if (isArrayMode) {
            entries[dataPath] = content;
          } else {
            merged[contentType] = content;
          }
        }
      } catch (err) {
        console.warn(`  ⚠ 解析数据文件失败: ${dataPath}`, err);
      }
    }

    // world 类型或数组模式写回合并结果
    if (contentType === 'world' && isArrayMode && Object.keys(entries).length > 0) {
      merged[contentType] = entries;
    } else if (!isArrayMode) {
      // 单文件模式已在上面直接赋值
    }
  }

  if (Object.keys(merged).length > 0) {
    const outputPath = path.join(targetDir, 'data.json');
    fs.writeFileSync(outputPath, JSON.stringify(merged), 'utf-8');
    console.log(`  ✓ 生成合并数据: data.json (${Object.keys(merged).join(', ')})`);
  }
}

function buildMods() {
  console.log('\n🔧 构建 Mod 数据...\n');

  // 清理目标目录
  if (fs.existsSync(MODS_TARGET)) {
    fs.rmSync(MODS_TARGET, { recursive: true });
  }

  if (!fs.existsSync(MODS_SOURCE)) {
    console.warn('  ⚠ mods/ 目录不存在，跳过');
    return;
  }

  // 复制所有 Mod 目录
  const entries = fs.readdirSync(MODS_SOURCE, { withFileTypes: true });
  const modList: ModList = { mods: [] };

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const modDir = path.join(MODS_SOURCE, entry.name);
    const modJsonPath = path.join(modDir, 'mod.json');

    // 检查是否是有效的 Mod 目录（包含 mod.json）
    if (!fs.existsSync(modJsonPath)) {
      console.warn(`  ⚠ 跳过 "${entry.name}"：缺少 mod.json`);
      continue;
    }

    // 解析 mod.json 获取 ID
    try {
      const modJson = JSON.parse(fs.readFileSync(modJsonPath, 'utf-8'));
      const modId = modJson.id || entry.name;

      // 跳过模板 Mod（template: true）
      if (modJson.template === true) {
        console.log(`  ⊘ ${entry.name} (id: ${modId}) — 模板，已跳过`);
        continue;
      }

      // 复制到目标
      const targetDir = path.join(MODS_TARGET, entry.name);
      copyDir(modDir, targetDir);

      // 合并分散的数据文件为 data.json
      bundleModData(modDir, targetDir, modJson);

      modList.mods.push({ id: modId, path: entry.name });
      console.log(`  ✓ ${entry.name} (id: ${modId})`);
    } catch (err) {
      console.error(`  ✗ "${entry.name}" 的 mod.json 解析失败:`, err);
    }
  }

  // 生成 mod-list.json 索引
  const indexPath = path.join(MODS_TARGET, 'mod-list.json');
  fs.writeFileSync(indexPath, JSON.stringify(modList, null, 2), 'utf-8');
  console.log(`\n  ✓ 生成索引: mod-list.json (${modList.mods.length} 个 Mod)`);
  console.log(`\n✅ Mod 构建完成，输出到: ${MODS_TARGET}\n`);
}

buildMods();
