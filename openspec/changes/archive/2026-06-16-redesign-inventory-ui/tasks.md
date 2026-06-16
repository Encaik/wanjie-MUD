# 实施任务

## 1. ItemCard — 物品卡片组件

- [x] 1.1 创建 `src/modules/item/components/ItemCard.tsx`（300 行，正好卡在组件上限）
  - 定义 `ItemCardProps` 接口：`item: ResolvedItem`、`onUse?`、`onEquip?`、`className?`
  - 实现公共卡片框架：稀有度边框 + 渐变顶边 + hover 动效
  - 实现 `renderEquippableCard` 共享模板（装备/功法共用）
  - 7 品类差异化卡片：装备槽位图标+等级、功法攻防+等级、丹药数量+效果图标、材料子类+数量、货币大号数量(跨2列)、碎片源物品名+半透明
  - 稀有度驱动：`border-quality-{rarity}`、`bg-quality-{rarity}/5`、epic+ 呼吸动画
  - 已装备角标、hover 缩放动效
- [x] 1.2 稀有度配置引用：统一从 `modules/item/data/rarity.ts` 导入 `RARITY_CONFIG` 和 `RarityConfig`
- [x] 1.3 品类图标映射：lucide-react 主图标（`Sword`/`Crown`/`Shield`/`Footprints`）+ emoji 子类微标

## 2. ItemGrid — 响应式网格容器

- [x] 2.1 创建 `src/modules/item/components/ItemGrid.tsx`（44 行）
  - Props：`children: ReactNode`、`emptyMessage?`、`className?`
  - 响应式列数：`grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5`
  - 空状态：居中 `Package` 图标 + 提示文字

## 3. ItemTooltip — 品类感知详情浮层

- [x] 3.1 重写 `src/modules/item/components/ItemTooltip.tsx`（105 行）
  - Props：`children: ReactNode`、`item: ResolvedItem`、`side?`
  - 浮层宽度 280px + 稀有度顶部色条
  - 公共 Header：稀有度色名称 + 品质中文徽章 + 类别·子类别
  - 公共 Description + Footer（装备状态+来源+日期）
- [x] 3.2 提取品类专属 Section 到 `ItemTooltipSections.tsx`（271 行）
  - 装备 Section：属性表 + 词缀列表 + 技能槽 + 元素/武器 + 等级进度
  - 功法 Section：属性表 + 技能槽 + 兼容武器/加成/消耗 + 等级进度
  - 技能 Section：效果列表 + 标签芯片组 + CD/元素/武器限制
  - 丹药 Section：效果列表 + CD/等级/境界要求
  - 材料 Section：经验值 + 适用品类
  - 碎片 Section：源物品预览 + 合成提示
  - 共享组件：`LevelProgress`、`AffixRow`、常量映射（`STAT_LABEL`、`SKILL_TAG_LABEL`、`CATEGORY_LABEL`、`SOURCE_LABEL`）

## 4. InventoryPanel — 主面板重写

- [x] 4.1 重写 `src/modules/item/components/InventoryPanel.tsx`（143 行）
  - 使用 `useInventory`/`useEquipment`/`useSkills` Hook
  - Card 容器包裹 + Package 图标标题 + 物品总类数
  - 品类 Tab + 计数 Badge（8 个 tab：全部/装备/功法/技能/丹药/材料/货币/碎片）
  - ItemGrid + ItemCard + ItemTooltip 组合渲染
  - 货币卡片 `col-span-2` 跨列
  - `consumeItem` 重命名避开 Rules of Hooks（`useItem` → `consumeItem`）
- [x] 4.2 品类计数 Badge 已保留

## 5. BackpackPage — 切换到新系统

- [x] 5.1 修改 `src/views/game/pages/BackpackPage.tsx`
  - 导入从 `@/modules/equipment/components/InventoryPanel` → `@/modules/item/components/InventoryPanel`
  - 移除 `useGlobalState` prop（新面板通过 Hook 自行获取全局状态）

## 6. 稀有度动画 CSS

- [x] 6.1 在 `src/app/styles/animations.css` 添加 `@keyframes glow-pulse` 和 `glow-pulse-strong`
- [x] 6.2 在 `src/app/styles/base.css` 添加 `animate-glow-pulse` 和 `animate-glow-pulse-strong` 工具类 + `prefers-reduced-motion` 降级
- [x] 确认 `text-quality-*`、`border-quality-*`、`bg-quality-*` 类可用（无需额外配置）

## 7. 旧 Tooltip 清理与引用更新

- [x] 7.1 全局搜索所有引用：overlay 版本 0 引用，data-display 版本分别被 FragmentPanel（item-tooltip）和 EquipmentPanel/TechniquePanel（upgradeable-item-tooltip）使用
- [x] 7.2 data-display 版本保留（依赖旧类型系统，完整迁移需伴随 equipment/technique/fragment 模块迁移）
- [x] 7.3 删除 overlay 版本：
  - ✅ `src/shared/ui/overlay/item-tooltip.tsx` 已删除
  - ✅ `src/shared/ui/overlay/upgradeable-item-tooltip.tsx` 已删除
  - ⚠️ `src/shared/ui/data-display/item-tooltip.tsx` 保留（FragmentPanel 使用）
  - ⚠️ `src/shared/ui/data-display/upgradeable-item-tooltip.tsx` 保留（TechniquePanel、EquipmentPanel 使用）
- [x] 7.4 检查 index.ts 导出：overlay/ 无 index 导出；data-display/index.ts 仍导出旧 tooltip（保留，供旧面板使用）

## 8. 桶文件与导出更新

- [x] 8.1 更新 `src/modules/item/components/index.ts`：已导出 `ItemCard`、`ItemGrid`、`ItemTooltip`、`InventoryPanel`、`ItemTooltipSections` 相关符号
- [x] 8.2 更新 `src/modules/item/index.ts`：已导出 `ItemCard`、`ItemGrid`

## 9. README 同步

- [x] 9.1 更新 `src/modules/README.md`：新增 `item/` 模块条目，标注为统一物品系统（替代旧 economy/equipment/techniques/crafting）
- [x] 9.2 `src/core/README.md` 不涉及（本次无关 core）
- [x] 9.3 `game-design/` 不涉及（背包 UI 属交互层）

## 10. 质量验证

- [x] 10.1 `pnpm ts-check` — 零类型错误 ✅
- [x] 10.2 `pnpm build` — 构建成功 ✅
- [x] 10.3 文件大小检查：
  - `ItemCard.tsx` = 300 行（≤300 ✅）
  - `ItemGrid.tsx` = 44 行（≤60 ✅）
  - `ItemTooltip.tsx` = 105 行（≤300 ✅）
  - `ItemTooltipSections.tsx` = 271 行（≤300 ✅）
  - `InventoryPanel.tsx` = 143 行（≤300 ✅）
- [x] 10.4 `pnpm lint`（变更文件）— 零错误 ✅（lint:strict 有预存错误，不在本次范围）
- [ ] 10.5 `pnpm test` — 跳过（未修改 logic/ 层）
- [ ] 10.6 手动验证 — 待 dev 模式下目视确认
