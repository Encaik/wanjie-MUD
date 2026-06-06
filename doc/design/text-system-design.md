# 文案统一管理系统设计文档

## 快速开始（给 Agent 的简明指南）

### 问题诊断

如果遇到以下问题，说明需要使用文案统一系统：

1. **术语不统一**：同一概念在不同地方显示不同名称（如"灵石"和"能量块"混用）
2. **数值不同步**：战力、等级等数值在不同组件中显示不一致
3. **硬编码文案**：代码中直接写死 `"击败了妖兽！获得100经验"`

### 解决方案

```tsx
// ❌ 错误做法
<span>击败了{enemyName}！获得{exp}经验</span>
const term = getTerminology(worldType);
<span>消耗{term.resource}</span>

// ✅ 正确做法
import { useGameText } from '@/lib/text';

function MyComponent() {
  const { t } = useGameText();
  
  return (
    <>
      <span>{t('combat.victory', { enemyName, exp })}</span>
      <span>{t('resource.spend', { resource: t('term.resource'), amount: 10 })}</span>
    </>
  );
}
```

### 核心文件

| 文件 | 用途 |
|-----|-----|
| `src/lib/text/types.ts` | 类型定义（TextKey 等） |
| `src/lib/text/textDefinitions.ts` | 所有文案定义 |
| `src/lib/text/valueProviders.ts` | 动态值提供者 |
| `src/lib/text/textResolver.ts` | 文案解析器 |
| `src/lib/text/hooks/useText.ts` | 轻量级 Hook |
| `src/lib/text/hooks/useGameText.tsx` | 游戏状态集成 Hook |

### 添加新文案

1. 在 `types.ts` 的 `TextKey` 中添加键名
2. 在 `textDefinitions.ts` 中添加定义
3. 使用 `t('new.key', params)` 调用

### 添加新动态值

1. 在 `valueProviders.ts` 中注册提供者
2. 文案中使用 `{providerName}` 自动注入

---

## 一、问题背景

### 1.1 当前问题

在多世界修仙游戏中，同一概念在不同世界有不同的名称（如"灵石"/"武晶"/"能量块"），导致以下问题：

1. **硬编码文案散落各处**：直接使用 `"灵石"` 等字符串，修改困难
2. **动态值不统一**：战力、等级等数值在不同组件中计算方式可能不同
3. **文案与逻辑耦合**：组件中混杂文案拼接逻辑，难以维护
4. **无法追踪文案来源**：出现问题时难以定位哪个组件使用了错误文案

### 1.2 设计目标

参考 i18n 国际化方案，建立统一的文案管理系统：

1. **单一数据源**：所有文案从统一的地方获取
2. **占位符机制**：文案中支持 `{playerLevel}` 等占位符
3. **动态值注入**：从状态管理中获取实时数值
4. **类型安全**：TypeScript 保证键名和值的正确性
5. **易于追踪**：出现问题时能快速定位

---

## 二、核心架构

### 2.1 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    表示层 (Components)                        │
│  使用 useText('key', { param1: value1 }) 获取文案            │
├─────────────────────────────────────────────────────────────┤
│                    解析层 (TextResolver)                      │
│  1. 根据 worldType 获取基础文案                              │
│  2. 解析占位符 {xxx}                                         │
│  3. 注入动态值                                               │
├─────────────────────────────────────────────────────────────┤
│                    数据层 (TextSource)                        │
│  1. 文案定义文件 (textDefinitions.ts)                        │
│  2. 世界术语映射 (terminology.ts)                            │
│  3. 动态值提供者 (valueProviders.ts)                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
组件调用 useText('combat.victory', { enemyName: '妖兽' })
    ↓
TextResolver 解析键名
    ↓
根据 worldType 获取基础文案: "击败了{enemyName}！获得{exp}经验"
    ↓
注入动态值: enemyName='妖兽', exp=计算结果
    ↓
