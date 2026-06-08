# 万界修行录 — 技能发现报告

> 生成时间：2026-06-08 | 搜索工具：`npx skills find` | 来源：skills.sh 生态系统

---

## 一、搜索执行记录

| 序号 | 搜索命令 | 领域 | 返回技能数 |
|------|----------|------|------------|
| 1 | `npx skills find "nextjs react code quality"` | 代码层面 | 4 |
| 2 | `npx skills find "typescript best practices"` | 代码层面 | 6 |
| 3 | `npx skills find "ui design frontend tailwind"` | 页面设计 | 5 |
| 4 | `npx skills find "game design MUD text-based"` | 游戏设计 | 4 |
| 5 | `npx skills find "level design crafting puzzle"` | 游戏设计 | 5 |
| 6 | `npx skills find "game development rpg"` | 游戏开发 | 6 |
| 7 | `npx skills find "data management supabase database"` | 数据存储 | 6 |
| 8 | `npx skills find "testing quality assurance game"` | 质量保障 | 6 |
| 9 | `npx skills find "code review refactor simplify"` | 质量保障 | 4 |

**合计**：9 次搜索，覆盖 6 大领域，收集 46 条原始结果。

---

## 二、评估标准

| 维度 | 高 | 中 | 低 |
|------|-----|------|-----|
| 安装量 | > 500 | 100-500 | < 100 |
| 来源可信度 | 知名作者/组织 | 一般作者 | 未知/低星仓库 |
| 技术栈契合 | 直接匹配（Next.js+TS+React） | 部分匹配（通用 Web/JS） | 不匹配（Vue/Unity/Godot） |
| 规范兼容性 | 无冲突 | 轻微冲突 | 明显冲突 |

---

## 三、P0 必装技能（5 个）

### 🎮 游戏开发

#### 3.1 `jeffallan/claude-skills@game-developer`
- **安装命令**：`npx skills add jeffallan/claude-skills@game-developer -y`
- **安装量**：3,000+
- **信任度**：⭐⭐⭐⭐⭐ 高（高安装量，已验证来源）
- **技术栈**：⭐ 通用游戏开发（非特定引擎）
- **规范兼容**：✅ 通用游戏设计建议，不涉及目录结构冲突
- **适用领域**：游戏机制设计、玩法系统、游戏架构
- **推荐理由**：生态中安装量最高的游戏开发技能，适用于文字 MUD 的游戏循环设计、数值系统策划、多世界观管理
- **建议位置**：项目级（`.claude/skills/`）

---

#### 3.2 `pluginagentmarketplace/custom-plugin-game-developer@level-design`
- **安装命令**：`npx skills add pluginagentmarketplace/custom-plugin-game-developer@level-design -y`
- **安装量**：405
- **信任度**：⭐⭐⭐⭐ 中高
- **技术栈**：⭐ 通用关卡设计方法论
- **规范兼容**：✅ 设计方法论不涉及代码规范
- **适用领域**：秘境设计、地图探索、难度曲线、Boss 战设计
- **推荐理由**：为项目的"机缘/秘境探索"系统提供专业的关卡设计指导，包括难度递进、奖励分布、环境叙事
- **建议位置**：项目级（`.claude/skills/`）

---

### 🎨 前端设计

#### 3.3 `sickn33/antigravity-awesome-skills@react-nextjs-development`
- **安装命令**：`npx skills add sickn33/antigravity-awesome-skills@react-nextjs-development -y`
- **安装量**：636
- **信任度**：⭐⭐⭐⭐ 中高
- **技术栈**：⭐⭐⭐⭐⭐ 直接匹配（React + Next.js）
- **规范兼容**：⚠️ 需检查是否与项目 React 规范一致（如组件结构、状态管理模式）
- **适用领域**：Next.js App Router、React 组件模式、SSR/SSG 策略
- **推荐理由**：直接补充项目 Next.js 16 开发模式，覆盖 Server Components、Route Handlers、Streaming 等现代模式
- **建议位置**：项目级（`.claude/skills/`），因为包含项目特定的 Next.js 配置建议

