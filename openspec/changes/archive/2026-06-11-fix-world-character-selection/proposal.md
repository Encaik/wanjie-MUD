## Why

世界选择和角色选择页面存在三个关键缺陷：(1) 无法刷新世界/角色列表，也无法按世界观类型筛选，玩家只能接受初始生成结果；(2) 不同世界观的属性体系（如体质、灵根等标签）显示完全相同的文案，丧失了世界差异化；(3) 选择世界后触发运行时错误 `姓名池未加载: "武侠世界"`，导致选角流程完全中断。这三个问题共同阻塞了玩家从世界选择到角色创建的核心流程。

## What Changes

- **修复 `World.type` 与 `WorldViewRegistry` 键名不匹配导致的崩溃**：`World.type` 存储中文显示名（如"武侠世界"），但注册中心使用英文 kebab-case 键（如"wuxia"），导致所有通过 `type` 查找注册中心的调用失败。修复方案：在所有注册中心查找路径上使用 `worldviewId`（英文 ID）替代 `type`（中文名）
- **修复属性体系文案全部相同的问题**：`getStatLabels` → `getWorldData` 链路上的类型查找失败导致始终回退到 `DEFAULT_STAT_DISPLAY`，消除回退行为后各世界观将显示正确的差异化属性标签
- **为世界选择页添加刷新和筛选功能**：新增"重新生成世界"按钮和世界观类型筛选下拉框
- **为角色选择页添加刷新功能**：确保"刷新角色"按钮在 UI 上可见且可用
- **统一 `generateCharacters`/`generateCharacter` 中的世界类型参数**：确保内部调用链使用英文标识符而非中文名

## Capabilities

### New Capabilities
- `world-character-filter-refresh`: 世界选择和角色选择页面的刷新与筛选交互功能

### Modified Capabilities
- `world-type-english-id`: 修复 `World.type`（中文名）与注册中心英文键名之间的查找不匹配问题，确保所有通过类型查找注册中心的代码路径使用 `worldviewId`（英文 kebab-case）而非 `type`
- `world-aware-names`: 修复 `getNamePoolFromRegistry` 中按中文名查找注册中心导致姓名池加载失败的 bug

## Impact

- **核心代码**：`src/modules/identity/data/namePools.ts`、`src/modules/identity/data/worldData.ts`、`src/modules/identity/data/statDisplayNames.ts` — 修复注册中心键名查找
- **生成逻辑**：`src/modules/identity/logic/generators.ts` — 确保 `generateCharacters`/`generateCharacter` 使用英文标识符
- **状态管理**：`src/views/game/useGameState.tsx` — `selectWorld` 和 `refreshCharacters` 正确传递 worldviewId
- **视图层**：`src/views/world-select/WorldSelect.tsx`、`src/views/character-select/CharacterSelect.tsx` — 添加刷新/筛选 UI 控件
- **相关页面**：`src/app/world-select/page.tsx`、`src/app/character-select/page.tsx` — 连接新交互逻辑
