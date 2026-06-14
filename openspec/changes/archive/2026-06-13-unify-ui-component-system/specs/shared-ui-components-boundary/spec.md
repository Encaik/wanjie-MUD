## ADDED Requirements

### Requirement: CooldownButton SHALL be located in src/shared/components/

The `CooldownButton` component, which manages game-specific cooldown logic and visual feedback, SHALL be moved from `src/shared/ui/` to a dedicated file in `src/shared/components/`.

#### Scenario: CooldownButton exists in shared/components/

- **WHEN** verifying the codebase
- **THEN** `src/shared/components/CooldownButton.tsx` or `src/shared/components/cooldown-button.tsx` exists
- **AND** `src/shared/ui/cooldown-button.tsx` no longer exists

#### Scenario: All imports are updated

- **WHEN** running `grep -r "shared/ui/cooldown-button" src/ --include="*.tsx" --include="*.ts"`
- **THEN** zero results are returned
- **AND** all consumers now import from `@/shared/components/cooldown-button` or `@/shared/components`

#### Scenario: No barrel backward compatibility for CooldownButton

- **WHEN** inspecting `src/shared/ui/index.ts`
- **THEN** there is NO re-export of CooldownButton from shared/ui/
- **AND** the migration intentionally breaks the old import path to enforce architectural boundaries