---

#### 3.4 `dauquangthanh/hanoi-rainbow@frontend-ui-ux-design`
- **安装命令**：`npx skills add dauquangthanh/hanoi-rainbow@frontend-ui-ux-design -g -y`
- **安装量**：369
- **信任度**：⭐⭐⭐ 中
- **技术栈**：⭐⭐⭐⭐ 通用前端 UI/UX
- **规范兼容**：✅ UI 设计建议不直接涉及 lib/ 游戏逻辑
- **适用领域**：游戏面板 UI、交互设计、信息架构、视觉层次
- **推荐理由**：文字 MUD 游戏的 UI 是核心体验载体，专业的 UI/UX 设计指导可提升游戏面板的可用性和美观度
- **建议位置**：用户全局（`~/.claude/skills/`），通用前端设计技能可跨项目复用

---

### 🗄️ 数据存储

#### 3.5 `nice-wolf-studio/claude-code-supabase-skills@supabase-database`
- **安装命令**：`npx skills add nice-wolf-studio/claude-code-supabase-skills@supabase-database -g -y`
- **安装量**：222
- **信任度**：⭐⭐⭐⭐ 中高（专注 Supabase 的工作室）
- **技术栈**：⭐⭐⭐⭐⭐ 直接匹配（Supabase + PostgreSQL）
- **规范兼容**：✅ 数据库操作位于 `src/storage/`，不涉及游戏逻辑规则冲突
- **适用领域**：Supabase 查询优化、RLS 策略、数据建模、实时订阅
- **推荐理由**：项目使用 Supabase 作为唯一数据库，该技能可指导存档查询优化、RLS 安全策略、数据库迁移等关键操作
- **建议位置**：用户全局（`~/.claude/skills/`），Supabase 技能可跨项目复用

---

## 四、P1 推荐技能（8 个）

| # | 技能 | 安装量 | 领域 | 推荐理由 |
|---|------|--------|------|----------|
| 1 | `addyosmani/agent-skills@code-simplification` | 4,713 | 代码质量 | 最强代码简化技能，但项目已有 `/simplify`，可作补充 |
| 2 | `alirezarezvani/claude-skills@senior-fullstack` | 868 | 代码层面 | 全栈最佳实践，补充 Next.js + TypeScript 技能空缺 |
| 3 | `duyet/claude-plugins@react-nextjs-patterns` | 264 | 代码层面 | React/Next.js 专用模式，比通用全栈技能更聚焦 |
| 4 | `ulpi-io/skills@frontend-design-ui-ux` | 303 | 页面设计 | 前端设计 UI/UX，与 P0 的 hanoi-rainbow 互补 |
| 5 | `omer-metin/skills-for-antigravity@game-design` | 96 | 游戏设计 | 通用游戏设计方法论，安装量偏低但功能独特 |
| 6 | `omer-metin/skills-for-antigravity@tabletop-rpg-design` | 127 | 游戏开发 | 桌游 RPG 设计，对属性系统、角色扮演、数值策划有参考价值 |
| 7 | `jwynia/agent-skills@game-facilitator` | 354 | 游戏开发 | 游戏引导/教程设计，适合新手引导和成就系统 |
| 8 | `404kidwiz/claude-supercode-skills@qa-expert` | 153 | 质量保障 | QA 测试专家，补充项目测试策略 |

### P1 一键安装

```bash
# 代码质量
npx skills add addyosmani/agent-skills@code-simplification -g -y
npx skills add alirezarezvani/claude-skills@senior-fullstack -g -y
npx skills add duyet/claude-plugins@react-nextjs-patterns -g -y

# 前端设计（补充）
npx skills add ulpi-io/skills@frontend-design-ui-ux -g -y

# 游戏设计
npx skills add omer-metin/skills-for-antigravity@game-design -y
npx skills add omer-metin/skills-for-antigravity@tabletop-rpg-design -y
npx skills add jwynia/agent-skills@game-facilitator -y

# 质量保障
npx skills add 404kidwiz/claude-supercode-skills@qa-expert -g -y
```

