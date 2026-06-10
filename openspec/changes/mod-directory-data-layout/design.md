## Context

当前 Mod 系统有两个设计问题需要一起解决：

**数据文件布局**：`dataFiles: Record<string, string>` 每个内容类型只能指向一个 JSON 文件，导致 `worlds.json` 包含全部 8 个世界、`dangers.json` 包含全部危险效果。Mod 作者希望用目录 + 独立文件的方式组织数据，一目了然。

**世界标识体系**：世界类型以中文做 ID（`"修仙"`、`"高武"`），代码中到处是中文键名。应改为数字 `id` + 英文 `type` + 中文 `name` 三字段体系，代码用英文索引，界面显示中文。

**运行环境**：Mod 文件位于 `public/mods/`，Next.js 静态导出后通过 `fetch()` 加载。`mod.json` 是 Mod 的自描述清单，目前已包含 `id`、`contentTypes`、`dataFiles` 等字段。

## Goals / Non-Goals

**Goals:**
- `dataFiles` 支持文件路径数组，Mod 作者可将一个内容类型的数据拆分为多个独立文件
- 引入世界三标识体系（数字 `id`、英文 `type`、中文 `name`），代码改用英文 `type` 索引
- 迁移 `wanjie-core` 数据到新布局：目录 + 独立文件 + 英文文件名
- 向后兼容：`dataFiles` 值为字符串时保持原有单文件加载行为

**Non-Goals:**
- 不改变 `WorldDataRegistry` 的注册方法签名（只在调用层适配）
- 不改变 Mod 依赖解析、校验流程、样式加载等其他子系统
- 不要求 Mod 作者必须使用数组格式——字符串路径依然有效

## Decisions

### 决策 1：`dataFiles` 值类型扩展为 `string | string[]`

**方案**：`dataFiles` 从 `Record<string, string>` 改为 `Record<string, string | string[]>`。值为字符串时行为不变（单文件加载）。值为数组时，遍历数组逐个 fetch 并注册。

```json
// 单文件模式（向后兼容）
"dataFiles": { "world": "data/worlds.json" }

// 数组模式（新布局）
"dataFiles": {
  "world": [
    "data/world/cultivation.json",
    "data/world/martial.json",
    "data/world/tech.json",
    "data/world/magic.json",
    "data/world/psi.json",
    "data/world/xianxia.json",
    "data/world/wuxia.json",
    "data/world/apocalypse.json"
  ]
}
```

**备选方案**：
- 目录路径 + trailing slash + `_index.json`：增加构建脚本复杂度，引入索引文件与目录内容不同步的风险。用户明确指出不需要。
- 新增 `dataDirs` 字段：增加 manifest 复杂度，语义与 `dataFiles` 重叠。

**选择理由**：数组方案实现最简单，mod.json 是唯一真相源，Mod 作者显式控制加载哪些文件和加载顺序。`fetch()` 直接请求数组中列出的 URL，零额外工具链。

### 决策 2：世界类型三标识体系

**方案**：`WorldTypeData` 新增三个字段：

| 字段 | 类型 | 用途 | 示例 |
|------|------|------|------|
| `id` | `number` | 唯一数字编号，数据库/序列化 | `1` |
| `type` | `string` | 英文标识，代码索引 | `"cultivation"` |
| `name` | `string` | 中文显示名，UI 展示 | `"修仙世界"` |

现有 `WorldTypeData.id`（中文）重命名为 `name`，新增 `id`（数字）和 `type`（英文）。

世界文件命名使用英文 `type`：`data/world/cultivation.json`。

```json
// data/world/cultivation.json
{
  "id": 1,
  "type": "cultivation",
  "name": "修仙世界",
  "description": "灵气充沛，仙门林立...",
  "baseCoefficient": 1.0,
  ...
}
```

**备选方案**：
- 保持中文 ID 同时新增英文 type：两套 ID 并存造成混乱，应一次性统一
- 用数字 ID 索引一切：数字不利于代码可读性，`switch (worldType)` 中用数字不如英文清晰

**选择理由**：三字段各司其职——数字 ID 用于存储和传输，英文 type 用于代码逻辑和文件命名，中文 name 用于 UI。这是游戏数据的标准做法。

### 决策 3：世界 type 枚举与现有映射

**方案**：8 个内置世界类型的英文 type 值：

| type | id | name |
|------|-----|------|
| `"cultivation"` | 1 | 修仙世界 |
| `"martial"` | 2 | 高武世界 |
| `"tech"` | 3 | 科技世界 |
| `"magic"` | 4 | 魔幻世界 |
| `"psi"` | 5 | 异能世界 |
| `"xianxia"` | 6 | 仙侠世界 |
| `"wuxia"` | 7 | 武侠世界 |
| `"apocalypse"` | 8 | 末世世界 |

`core/types/types.ts` 中 `WorldType` 过渡路径：
1. 第一阶段（本次变更）：新增 `WorldTypeEn = Cultivation | Martial | Tech | ...` 联合类型，旧的 `WorldType = string` 保持兼容，标记 `@deprecated`
2. 第二阶段（后续变更）：代码逐步迁移到英文 type，移除旧中文引用
3. 第三阶段（后续变更）：`WorldType` 改为英文联合类型

### 决策 4：注册中心适配数组加载

**方案**：`loadModDataAndRegister` 在遇到数组值 `dataFiles` 时：
1. 遍历数组中的每个文件路径
2. 逐个 `fetch(url)` → `response.json()`
3. 将每个 JSON 对象直接注册（单条目），不再期望容器包装

`registerData` 增加对单条目对象的分支处理：当传入数据不包含容器键（`worlds`、`dangers` 等）且自身就是目标类型时，直接注册。

**选择理由**：数组模式下每个文件只包含一个条目，文件路径中的英文名（如 `cultivation.json`）已标识其内容，无需额外嵌套。

## Risks / Trade-offs

- **[风险] `dataFiles` 数组可能很长**：world 类型有 8 个，fetch 请求从 1 次变为 8 次 → **缓解**：浏览器 HTTP/2 多路复用，8 个并行请求几乎无延迟差异；且 Mod 加载只在启动时执行一次
- **[风险] 中文 ID 到英文 type 的迁移范围大**：`src/` 中有约 13 处引用中文世界类型字符串 → **缓解**：分两阶段进行，第一阶段新增三字段 + 兼容旧中文 ID，第二阶段逐个模块迁移
- **[权衡] `WorldType` 过渡期存在两套标识**：旧代码仍用中文，新代码用英文 → 通过 `WorldDataRegistry` 提供双向查找（`getByType(type)` / `getByName(name)`）平滑过渡
- **[风险] 外部 Mod 兼容性**：外部 Mod 可能使用旧的中文 ID 格式 → **缓解**：`registerWorldType` 同时接受旧格式（中文 `id`）和新格式（三字段），自动检测并填充缺失字段

## Migration Plan

1. **Phase 1（本次变更）**：改 `dataFiles` 类型 + 改 `ModLoader` 支持数组 + 拆分 `wanjie-core` 数据文件 + 引入 `WorldTypeData` 三字段
2. **Phase 2（后续变更）**：`src/` 代码逐步从中文世界类型迁移到英文 `type`
3. **过渡期**：`WorldDataRegistry` 同时支持中文 ID 和英文 type 查找，旧中文 ID 作为 `type` 的别名