返回最终文案: "击败了妖兽！获得100经验"
```

---

## 三、核心概念定义

### 3.1 文案键 (TextKey)

使用点分隔的命名空间结构，便于分类和查找：

```typescript
// 格式: category.subcategory.action
type TextKey = 
  | 'combat.victory'        // 战斗胜利
  | 'combat.defeat'         // 战斗失败
  | 'combat.damage.deal'    // 造成伤害
  | 'cultivation.success'   // 修炼成功
  | 'cultivation.breakthrough' // 突破成功
  | 'resource.gain'         // 获得资源
  | 'item.use'              // 使用物品
  | 'ui.button.confirm'     // 确认按钮
  // ... 更多
```

### 3.2 文案定义 (TextDefinition)

```typescript
interface TextDefinition {
  key: TextKey;
  // 基础文案（默认）
  default: string;
  // 按世界类型覆盖
  byWorld?: Partial<Record<WorldType, string>>;
  // 描述（用于文档）
  description?: string;
  // 参数定义
  params?: TextParam[];
}

interface TextParam {
  name: string;           // 参数名
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description?: string;
}
```

### 3.3 动态值提供者 (ValueProvider)

从状态管理中获取实时数值：

```typescript
interface ValueProvider {
  // 提供者名称
  name: string;
  // 获取值的方法
  getValue: (context: ValueContext) => string | number;
}

interface ValueContext {
  gameState: GameState;
  protagonist: Protagonist;
  worldType: WorldType;
  // 当前场景的额外上下文
  extras?: Record<string, any>;
}
```

---

## 四、文件结构

```
src/lib/text/
├── index.ts                    # 统一导出
├── types.ts                    # 类型定义
├── textDefinitions.ts          # 文案定义文件
├── valueProviders.ts           # 动态值提供者
├── textResolver.ts             # 文案解析器
└── hooks/
    └── useText.ts              # React Hook

src/contexts/
└── TextContext.tsx             # 文案上下文 Provider
```

---

## 五、使用规范

### 5.1 基本使用

```tsx
// ❌ 错误：直接硬编码字符串
<span>击败了{enemyName}！获得{exp}经验</span>

// ✅ 正确：使用统一文案系统
const { t } = useText();
<span>{t('combat.victory', { enemyName, exp })}</span>
```

### 5.2 获取世界相关术语

```tsx
// ❌ 错误：直接调用 getTerminology
const term = getTerminology(worldType);
<span>消耗{term.resource}</span>

// ✅ 正确：使用统一系统
const { t } = useText();
<span>消耗{t('term.resource')}</span>
```

### 5.3 动态值自动注入

```tsx
// 系统自动从状态管理获取玩家等级
const { t } = useText();
<span>{t('ui.player.info')}</span>  
// 文案: "等级 {playerLevel} | 战力 {combatPower}"
// 输出: "等级 25 | 战力 12500"
```

---

## 六、实现细节

### 6.1 文案解析器 (TextResolver)

```typescript
class TextResolver {
  private definitions: Map<TextKey, TextDefinition>;
  private valueProviders: Map<string, ValueProvider>;
  
  resolve(
    key: TextKey, 
    params: Record<string, any>,
    context: ValueContext
  ): string {
    // 1. 获取基础文案
    const definition = this.definitions.get(key);
    let text = definition.byWorld?.[context.worldType] 
               || definition.default;
    
    // 2. 解析占位符
    const placeholders = this.extractPlaceholders(text);
    
    // 3. 注入值
    for (const placeholder of placeholders) {
      const value = params[placeholder] 
                    || this.getProviderValue(placeholder, context);
      text = text.replace(`{${placeholder}}`, String(value));
    }
    
    return text;
  }
  