---

## 五、P2 可选技能（7 个）

| # | 技能 | 安装量 | 领域 | 选择理由 |
|---|------|--------|------|----------|
| 1 | `pskoett/pskoett-ai-skills@simplify-and-harden` | 446 | 代码质量 | 代码简化与加固，P1 代码简化技能的替代方案 |
| 2 | `eachlabs/skills@game-asset-generation` | 265 | 游戏开发 | 游戏资源生成，对于纯文字游戏价值有限 |
| 3 | `omer-metin/skills-for-antigravity@level-design` | 47 | 游戏设计 | 关卡设计的替代选择，安装量低于 P0 同名技能 |
| 4 | `omer-metin/skills-for-antigravity@puzzle-design` | 73 | 游戏设计 | 谜题设计，适合秘境中的解谜元素 |
| 5 | `omer-metin/skills-for-antigravity@tailwind-ui` | 54 | 页面设计 | Tailwind UI 组件设计，安装量偏低 |
| 6 | `daffy0208/ai-dev-standards@supabase-developer` | 150 | 数据存储 | Supabase 开发的替代选择 |
| 7 | `daffy0208/ai-dev-standards@quality-assurance` | 145 | 质量保障 | QA 的替代选择 |

---

## 六、不适用技能（排除清单）

| 技能 | 安装量 | 排除理由 |
|------|--------|----------|
| `rmyndharis/antigravity-skills@unity-developer` | 1,835 | Unity 引擎专用，项目不适用 |
| `sickn33/antigravity-awesome-skills@unity-developer` | 416 | Unity 引擎专用，项目不适用 |
| `mindrally/skills@vuejs-typescript-best-practices` | 693 | Vue.js 框架，与项目 React 技术栈不兼容 |
| `thedivergentai/gd-agentic-skills@godot-genre-puzzle` | 111 | Godot 引擎谜题类型，不适用 |
| `harlan-zw/vue-ecosystem-skills@vue-i18n-skilld` | 179 | Vue 生态 + i18n，框架不匹配 |
| `dirien/claude-skills@pulumi-typescript` | 205 | Pulumi 基础设施，非游戏开发 |
| `kishorkukreja/awesome-supply-chain@drilling-logistics` | 28 | 供应链物流，完全不相关 |
| `miles990/claude-software-skills@flame-templates` | 42 | Flutter/Flame 游戏引擎，不适用 |
| `manutej/crush-mcp-server@supabase-mcp-integration` | 38 | MCP 服务器集成，非技能本身 |
| `jmsktm/claude-settings@data-storyteller` | 155 | 数据故事讲述，偏向数据分析而非游戏叙事 |
| `htlin222/dotfiles@sc-test` | 28 | dotfiles 测试，与项目无关 |
| `oldwinter/skills@brand-storytelling` | 31 | 品牌故事讲述，非游戏叙事 |

---

## 七、安装计划总览

| 优先级 | 数量 | 安装位置 | 说明 |
|--------|------|----------|------|
| P0 必装 | 5 | 3 个项目级 + 2 个全局 | 游戏开发(2) + 前端设计(2) + Supabase(1) |
| P1 推荐 | 8 | 按需 | 用户选择安装 |
| P2 可选 | 7 | 按需 | 供参考 |
| 排除 | 12 | — | 框架/领域不匹配 |

### P0 安装顺序

