## ADDED Requirements

### Requirement: Custom UI components SHALL be organized into type-based subdirectories

The custom (non-shadcn) components in `src/shared/ui/` SHALL be moved into subdirectories grouped by component type: `actions/`, `data-display/`, `feedback/`, `overlay/`, and `forms/`. shadcn standard components SHALL remain at the `src/shared/ui/` root level.

#### Scenario: button-group moves to actions/

- **WHEN** verifying the new `src/shared/ui/actions/` directory
- **THEN** `button-group.tsx` is located at `src/shared/ui/actions/button-group.tsx`
- **AND** `src/shared/ui/actions/index.ts` exports `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`

#### Scenario: item, tabs move to data-display/

- **WHEN** verifying `src/shared/ui/data-display/`
- **THEN** `item.tsx` and `tabs.tsx` are located there
- **AND** their barrel exports are updated

#### Scenario: spinner, empty move to feedback/

- **WHEN** verifying `src/shared/ui/feedback/`
- **THEN** `spinner.tsx` and `empty.tsx` are located there
- **AND** their barrel exports are updated

#### Scenario: item-tooltip, upgradeable-item-tooltip move to overlay/

- **WHEN** verifying `src/shared/ui/overlay/`
- **THEN** `item-tooltip.tsx` and `upgradeable-item-tooltip.tsx` are located there
- **AND** their barrel exports are updated

#### Scenario: field, input-group move to forms/

- **WHEN** verifying `src/shared/ui/forms/`
- **THEN** `field.tsx` and `input-group.tsx` are located there
- **AND** their barrel exports are updated

#### Scenario: shadcn components remain at root

- **WHEN** listing files in `src/shared/ui/` root
- **THEN** shadcn files (`button.tsx`, `card.tsx`, `dialog.tsx`, `badge.tsx`, etc.) remain in the root directory
- **AND** they are NOT duplicated into subdirectories

### Requirement: Barrel export SHALL provide backward compatibility

A `src/shared/ui/index.ts` SHALL be created that re-exports all custom components from their new subdirectory locations, so existing imports of the form `@/shared/ui/<component>` continue to work.

#### Scenario: index.ts exports all custom components

- **WHEN** importing from `@/shared/ui`
- **THEN** all custom component names (ButtonGroup, Spinner, Empty, Item, ItemTooltip, UpgradeableItemTooltip, Field) are available
- **AND** no TypeScript or runtime errors occur due to missing exports

#### Scenario: Consumers import without path changes

- **WHEN** any existing component imports `@/shared/ui/button-group`
- **THEN** the import resolves successfully via barrel re-export from `src/shared/ui/index.ts`
- **AND** no consumer files need path updates
