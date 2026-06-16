# cleanup

## ADDED Requirements

### Requirement: 旧代码移除后系统正常运行

#### Scenario: 构建和测试通过

- **WHEN** 移除所有 deprecated 代码
- **THEN** `pnpm build` 成功
- **AND** `pnpm test` 全部通过
