## ADDED Requirements

### Requirement: Empty state SHALL use the Empty component family as the single standard

All empty state displays across the application SHALL use the `Empty` component family (`Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`) from `src/shared/ui/feedback/empty.tsx`. No new empty state implementations SHALL be created.

#### Scenario: empty-slot.tsx is removed

- **WHEN** verifying the codebase after migration
- **THEN** `src/shared/ui/empty-slot.tsx` no longer exists
- **AND** all consumers that previously imported from `@/shared/ui/empty-slot` now import from `@/shared/ui/feedback/empty`

#### Scenario: ProductCard empty states use Empty component

- **WHEN** inspecting `src/modules/economy/components/ProductCard.tsx`
- **THEN** `ProductEmptyState` component is either removed or delegates to the `Empty` component family
- **AND** `ShopLockedState` similarly uses `Empty` components

#### Scenario: DifficultySelect empty state uses Empty component

- **WHEN** inspecting `src/views/game/DifficultySelect.tsx`
- **THEN** the inline empty state "暂无可选难度" uses the `Empty` component with appropriate props
- **AND** no inline div with hardcoded empty state text remains

#### Scenario: MessagePanel empty uses Empty component

- **WHEN** inspecting `src/shared/components/MessagePanel.tsx`
- **THEN** the "暂无消息记录" empty state uses `Empty` components instead of bare `div` with `text-muted-foreground`

#### Scenario: All module empty states use Empty

- **WHEN** running `grep -r "暂无" src/modules/ --include="*.tsx"`
- **THEN** occurrences of such text are wrapped in `Empty` components, not bare `div` or `p` elements

### Requirement: EmptySlotCard and BackpackHeader SHALL be migrated to feedback/

The `EmptySlotCard`, `BackpackHeader`, and `EmptyBackpackHint` components currently in `empty-slot.tsx` SHALL be preserved but migrated to the `feedback/` directory. They SHALL be refactored to use `Empty` sub-components internally where possible.

#### Scenario: EmptySlotCard reuses Empty styling

- **WHEN** inspecting the migrated `EmptySlotCard`
- **THEN** it uses at minimum the `font-serif` and spacing conventions from the `Empty` component family
- **AND** visual appearance is consistent with other empty states
