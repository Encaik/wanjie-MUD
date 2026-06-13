## ADDED Requirements

### Requirement: Component rounded corners SHALL use differentiated strategy

Components in `src/shared/ui/` SHALL use different `rounded-*` values based on their functional type, rather than uniform rounding.

#### Scenario: Button and Input use rounded-sm

- **WHEN** inspecting `src/shared/ui/actions/button.tsx` and `src/shared/ui/forms/input.tsx`
- **THEN** the root element uses `rounded-sm` class
- **AND** it is visually distinct from `rounded-md` used by containers

#### Scenario: Card and Dialog use rounded-xl

- **WHEN** inspecting `src/shared/ui/data-display/card.tsx` and `src/shared/ui/overlay/dialog.tsx`
- **THEN** the root element uses `rounded-xl` class

#### Scenario: Navigation elements use minimal rounding

- **WHEN** inspecting sidebar, navigation-menu, and toggle components
- **THEN** they use `rounded-none` or `rounded-sm`, not `rounded-md`
- **AND** the reduced rounding creates visual contrast with content containers

#### Scenario: Separator uses no rounding

- **WHEN** inspecting `src/shared/ui/layout/separator.tsx`
- **THEN** it uses `rounded-none` (no corner rounding)

#### Scenario: Custom shadow exists for components needing rounded corners

- **WHEN** components like Tooltip and Popover need soft corners
- **THEN** they use `rounded-lg` (intermediate value between sm and xl)
