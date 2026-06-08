# UI 视觉整改问题清单

> 生成日期：2026-06-08 | 最后更新：2026-06-08
> 整改范围：纯视觉修改，不改动功能逻辑
> 优先级：🔴 高 > 🟡 中 > 🟢 低
> 状态：✅ 已修复 | ⬜ 待修复

---

## 🔴 高优先级（4 项）

### H1. ✅ 入口页面硬编码颜色缺少暗色模式
- **文件**: `src/components/pages/world-select/WorldSelect.tsx`
- **修复**: 危险 tag 改为 `bg-destructive/5 dark:bg-destructive/10 text-destructive`；机缘 tag 保留已有 dark 变体；难度样式添加 `dark:text-*-400` 变体

### H2. ✅ CharacterSelect 词条样式无暗色模式
- **文件**: `src/components/pages/character-select/CharacterSelect.tsx`
- **修复**: 全部 6 种 `ARCHETYPE_STYLES` 添加完整 `dark:` 变体（bg/text/border）

### H3. ✅ CharacterSelect 协同效果标签无暗色模式
- **文件**: `src/components/pages/character-select/CharacterSelect.tsx`
- **修复**: Synergy badges 添加 `dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800`

### H4. ✅ 多处 `alert()` 原生弹窗破坏视觉一致性
- **文件**: `src/components/pages/home/StartScreen.tsx`, `src/components/game/sidebar/SaveLoadPanel.tsx`
- **修复**: 替换为内联错误提示组件，使用 `bg-destructive/10 border-destructive/30 text-destructive` 样式，支持关闭

---

## 🟡 中优先级（10 项）

### M1. ⬜ 全局 tiny text 过度使用
- **文件**: 全局 30+ 个文件
- **状态**: `text-[8px]` 已全部修复为 `text-[10px]`（FragmentPanel、SkillsTab×2、FactionPanel×2）；`text-[9px]` 全局替换量过大，建议后续脚本批量处理

### M2. ✅ StartScreen 背景字使用内联 style
- **文件**: `src/components/pages/home/StartScreen.tsx`
- **修复**: `style={{ fontFamily: 'serif', letterSpacing: '0.1em' }}` → `font-serif tracking-wider`

### M3. ✅ WorldSelect difficultyStyles 使用非语义色
- **文件**: `src/components/pages/world-select/WorldSelect.tsx`
- **修复**: 全部 6 个难度样式添加 `dark:text-*-400` 和 `dark:border-*-500/30` 变体

### M4. ✅ WorldSelect tooltip 使用硬编码边框色
- **文件**: `src/components/pages/world-select/WorldSelect.tsx`
- **修复**: 危险 tooltip `border-red-200 dark:border-red-800` → `border-destructive/30`；机缘 tooltip → `border-emerald-500/30`

### M5. ✅ WorldInfoPanel 星星生成不一致
- **文件**: `src/components/game/sidebar/WorldInfoPanel.tsx`
- **修复**: `{'★'.repeat(info.level)}` → `{generateLevelStars(info.level)}`（统一使用项目工具函数）

### M6. ✅ MentalStateCard 非标准 border
- **文件**: `src/components/game/sidebar/MentalStateCard.tsx`
- **修复**: `border-2` → `border-2 border-primary/20`

### M7. ✅ MainGame TabsContent 内联 style
- **文件**: `src/components/game/layout/MainGame.tsx`
- **修复**: 全部 11 处 `style={{ minHeight: '300px' }}` → `min-h-[300px]`（移入 className）

### M8. ✅ AchievementPanel 通知徽章硬编码色
- **文件**: `src/components/game/tabs/AchievementPanel.tsx`
- **修复**: `bg-red-500 text-white` → `variant="destructive"`

### M9. ✅ ChatRoom getRealmColor 无暗色模式
- **文件**: `src/components/game/shared/ChatRoom.tsx`
- **修复**: 全部 6 个境界等级添加 `dark:text-*-400` 变体

### M10. ✅ SaveLoadPanel 移动端/桌面端样式相同
- **文件**: `src/components/game/sidebar/SaveLoadPanel.tsx`
- **修复**: 移除无意义的 variant 分支，统一使用 `grid grid-cols-2 gap-2`；同时替换 `alert()` 为内联错误提示

---

## 🟢 低优先级（8 项）

### L1. ⬜ 全局过渡动画不统一
- **状态**: 影响面广，建议后续统一为项目级 CSS 变量

### L2. ✅ CultivationPanel getPathColor 硬编码色
- **文件**: `src/components/game/tabs/CultivationPanel.tsx`
- **修复**: 全部 6 种流派颜色添加 `dark:text-*-400` 和 `dark:border-*-700` 变体

### L3. ⬜ StatusPanel 属性变化指示器
- **状态**: 已有 `dark:bg-*-900/50` 变体，可后续优化

### L4. ✅ EquipmentPanel 硬编码属性色
- **文件**: `src/components/game/tabs/EquipmentPanel.tsx`
- **修复**: 全部 8 处 `text-red-500`/`text-blue-500` 添加 `dark:text-red-400`/`dark:text-blue-400`

### L5. ⬜ BattleDialog toggle switch 用裸 div
- **状态**: 替换为 shadcn/ui Switch 涉及功能改动，暂缓

### L6. ✅ MessagePanel 使用内联 style
- **文件**: `src/components/game/shared/MessagePanel.tsx`
- **修复**: `style={{ contentVisibility: 'auto', ... }}` → `[content-visibility:auto]`

### L7. ⬜ 进度条内联 width
- **状态**: React 动态值合理用法，保留

### L8. ⬜ BackstoryView 硬编码文字颜色
- **状态**: 已有 `dark:` 变体，可后续优化

---

## 🆕 附加修复（审查中发现的额外问题）

### A1. ✅ TowerPanel 奖励徽章无暗色模式
- **文件**: `src/components/game/tabs/TowerPanel.tsx`
- **修复**: 首通/灵石/经验 badge 添加完整 `dark:` 变体

### A2. ✅ FragmentPanel 稀有度颜色无暗色模式
- **文件**: `src/components/game/tabs/FragmentPanel.tsx`
- **修复**: `rarityColors` 全部 5 级 + `rarityProgressColors` 全部 5 级添加 `dark:` 变体

### A3. ✅ CollectionPanel 稀有度颜色无暗色模式
- **文件**: `src/components/game/tabs/CollectionPanel.tsx`
- **修复**: `rarityColors` 和 `rarityBgColors` 全部 5 级添加 `dark:` 变体

---

## 📊 修复统计

| 优先级 | 总计 | 已修复 | 待修复 |
|--------|------|--------|--------|
| 🔴 高 | 4 | **4** | 0 |
| 🟡 中 | 10 | **9** | 1 (M1) |
| 🟢 低 | 8 | **3** | 5 |
| 🆕 附加 | 3 | **3** | 0 |
| **合计** | **25** | **19** | **6** |

**修改文件数**: 14 个文件
**质量门禁**: TypeScript ✅ | Build ✅ | File sizes ✅
