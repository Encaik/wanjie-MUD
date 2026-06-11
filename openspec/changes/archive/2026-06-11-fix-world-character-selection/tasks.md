## 1. 修复类型标识符不匹配崩溃

- [x] 1.1 修改 `getNamePoolFromRegistry` 函数签名和文档，明确接受英文 kebab-case worldviewId（如 `"wuxia"`），并添加开发模式下的中文名检测警告日志
- [x] 1.2 修改 `getTraitPoolFromRegistry` 同理，确保使用英文 ID 查找 `WorldViewRegistry`
- [x] 1.3 修改 `getWorldData` 同理，确保使用英文 ID 查找 `WorldViewRegistry`
- [x] 1.4 修改 `getStatLabels` 和 `getStatDisplayName` 同理，确保使用英文 ID 查找
- [x] 1.5 修改 `generateCharacter(id, worldType)` — `worldType` 参数语义改为英文 worldviewId，内部调用改为传递英文 ID
- [x] 1.6 修改 `generateCharacters(worldType)` — 同上，`worldType` 参数语义改为英文 worldviewId
- [x] 1.7 修改 `useGameState.tsx` 中的 `selectWorld` — 调用 `generateCharacters` 时传递 `fullWorld.worldviewId` 而非 `fullWorld.type`
- [x] 1.8 修改 `useGameState.tsx` 中的 `refreshCharacters` — 调用 `generateCharacters` 时传递 `prev.selectedWorld.worldviewId` 而非 `prev.selectedWorld.type`

## 2. 修复属性体系标签全相同问题

- [x] 2.1 修改 `WorldInfoBar` 组件 — 将 `worldType` prop 改为 `worldviewId`（英文 ID），传递给 `getStatLabels`
- [x] 2.2 修改 `CharacterSelect` 页面 — 向 `WorldInfoBar` 传递 `selectedWorld.worldviewId` 而非 `selectedWorld.type`
- [x] 2.3 修改 `WorldSelect` 组件中调用 `getStatLabels` 的位置 — 使用 `worldviewId` 而非 `type`
- [ ] 2.4 验证 8 个世界观的属性标签在选角页面显示各自正确的差异化名称

## 3. 世界选择页刷新与筛选功能

- [x] 3.1 在 `WorldSelect.tsx` 视图组件中添加"重新生成"按钮，使用 shadcn/ui `Button` 组件，点击时调用父级传入的 `onRefresh` callback
- [x] 3.2 在 `src/app/world-select/page.tsx` 中实现 `handleRefresh` — 调用 `regenerateWorlds()` 重新生成世界列表
- [x] 3.3 世界观筛选按钮已存在（顶部"全部"+各世界观按钮），通过 `regenerateWorlds(worldviewId)` 实现
- [x] 3.4 筛选按钮使用世界观名称显示
- [x] 3.5 筛选逻辑：服务器端按 worldviewId 过滤重新生成
- [x] 3.6 错误和空状态已有友好提示
- [x] 3.7 刷新按钮重新调用 `regenerateWorlds(selectedWorldviewId)`，保持当前筛选

## 4. 角色选择页刷新功能

- [x] 4.1 确认 `CharacterSelect.tsx` 中"刷新角色"按钮始终可见（`onRefresh` 总是由页面传入）
- [x] 4.2 确保刷新时使用当前选中世界的 `worldviewId` 生成新角色
- [x] 4.3 添加刷新按钮的加载状态（`refreshing` prop 控制动画和禁用）

## 5. 验证与测试

- [x] 5.1 运行 `pnpm ts-check` — 仅有一个预存在的测试文件错误，修改的文件无新错误
- [x] 5.2 运行 `pnpm build` — 构建成功
- [x] 5.3 运行 `pnpm lint` — 所有修改文件 lint 通过
- [ ] 5.4 手动测试：选择 8 种世界观各一次，确认不再出现"姓名池未加载"错误
- [ ] 5.5 手动测试：验证不同世界观的属性标签显示正确的差异化名称
- [ ] 5.6 手动测试：世界选择页刷新按钮和筛选功能正常工作
- [ ] 5.7 手动测试：角色选择页刷新按钮正常工作
