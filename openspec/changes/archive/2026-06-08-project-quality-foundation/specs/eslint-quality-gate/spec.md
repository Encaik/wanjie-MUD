## ADDED Requirements

### Requirement: 文件行数限制规则
ESLint 配置 SHALL 包含文件最大行数限制，编译时报错阻止超大文件的增涨。

#### Scenario: 组件文件限制
- **WHEN** 组件文件（`*.tsx`）超过 300 行
- **THEN** ESLint 输出 error，阻止提交

#### Scenario: Hook 文件限制
- **WHEN** Hook 文件（`*.ts` 或 `*.tsx`，use 前缀）超过 200 行
- **THEN** ESLint 输出 error，阻止提交

#### Scenario: 工具/逻辑模块限制
- **WHEN** 工具或逻辑模块文件超过 500 行
- **THEN** ESLint 输出 warning，提示拆分

#### Scenario: 测试文件限制
- **WHEN** 测试文件（`*.test.*` 或 `*.spec.*`）超过 500 行
- **THEN** ESLint 输出 warning，提示模块化拆分

### Requirement: 禁止 any 类型规则
ESLint 配置 SHALL 启用 `@typescript-eslint/no-explicit-any` 规则，禁止使用 `any` 类型。

#### Scenario: any 类型检测
- **WHEN** 代码中使用 `any` 类型标注
- **THEN** ESLint 输出 error

#### Scenario: 允许显式豁免
- **WHEN** 确需使用 `any` 且已添加 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 注释及 JSDoc 说明
- **THEN** ESLint 不报错

### Requirement: 导入顺序规则
ESLint 配置 SHALL 启用 `import/order` 规则，强制按 React → 第三方 → @/ 别名 → 相对路径 排序。

#### Scenario: 导入顺序自动修复
- **WHEN** 运行 `eslint --fix`
- **THEN** 导入语句自动按规范重排

#### Scenario: 导入顺序违规
- **WHEN** 导入顺序不符合规范
- **THEN** ESLint 输出 error

### Requirement: 复杂度限制规则
ESLint 配置 SHALL 启用 `complexity` 规则，限制函数圈复杂度。

#### Scenario: 函数复杂度限制
- **WHEN** 函数圈复杂度超过 15
- **THEN** ESLint 输出 warning

#### Scenario: JSX 嵌套限制
- **WHEN** JSX 元素嵌套深度超过 4 层
- **THEN** ESLint 输出 warning，建议提取子组件

### Requirement: 废弃代码检测
ESLint 配置 SHALL 启用 `no-unused-vars` 和 `no-unused-exports` 规则，禁止未使用的变量和导出。

#### Scenario: 未使用变量
- **WHEN** 存在声明但未使用的变量
- **THEN** ESLint 输出 error

#### Scenario: 未使用导出
- **WHEN** 存在导出但未被任何文件导入的符号
- **THEN** ESLint 输出 warning（排除 `index.ts` 桶文件中的再导出）

### Requirement: ESLint 配置脚本
项目 SHALL 在 `package.json` 中提供 `lint:strict` 命令，运行完整的质量门禁检查。

#### Scenario: 严格检查执行
- **WHEN** 运行 `pnpm lint:strict`
- **THEN** 执行所有 ESLint 规则（包括 warning 级别），在 CI 中 warning 视为 error

#### Scenario: 预提交检查集成
- **WHEN** 配置 git pre-commit hook
- **THEN** 自动运行 `pnpm lint` 阻止不合规代码提交