1. **项目级先装**：`jeffallan/claude-skills@game-developer` + `pluginagentmarketplace/custom-plugin-game-developer@level-design` + `sickn33/antigravity-awesome-skills@react-nextjs-development`
2. **全局后装**：`dauquangthanh/hanoi-rainbow@frontend-ui-ux-design` + `nice-wolf-studio/claude-code-supabase-skills@supabase-database`
3. **验证**：`npx skills check`
4. **兼容性检查**：对比 CLAUDE.md 规则

---

## 八、安装执行记录

> 安装时间：2026-06-08

| # | 技能 | 状态 | 位置 | 安全评分 |
|---|------|------|------|----------|
| 1 | `jeffallan/claude-skills@game-developer` | ✅ 已安装 | `.agents/skills/game-developer/` | Safe / Low Risk |
| 2 | `pluginagentmarketplace/custom-plugin-game-developer@level-design` | ✅ 已安装 | `.agents/skills/level-design/` | Safe / Low Risk |
| 3 | `sickn33/antigravity-awesome-skills@react-nextjs-development` | ❌ 网络限制 | — | 代理连接被拒 (127.0.0.1:7890) |
| 4 | `dauquangthanh/hanoi-rainbow@frontend-ui-ux-design` | ❌ 网络限制 | — | 代理连接被拒 (127.0.0.1:7890) |
| 5 | `nice-wolf-studio/claude-code-supabase-skills@supabase-database` | ❌ 网络限制 | — | 代理连接被拒 (127.0.0.1:7890) |

### 待手动安装（网络恢复后）

```bash
npx skills add sickn33/antigravity-awesome-skills@react-nextjs-development -y
npx skills add dauquangthanh/hanoi-rainbow@frontend-ui-ux-design -g -y
npx skills add nice-wolf-studio/claude-code-supabase-skills@supabase-database -g -y
```

## 九、兼容性验证报告

### game-developer 兼容性

| 维度 | 评估 | 说明 |
|------|------|------|
| 目录职责 | ✅ 无冲突 | 不涉及 `lib/` 或 `components/` 放置规则 |
| 类型安全 | ✅ 无冲突 | 使用 C# 示例，不涉及 TypeScript 建议 |
| 开发规范 | ⚠️ 部分兼容 | 侧重 Unity/Unreal，会推荐 Unity 特定模式（MonoBehaviour、ECS 等），但这些不适用于 Web 项目 |
| 实用性 | ⭐⭐⭐ | 状态机模式、性能优化思维、"禁止硬编码数值" 规则与项目一致 |

**结论**：部分兼容。游戏设计模式可借鉴（状态机、对象池思维），但 Unity/Unreal 具体实现不可直接套用。建议在触发时附带上下文提示，限定在文字 MUD/Web 游戏范围内使用。

### level-design 兼容性

| 维度 | 评估 | 说明 |
|------|------|------|
| 目录职责 | ✅ 无冲突 | 纯设计方法论，不涉及代码结构 |
| 类型安全 | ✅ 无冲突 | 无代码生成模式 |
| 开发规范 | ✅ 完全兼容 | 框架无关的设计指导 |
| 实用性 | ⭐⭐⭐⭐⭐ | 关卡结构（Hub & Spoke → 8 世界）、难度曲线（强度峰谷图）、环境叙事、玩家引导均直接适用 |

**结论**：完全兼容。对秘境探索系统、Boss 战设计、难度递进有直接指导价值。

## 八、风险与注意事项

- **`jeffallan/claude-skills@game-developer`**：描述较泛（"Game Developer"），实际行为需安装后验证
- **`sickn33/antigravity-awesome-skills@react-nextjs-development`**：636 安装量但 GitHub 仓库状态未详查，安装前应检查其 README/source
- **`dauquangthanh/hanoi-rainbow@frontend-ui-ux-design`**：安装量 369，来源为个人开发者，质量为中
- **项目已有 `/simplify`**，不建议再安装 `code-simplification`，避免技能冲突
- **技能更新**：定期运行 `npx skills check` 检查上游更新，更新前在 git 中保存当前版本快照
