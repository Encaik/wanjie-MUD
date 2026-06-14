## ADDED Requirements

### Requirement: Container headers SHALL use decorative top accent line

CardHeader and DialogHeader SHALL include a subtle decorative accent line separating the header from content.

#### Scenario: CardHeader has gradient bottom divider

- **WHEN** a CardHeader is rendered with content below it
- **THEN** the header includes `border-b border-border/50` or equivalent
- **AND** the divider is visually distinct from the card's outer border

#### Scenario: DialogHeader has accent divider

- **WHEN** a DialogHeader is rendered
- **THEN** it includes a subtle bottom border or gradient line separator

### Requirement: Tab active state SHALL use underline indicator

The TabsTrigger active state SHALL use an underline-style indicator instead of or in addition to the background color change.

#### Scenario: Active tab shows underline

- **WHEN** a TabsTrigger is in active state (`data-[state=active]`)
- **THEN** it displays a bottom underline via `shadow-[inset_0_-2px_0_var(--primary)]`
- **AND** the underline animates in with `duration-200`

### Requirement: Selected/active states SHALL use subtle accent marks

Components that have selected or active states (radio-group items, select options, toggle) SHALL use a small accent mark or color indicator rather than only background color changes.

#### Scenario: Radio item shows accent ring

- **WHEN** a radio-group item is selected
- **THEN** it displays a colored accent ring or dot using `primary` or `game-*` color
- **AND** unselected items show only a muted ring

#### Scenario: Toggle active shows accent

- **WHEN** a Toggle is in active state
- **THEN** it uses `bg-primary/10 text-primary` or equivalent distinct accent styling