  private extractPlaceholders(text: string): string[] {
    const regex = /\{(\w+)\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return [...new Set(matches)];
  }
}
```

### 6.2 React Hook

```typescript
function useText() {
  const gameState = useGameState();
  const worldType = gameState.protagonist?.world.type || '修仙';
  
  const t = useCallback((
    key: TextKey, 
    params?: Record<string, any>
  ): string => {
    return textResolver.resolve(key, params || {}, {
      gameState,
      protagonist: gameState.protagonist!,
      worldType,
    });
  }, [gameState, worldType]);
  
  return { t };
}
```

### 6.3 内置动态值提供者

系统自动提供以下动态值，无需手动传入：

| 提供者名 | 值来源 | 示例输出 |
|---------|-------|---------|
| playerLevel | protagonist.level | "25" |
| playerName | protagonist.name | "张三" |
| combatPower | 计算战力 | "12,500" |
| realmName | protagonist.realm | "筑基期" |
| currentHp | protagonist.currentHp | "850" |
| maxHp | protagonist.maxHp | "1000" |
| resource | 术语系统 | "灵石" |
| power | 术语系统 | "灵力" |

---

## 七、迁移指南

### 7.1 渐进式迁移

系统支持新旧方式共存，可逐步迁移：

1. **第一阶段**：新功能使用新系统
2. **第二阶段**：迁移高频使用的文案
3. **第三阶段**：迁移所有文案
4. **第四阶段**：移除旧的 getTerminology 调用

### 7.2 迁移检查清单

- [ ] 识别组件中的硬编码字符串
- [ ] 在 textDefinitions.ts 中添加对应文案定义
- [ ] 替换组件中的字符串为 useText 调用
- [ ] 测试各世界类型下的文案显示
- [ ] 移除旧的导入和调用

---

## 八、常见问题排查

### 8.1 文案显示为键名

**问题**：页面显示 `combat.victory` 而非实际文案

**原因**：文案定义文件中缺少该键名

**解决**：
1. 检查 `textDefinitions.ts` 是否有该键
2. 确认键名拼写正确
3. 检查 TypeScript 类型定义是否覆盖

### 8.2 占位符未被替换

**问题**：页面显示 `击败了{enemyName}` 而非实际值

**原因**：
1. 未传入参数
2. 参数名不匹配
3. 动态值提供者未注册

**解决**：
```tsx
// 检查参数传入
t('combat.victory', { enemyName: '妖兽' })

// 检查是否需要注册提供者
registerValueProvider({
  name: 'enemyName',
  getValue: (ctx) => ctx.extras?.enemyName || '敌人'
});
```

### 8.3 世界类型切换后文案未更新

**问题**：切换世界类型后，文案仍显示旧世界的术语

**原因**：组件未正确订阅 worldType 变化

**解决**：
```tsx
// 确保使用 useText hook
const { t } = useText();  // 内部已订阅 worldType

// 而非直接使用 resolver
const text = textResolver.resolve(...); // ❌ 不会响应更新
```

---

## 九、维护指南

### 9.1 添加新文案

1. 在 `types.ts` 中添加键名类型
2. 在 `textDefinitions.ts` 中添加定义
3. 如需新参数，添加参数定义
4. 编写单元测试验证

### 9.2 添加新世界类型

1. 在 `terminology.ts` 中添加世界术语
2. 在需要覆盖的文案定义中添加 `byWorld` 字段
3. 测试所有文案在新世界类型下的显示

### 9.3 添加新动态值

1. 在 `valueProviders.ts` 中实现提供者
2. 在 `TextProvider` 中注册
3. 更新文档中的提供者列表

---

## 十、最佳实践

### 10.1 文案键命名规范

- 使用小驼峰命名：`combat.victory` ✅ `Combat.Victory` ❌
- 层级不超过3层：`combat.damage.crit` ✅
- 语义清晰：`ui.button.submit` ✅ `btn1` ❌

### 10.2 参数设计原则

- 优先使用内置提供者
- 参数名语义化：`{enemyName}` ✅ `{n}` ❌
- 必填参数要在类型中标记

### 10.3 性能优化

- 使用 `useCallback` 缓存 `t` 函数
- 避免在渲染中频繁调用 `resolve`
- 对于静态文案，可在构建时预解析
