## ADDED Requirements

### Requirement: Cooldown button SHALL use cultivation-themed visual feedback

The `CooldownButton` component's cooldown indication MUST use a cultivation-genre visual metaphor instead of a generic Western-style dark overlay (`bg-black/60` with `clip-path`).

#### Scenario: Cooldown shows cultivation-themed overlay
- **WHEN** a CooldownButton is in cooldown state
- **THEN** the visual overlay does NOT use `bg-black/60` dark rectangle
- **AND** the overlay uses a cultivation-themed visual (e.g., `bg-gradient-to-t from-primary/30 to-transparent` ink-wash fade)

#### Scenario: Cooldown timer text uses serif font
- **WHEN** the cooldown countdown text is displayed (e.g., "3.2s")
- **THEN** the text uses `font-serif` class
- **AND** the text remains readable against the themed overlay at all progress levels

#### Scenario: Cooldown button root has data-slot
- **WHEN** a CooldownButton is rendered
- **THEN** the root element includes `data-slot="cooldown-button"`

### Requirement: Spinner SHALL support a cultivation-themed loading variant

The `Spinner` component SHALL provide an optional `variant` prop with a cultivation-themed option.

#### Scenario: Default spinner unchanged
- **WHEN** Spinner is rendered without a `variant` prop or with `variant="default"`
- **THEN** the standard `Loader2Icon` with `animate-spin` is displayed as before

#### Scenario: Cultivation variant displays qi-orb animation
- **WHEN** Spinner is rendered with `variant="cultivation"`
- **THEN** a CSS-only dual-ring qi-orb animation is displayed (outer ring `border-primary/30`, inner ring `border-t-primary animate-spin`)
- **AND** the animation uses only Tailwind CSS classes — no new JS dependencies

#### Scenario: Both spinner variants have data-slot
- **WHEN** Spinner is rendered with any variant
- **THEN** the root element includes `data-slot="spinner"`

### Requirement: Item tooltip SHALL include subtle cultivation-genre decorative elements

The `ItemTooltip` and `UpgradeableItemTooltip` components SHALL include subtle decorative elements that evoke the cultivation genre without reducing readability.

#### Scenario: Tooltip has classical border styling
- **WHEN** an item tooltip content is rendered
- **THEN** the tooltip uses `bg-popover text-popover-foreground border-2 border-border shadow-lg` instead of hardcoded `bg-amber-50 border-amber-300`
- **AND** the decoration does not obscure text content

#### Scenario: Rarity badge uses quality colors with serif font
- **WHEN** an item's rarity badge is rendered
- **THEN** the badge uses `font-serif` and the correct `quality-*` color class
- **AND** the badge text (e.g., "史诗", "传说") is clearly readable

#### Scenario: Stat separators use gradient dividers
- **WHEN** a stats section is rendered inside a tooltip
- **THEN** the separator between sections uses `bg-gradient-to-r from-transparent via-border to-transparent h-px` instead of plain `border-t border-amber-200`

### Requirement: Empty state SHALL support cultivation-themed presentation

The `Empty` component family SHALL use cultivation-appropriate colors and fonts.

#### Scenario: EmptyMedia icon variant uses thematic colors
- **WHEN** `EmptyMedia` is rendered with `variant="icon"`
- **THEN** the icon container uses `bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground` instead of `bg-muted text-foreground`

#### Scenario: Empty state text uses serif font
- **WHEN** an empty state title or description is rendered
- **THEN** the text elements use `font-serif` class

### Requirement: Sub-components extracted from item-tooltip SHALL maintain game aesthetic

The `EmptySlotCard`, `BackpackHeader`, and `EmptyBackpackHint` components (currently inside `item-tooltip.tsx`) SHALL maintain cultivation-appropriate styling after extraction.

#### Scenario: EmptySlotCard uses semantic border and muted colors
- **WHEN** `EmptySlotCard` is rendered
- **THEN** it uses `border-border bg-muted/30 text-muted-foreground` and `font-serif` on text

#### Scenario: BackpackHeader uses muted foreground
- **WHEN** `BackpackHeader` is rendered
- **THEN** it uses `text-muted-foreground` and `font-serif` on text
