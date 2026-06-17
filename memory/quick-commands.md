---
name: quick-commands
description: 项目快速命令参考 — 开发、构建、检查、测试
metadata:
  type: reference
---

# 快速命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建静态导出
pnpm lint             # ESLint 检查
pnpm lint:strict      # 完整质量门（ESLint + 文件大小检查）
pnpm ts-check         # TypeScript 类型检查
pnpm test             # 运行 vitest 测试
pnpm check-sizes      # 仅检查文件大小限制
```

## 变更后必做检查
1. `pnpm ts-check` — 确保类型正确
2. `pnpm build` — 确保构建成功
3. 涉及 logic/ 变更时：`pnpm test`
4. 更新对应 `index.ts` 桶文件

**Why:** 完整质量门确保每次变更不破坏现有功能。
**How to apply:** 每次提交前运行 `pnpm lint:strict && pnpm ts-check && pnpm build`。
