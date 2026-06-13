## 1. 基础设施：目录重组 + barrel 导出

- [x] 1.1 在 `src/shared/ui/` 下创建子目录：`actions/`、`data-display/`、`feedback/`、`overlay/`、`forms/`，每个目录初始化 `index.ts`
- [x] 1.2 创建 `src/shared/ui/index.ts` barrel 导出
- [x] 1.3 将 `button-group.tsx` 移至 `src/shared/ui/actions/`
- [x] 1.4 将 `spinner.tsx`、`empty.tsx` 移至 `src/shared/ui/feedback/`
- [x] 1.5 将 `item.tsx`、`tabs.tsx` 移至 `src/shared/ui/data-display/`
- [x] 1.6 将 `item-tooltip.tsx`、`upgradeable-item-tooltip.tsx` 移至 `src/shared/ui/overlay/`
- [x] 1.7 将 `field.tsx`、`input-group.tsx` 移至 `src/shared/ui/forms/`
- [x] 1.8 运行 `pnpm ts-check` 验证

## 2. 游戏语义色层注入

- [x] 2.1 在 `src/app/styles/themes.css` 的 `:root` 块中新增 6 组游戏领域色 CSS 变量
- [x] 2.2 在 `:root` 中新增 6 组对应色背景版
- [x] 2.3 在 `.dark` 块中新增对应的暗色变量值
- [x] 2.4 在 `src/app/styles/tokens.css` 桥接所有 `--color-game-*`

## 3. 组件重构：空状态统一

- [x] 3.1 审视 `empty-slot.tsx` 中的 `EmptySlotCard`、`BackpackHeader`、`EmptyBackpackHint`，将其移至 `src/shared/ui/feedback/` 目录
- [x] 3.2 重构上述组件以复用 `Empty` 组件族的子部件（如使用 `font-serif`）
- [x] 3.3 将原 `empty-slot.tsx` 替换为 re-export shim（待后续删除）
- [x] 3.4 更新所有 `@/shared/ui/empty-slot` 的消费者为新的 import 路径

## 4. 组件重构：CooldownButton 迁移

- [x] 4.1 将 `cooldown-button.tsx` 复制到 `src/shared/components/CooldownButton.tsx`
- [x] 4.2 更新 CooldownButton 的内部 import 引用
- [x] 4.3 原文件替换为 re-export shim
- [x] 4.4 更新消费者 `ExperiencePanel.tsx` 的 import 路径
- [x] 4.5 运行 `pnpm ts-check` 验证

## 5. 硬编码消除：模块组件颜色替换

- [x] 5.1 替换 `CultivationPanel.tsx` 中 `getPathColor()` 硬编码色为 `game-*` 语义色
- [x] 5.2 替换 `CultivationPanel.tsx` 中渐变bg、突破/渡劫区域的内联硬编码色
- [x] 5.3 替换 `DifficultySelect.tsx` 中硬编码色
- [x] 5.4 替换 `MessagePanel.tsx` 中 `typeConfig` 硬编码色为 `game-*`
- [x] 5.5 替换 `MessagePanel.tsx` 中 `rarityColors` 为 `getRarityStyle()`
- [x] 5.6 替换 `ResultDisplay.tsx` 中成功/失败硬编码色
- [x] 5.7 替换 `ResultDisplay.tsx` 中奖励相关硬编码色
- [x] 5.8 替换 `CharacterInfo.tsx` 中飞升徽章硬编码色为 `game-economy`
- [x] 5.9 替换 `ExperiencePanel.tsx` 中 `text-game-combat`
- [x] 5.10 替换 `DeathDialog.tsx` 中硬编码红色为 `var(--destructive)`
- [x] 5.11 运行 `pnpm ts-check` 验证通过

## 6. 硬编码消除：内联空状态替换

- [x] 6.1 替换 `ProductCard.tsx` 中的 `ProductEmptyState` 为 `Empty` 组件族
- [x] 6.2 替换 `ProductCard.tsx` 中的 `ShopLockedState` 为 `Empty` 组件族
- [x] 6.3 替换 `DifficultySelect.tsx` 中的内联空状态为 `Empty` 组件
- [x] 6.4 替换 `MessagePanel.tsx` 中的内联空状态为 `Empty` 组件
- [x] 6.5 运行 `pnpm ts-check` 验证通过

## 7. 收尾验证

- [x] 7.1 全局搜索确认已修改文件中无硬编码 Tailwind 色盘残留
- [x] 7.2 全部组件按标准 UI 库分类（7 类）迁入子目录，根文件已删除
- [x] 7.3 运行全量验证：`pnpm ts-check` ✅ + `pnpm build` ✅
- [ ] 7.4 启动 `pnpm dev` 手动确认关键页面渲染正常（Home → WorldSelect → CharacterSelect → Game 主界面）
