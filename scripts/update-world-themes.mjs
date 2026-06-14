/**
 * 批量更新所有世界观 themeConfig — 为每个世界创建独特的配色方案
 *
 * 用法：node scripts/update-world-themes.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
// 8 个世界观的独特配色方案 (oklch)
// ============================================
const themes = {
  // 1. 修仙 — 琥珀金 · 温暖古典仙道
  cultivation: {
    light: {
      '--primary': 'oklch(0.50 0.18 65)',
      '--primary-foreground': 'oklch(0.98 0.01 70)',
      '--accent': 'oklch(0.90 0.06 68)',
      '--background': 'oklch(0.97 0.020 70)',
      '--foreground': 'oklch(0.22 0.04 58)',
      '--border': 'oklch(0.85 0.04 68)',
      '--ring': 'oklch(0.55 0.18 65)',
      '--card': 'oklch(0.99 0.010 70)',
      '--card-foreground': 'oklch(0.22 0.04 60)',
      '--popover': 'oklch(0.99 0.010 70)',
      '--popover-foreground': 'oklch(0.22 0.04 60)',
      '--secondary': 'oklch(0.92 0.025 68)',
      '--secondary-foreground': 'oklch(0.30 0.05 60)',
      '--muted': 'oklch(0.94 0.020 70)',
      '--muted-foreground': 'oklch(0.45 0.04 60)',
      '--accent-foreground': 'oklch(0.25 0.05 60)',
      '--input': 'oklch(0.92 0.020 70)'
    },
    dark: {
      '--primary': 'oklch(0.72 0.15 70)',
      '--primary-foreground': 'oklch(0.14 0.03 55)',
      '--accent': 'oklch(0.30 0.05 58)',
      '--background': 'oklch(0.17 0.03 55)',
      '--foreground': 'oklch(0.92 0.020 72)',
      '--border': 'oklch(0.28 0.04 58)',
      '--ring': 'oklch(0.72 0.15 70)',
      '--card': 'oklch(0.21 0.04 58)',
      '--card-foreground': 'oklch(0.92 0.020 72)',
      '--popover': 'oklch(0.21 0.04 58)',
      '--popover-foreground': 'oklch(0.92 0.020 72)',
      '--secondary': 'oklch(0.26 0.04 60)',
      '--secondary-foreground': 'oklch(0.88 0.020 72)',
      '--muted': 'oklch(0.23 0.03 60)',
      '--muted-foreground': 'oklch(0.65 0.04 62)',
      '--accent-foreground': 'oklch(0.90 0.020 72)',
      '--input': 'oklch(0.23 0.03 60)'
    }
  },

  // 2. 仙侠 — 碧玉青 · 清雅剑道仙境
  xianxia: {
    light: {
      '--primary': 'oklch(0.52 0.16 170)',
      '--primary-foreground': 'oklch(0.98 0.01 170)',
      '--accent': 'oklch(0.90 0.04 175)',
      '--background': 'oklch(0.97 0.010 165)',
      '--foreground': 'oklch(0.20 0.03 175)',
      '--border': 'oklch(0.83 0.03 170)',
      '--ring': 'oklch(0.55 0.16 170)',
      '--card': 'oklch(0.99 0.006 168)',
      '--card-foreground': 'oklch(0.20 0.03 175)',
      '--popover': 'oklch(0.99 0.006 168)',
      '--popover-foreground': 'oklch(0.20 0.03 175)',
      '--secondary': 'oklch(0.92 0.020 170)',
      '--secondary-foreground': 'oklch(0.28 0.04 175)',
      '--muted': 'oklch(0.94 0.012 168)',
      '--muted-foreground': 'oklch(0.43 0.03 172)',
      '--accent-foreground': 'oklch(0.23 0.04 175)',
      '--input': 'oklch(0.92 0.012 168)'
    },
    dark: {
      '--primary': 'oklch(0.70 0.14 170)',
      '--primary-foreground': 'oklch(0.12 0.02 170)',
      '--accent': 'oklch(0.28 0.04 175)',
      '--background': 'oklch(0.16 0.025 175)',
      '--foreground': 'oklch(0.92 0.015 170)',
      '--border': 'oklch(0.26 0.03 175)',
      '--ring': 'oklch(0.70 0.14 170)',
      '--card': 'oklch(0.20 0.03 178)',
      '--card-foreground': 'oklch(0.92 0.015 170)',
      '--popover': 'oklch(0.20 0.03 178)',
      '--popover-foreground': 'oklch(0.92 0.015 170)',
      '--secondary': 'oklch(0.24 0.03 178)',
      '--secondary-foreground': 'oklch(0.88 0.015 170)',
      '--muted': 'oklch(0.22 0.025 178)',
      '--muted-foreground': 'oklch(0.63 0.03 172)',
      '--accent-foreground': 'oklch(0.90 0.015 170)',
      '--input': 'oklch(0.22 0.025 178)'
    }
  },

  // 3. 武侠 — 朱砂赤 · 江湖热血豪情
  wuxia: {
    light: {
      '--primary': 'oklch(0.45 0.16 20)',
      '--primary-foreground': 'oklch(0.98 0.01 25)',
      '--accent': 'oklch(0.88 0.05 22)',
      '--background': 'oklch(0.96 0.018 28)',
      '--foreground': 'oklch(0.20 0.03 25)',
      '--border': 'oklch(0.82 0.03 25)',
      '--ring': 'oklch(0.50 0.16 20)',
      '--card': 'oklch(0.99 0.010 30)',
      '--card-foreground': 'oklch(0.20 0.03 28)',
      '--popover': 'oklch(0.99 0.010 30)',
      '--popover-foreground': 'oklch(0.20 0.03 28)',
      '--secondary': 'oklch(0.92 0.022 28)',
      '--secondary-foreground': 'oklch(0.28 0.04 25)',
      '--muted': 'oklch(0.94 0.015 30)',
      '--muted-foreground': 'oklch(0.43 0.03 28)',
      '--accent-foreground': 'oklch(0.23 0.04 25)',
      '--input': 'oklch(0.92 0.015 30)'
    },
    dark: {
      '--primary': 'oklch(0.65 0.18 25)',
      '--primary-foreground': 'oklch(0.12 0.02 20)',
      '--accent': 'oklch(0.28 0.05 25)',
      '--background': 'oklch(0.15 0.03 22)',
      '--foreground': 'oklch(0.92 0.020 30)',
      '--border': 'oklch(0.25 0.04 25)',
      '--ring': 'oklch(0.65 0.18 25)',
      '--card': 'oklch(0.19 0.04 28)',
      '--card-foreground': 'oklch(0.92 0.020 30)',
      '--popover': 'oklch(0.19 0.04 28)',
      '--popover-foreground': 'oklch(0.92 0.020 30)',
      '--secondary': 'oklch(0.23 0.04 28)',
      '--secondary-foreground': 'oklch(0.88 0.020 30)',
      '--muted': 'oklch(0.21 0.035 28)',
      '--muted-foreground': 'oklch(0.63 0.03 28)',
      '--accent-foreground': 'oklch(0.90 0.020 30)',
      '--input': 'oklch(0.21 0.035 28)'
    }
  },

  // 4. 高武 — 玄铁橙 · 烈炎武者之道
  martial: {
    light: {
      '--primary': 'oklch(0.50 0.20 40)',
      '--primary-foreground': 'oklch(0.98 0.01 45)',
      '--accent': 'oklch(0.90 0.06 42)',
      '--background': 'oklch(0.97 0.015 48)',
      '--foreground': 'oklch(0.20 0.03 42)',
      '--border': 'oklch(0.84 0.04 45)',
      '--ring': 'oklch(0.55 0.20 40)',
      '--card': 'oklch(0.99 0.008 50)',
      '--card-foreground': 'oklch(0.20 0.03 45)',
      '--popover': 'oklch(0.99 0.008 50)',
      '--popover-foreground': 'oklch(0.20 0.03 45)',
      '--secondary': 'oklch(0.92 0.022 48)',
      '--secondary-foreground': 'oklch(0.28 0.04 42)',
      '--muted': 'oklch(0.94 0.018 50)',
      '--muted-foreground': 'oklch(0.43 0.03 45)',
      '--accent-foreground': 'oklch(0.23 0.04 42)',
      '--input': 'oklch(0.92 0.018 50)'
    },
    dark: {
      '--primary': 'oklch(0.72 0.18 48)',
      '--primary-foreground': 'oklch(0.12 0.02 40)',
      '--accent': 'oklch(0.30 0.05 42)',
      '--background': 'oklch(0.16 0.03 35)',
      '--foreground': 'oklch(0.92 0.020 50)',
      '--border': 'oklch(0.27 0.04 42)',
      '--ring': 'oklch(0.72 0.18 48)',
      '--card': 'oklch(0.20 0.04 38)',
      '--card-foreground': 'oklch(0.92 0.020 50)',
      '--popover': 'oklch(0.20 0.04 38)',
      '--popover-foreground': 'oklch(0.92 0.020 50)',
      '--secondary': 'oklch(0.24 0.04 40)',
      '--secondary-foreground': 'oklch(0.88 0.020 50)',
      '--muted': 'oklch(0.22 0.035 40)',
      '--muted-foreground': 'oklch(0.63 0.04 45)',
      '--accent-foreground': 'oklch(0.90 0.020 50)',
      '--input': 'oklch(0.22 0.035 40)'
    }
  },

  // 5. 魔幻 — 紫晶靛 · 神秘魔法领域
  magic: {
    light: {
      '--primary': 'oklch(0.48 0.18 300)',
      '--primary-foreground': 'oklch(0.98 0.01 300)',
      '--accent': 'oklch(0.88 0.05 295)',
      '--background': 'oklch(0.97 0.012 290)',
      '--foreground': 'oklch(0.18 0.03 295)',
      '--border': 'oklch(0.82 0.03 295)',
      '--ring': 'oklch(0.52 0.18 300)',
      '--card': 'oklch(0.99 0.008 292)',
      '--card-foreground': 'oklch(0.18 0.03 295)',
      '--popover': 'oklch(0.99 0.008 292)',
      '--popover-foreground': 'oklch(0.18 0.03 295)',
      '--secondary': 'oklch(0.92 0.018 290)',
      '--secondary-foreground': 'oklch(0.26 0.04 295)',
      '--muted': 'oklch(0.94 0.014 292)',
      '--muted-foreground': 'oklch(0.40 0.03 292)',
      '--accent-foreground': 'oklch(0.20 0.04 295)',
      '--input': 'oklch(0.92 0.014 292)'
    },
    dark: {
      '--primary': 'oklch(0.68 0.20 305)',
      '--primary-foreground': 'oklch(0.10 0.02 300)',
      '--accent': 'oklch(0.28 0.05 298)',
      '--background': 'oklch(0.14 0.03 290)',
      '--foreground': 'oklch(0.92 0.018 295)',
      '--border': 'oklch(0.24 0.04 295)',
      '--ring': 'oklch(0.68 0.20 305)',
      '--card': 'oklch(0.18 0.04 292)',
      '--card-foreground': 'oklch(0.92 0.018 295)',
      '--popover': 'oklch(0.18 0.04 292)',
      '--popover-foreground': 'oklch(0.92 0.018 295)',
      '--secondary': 'oklch(0.22 0.04 295)',
      '--secondary-foreground': 'oklch(0.88 0.018 295)',
      '--muted': 'oklch(0.20 0.035 295)',
      '--muted-foreground': 'oklch(0.60 0.04 298)',
      '--accent-foreground': 'oklch(0.90 0.018 295)',
      '--input': 'oklch(0.20 0.035 295)'
    }
  },

  // 6. 科技 — 电光蓝 · 赛博未来纪元
  tech: {
    light: {
      '--primary': 'oklch(0.50 0.16 250)',
      '--primary-foreground': 'oklch(0.98 0.01 250)',
      '--accent': 'oklch(0.88 0.03 248)',
      '--background': 'oklch(0.97 0.006 255)',
      '--foreground': 'oklch(0.16 0.015 250)',
      '--border': 'oklch(0.83 0.015 250)',
      '--ring': 'oklch(0.55 0.16 250)',
      '--card': 'oklch(0.99 0.004 255)',
      '--card-foreground': 'oklch(0.16 0.015 250)',
      '--popover': 'oklch(0.99 0.004 255)',
      '--popover-foreground': 'oklch(0.16 0.015 250)',
      '--secondary': 'oklch(0.92 0.015 250)',
      '--secondary-foreground': 'oklch(0.24 0.03 250)',
      '--muted': 'oklch(0.94 0.010 252)',
      '--muted-foreground': 'oklch(0.40 0.02 250)',
      '--accent-foreground': 'oklch(0.18 0.03 250)',
      '--input': 'oklch(0.92 0.010 252)'
    },
    dark: {
      '--primary': 'oklch(0.70 0.16 252)',
      '--primary-foreground': 'oklch(0.08 0.02 245)',
      '--accent': 'oklch(0.26 0.04 248)',
      '--background': 'oklch(0.13 0.025 248)',
      '--foreground': 'oklch(0.94 0.010 252)',
      '--border': 'oklch(0.24 0.03 250)',
      '--ring': 'oklch(0.70 0.16 252)',
      '--card': 'oklch(0.17 0.03 250)',
      '--card-foreground': 'oklch(0.94 0.010 252)',
      '--popover': 'oklch(0.17 0.03 250)',
      '--popover-foreground': 'oklch(0.94 0.010 252)',
      '--secondary': 'oklch(0.21 0.03 252)',
      '--secondary-foreground': 'oklch(0.90 0.010 252)',
      '--muted': 'oklch(0.19 0.025 252)',
      '--muted-foreground': 'oklch(0.62 0.03 248)',
      '--accent-foreground': 'oklch(0.92 0.010 252)',
      '--input': 'oklch(0.19 0.025 252)'
    }
  },

  // 7. 异能 — 极光紫 · 超能觉醒之力
  psi: {
    light: {
      '--primary': 'oklch(0.48 0.20 280)',
      '--primary-foreground': 'oklch(0.98 0.01 280)',
      '--accent': 'oklch(0.88 0.05 278)',
      '--background': 'oklch(0.97 0.015 282)',
      '--foreground': 'oklch(0.18 0.03 280)',
      '--border': 'oklch(0.82 0.03 280)',
      '--ring': 'oklch(0.52 0.20 280)',
      '--card': 'oklch(0.99 0.010 285)',
      '--card-foreground': 'oklch(0.18 0.03 280)',
      '--popover': 'oklch(0.99 0.010 285)',
      '--popover-foreground': 'oklch(0.18 0.03 280)',
      '--secondary': 'oklch(0.92 0.020 282)',
      '--secondary-foreground': 'oklch(0.26 0.04 280)',
      '--muted': 'oklch(0.94 0.018 285)',
      '--muted-foreground': 'oklch(0.40 0.04 280)',
      '--accent-foreground': 'oklch(0.20 0.04 280)',
      '--input': 'oklch(0.92 0.018 285)'
    },
    dark: {
      '--primary': 'oklch(0.68 0.22 285)',
      '--primary-foreground': 'oklch(0.10 0.02 275)',
      '--accent': 'oklch(0.28 0.06 280)',
      '--background': 'oklch(0.14 0.04 275)',
      '--foreground': 'oklch(0.92 0.020 282)',
      '--border': 'oklch(0.24 0.05 280)',
      '--ring': 'oklch(0.68 0.22 285)',
      '--card': 'oklch(0.18 0.05 278)',
      '--card-foreground': 'oklch(0.92 0.020 282)',
      '--popover': 'oklch(0.18 0.05 278)',
      '--popover-foreground': 'oklch(0.92 0.020 282)',
      '--secondary': 'oklch(0.22 0.05 280)',
      '--secondary-foreground': 'oklch(0.88 0.020 282)',
      '--muted': 'oklch(0.20 0.045 280)',
      '--muted-foreground': 'oklch(0.60 0.05 280)',
      '--accent-foreground': 'oklch(0.90 0.020 282)',
      '--input': 'oklch(0.20 0.045 280)'
    }
  },

  // 8. 末世 — 锈铁橙 · 废土末日余晖
  apocalypse: {
    light: {
      '--primary': 'oklch(0.46 0.14 35)',
      '--primary-foreground': 'oklch(0.97 0.01 38)',
      '--accent': 'oklch(0.86 0.05 40)',
      '--background': 'oklch(0.96 0.012 55)',
      '--foreground': 'oklch(0.19 0.02 40)',
      '--border': 'oklch(0.80 0.025 45)',
      '--ring': 'oklch(0.50 0.14 35)',
      '--card': 'oklch(0.98 0.008 55)',
      '--card-foreground': 'oklch(0.19 0.02 42)',
      '--popover': 'oklch(0.98 0.008 55)',
      '--popover-foreground': 'oklch(0.19 0.02 42)',
      '--secondary': 'oklch(0.90 0.018 50)',
      '--secondary-foreground': 'oklch(0.25 0.03 42)',
      '--muted': 'oklch(0.93 0.012 52)',
      '--muted-foreground': 'oklch(0.40 0.025 45)',
      '--accent-foreground': 'oklch(0.21 0.03 42)',
      '--input': 'oklch(0.90 0.012 52)'
    },
    dark: {
      '--primary': 'oklch(0.62 0.14 38)',
      '--primary-foreground': 'oklch(0.12 0.02 35)',
      '--accent': 'oklch(0.26 0.04 40)',
      '--background': 'oklch(0.13 0.02 40)',
      '--foreground': 'oklch(0.90 0.020 50)',
      '--border': 'oklch(0.22 0.025 42)',
      '--ring': 'oklch(0.62 0.14 38)',
      '--card': 'oklch(0.16 0.03 42)',
      '--card-foreground': 'oklch(0.90 0.020 50)',
      '--popover': 'oklch(0.16 0.03 42)',
      '--popover-foreground': 'oklch(0.90 0.020 50)',
      '--secondary': 'oklch(0.20 0.03 44)',
      '--secondary-foreground': 'oklch(0.86 0.020 50)',
      '--muted': 'oklch(0.18 0.025 44)',
      '--muted-foreground': 'oklch(0.58 0.03 45)',
      '--accent-foreground': 'oklch(0.88 0.020 50)',
      '--input': 'oklch(0.18 0.025 44)'
    }
  }
};

// ============================================
// 批量更新
// ============================================
const worldviewDir = path.resolve(__dirname, '..', 'mods', 'wanjie-core', 'data', 'worldview');

for (const [id, themeConfig] of Object.entries(themes)) {
  const filePath = path.join(worldviewDir, `${id}.json`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = JSON.parse(raw);

  // 替换 themeConfig
  content.themeConfig = themeConfig;

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
  console.log(`✓ ${id} (${content.name})`);
}

console.log(`\n全部 ${Object.keys(themes).length} 个世界观主题已更新！`);
