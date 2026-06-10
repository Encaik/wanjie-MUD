/**
 * 版本同步脚本
 *
 * 读取 package.json 的 version 字段，同步到 src/shared/config/version.ts 中的 GAME_VERSION 常量。
 * 在构建流程中自动运行，确保版本号一致性。
 *
 * 用法: npx tsx scripts/sync-version.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptFilePath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFilePath);
const ROOT = path.resolve(scriptDir, '..');

// 1. 读取 package.json 版本号
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version: string = pkg.version;
if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`❌ package.json 中的 version 字段无效: "${version}"`);
  process.exit(1);
}

// 2. 更新 src/shared/config/version.ts
const versionFilePath = path.join(ROOT, 'src', 'shared', 'config', 'version.ts');
const content = fs.readFileSync(versionFilePath, 'utf-8');

// 匹配 GAME_VERSION = '...' 并替换
const updated = content.replace(
  /export const GAME_VERSION = '[^']*'/,
  `export const GAME_VERSION = '${version}'`,
);

if (updated === content) {
  console.log(`✅ GAME_VERSION 已与 package.json 同步: ${version}（无变更）`);
} else {
  fs.writeFileSync(versionFilePath, updated, 'utf-8');
  console.log(`✅ GAME_VERSION 已同步: ${version}`);
}
