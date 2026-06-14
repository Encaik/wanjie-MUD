## MODIFIED Requirements

### Requirement: Cooldown button SHALL use cultivation-themed visual feedback

The `CooldownButton` component (located at `src/shared/components/CooldownButton.tsx`) SHALL use a cultivation-genre visual metaphor for its cooldown indication.

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

### Requirement: Empty state SHALL support cultivation-themed presentation

The `Empty` component family (located at `src/shared/ui/feedback/empty.tsx`) SHALL use cultivation-appropriate colors and fonts.

#### Scenario: EmptyMedia icon variant uses thematic colors

- **WHEN** `EmptyMedia` is rendered with `variant="icon"`
- **THEN** the icon container uses `bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground` instead of `bg-muted text-foreground`

#### Scenario: Empty state text uses serif font

- **WHEN** an empty state title or description is rendered
- **THEN** the text elements use `font-serif` class

### Requirement: EmptySlotCard and related SHALL maintain game aesthetic after migration to feedback/

The `EmptySlotCard`, `BackpackHeader`, and `EmptyBackpackHint` components (currently at `src/shared/ui/feedback/` after migration from `empty-slot.tsx`) SHALL maintain cultivation-appropriate styling.

#### Scenario: EmptySlotCard uses semantic border and muted colors

- **WHEN** `EmptySlotCard` is rendered
- **THEN** it uses `border-border bg-muted/30 text-muted-foreground` and `font-serif` on text

#### Scenario: BackpackHeader uses muted foreground

- **WHEN** `BackpackHeader` is rendered
- **THEN** it uses `text-muted-foreground` and `font-serif` on text

## ADDED Requirements

### Requirement: Module components using game aesthetic colors SHALL use game domain semantic tokens

Module-level components that previously defined their own domain color mappings (e.g., `MessagePanel.tsx`'s `rarityColors`, `CultivationPanel.tsx`'s `getPathColor`) SHALL use `game-*` semantic tokens or reference `modules/theme/data/rarityStyles.ts` instead.

#### Scenario: CultivationPanel path colors use game domain tokens

- **WHEN** inspecting `CultivationPanel.tsx`'s `getPathColor` function
- **THEN** color values reference `game-*` or `quality-*` tokens instead of hardcoded Tailwind palette classes
- **AND** the overall visual appearance is preserved

#### Scenario: MessagePanel rarity badge uses rarityStyles

- **WHEN** inspecting `MessagePanel.tsx`
- **THEN** the `rarityColors` local mapping is removed
- **AND** rarity badge colors come from `getRarityStyle()` in `modules/theme/data/rarityStyles.ts`

## REMOVED Requirements

### Requirement: Sub-components extracted from item-tooltip SHALL maintain game aesthetic

**Reason**: This requirement is superseded by the empty-state-unification spec. The sub-components (`EmptySlotCard`, `BackpackHeader`, `EmptyBackpackHint`) are no longer associated with item-tooltip and are handled by the feedback/ directory as part of the unified empty state system.
**Migration**: The styling requirements for these components are now covered by the `empty-state-unification` spec's requirement that migrated empty states maintain visual consistency.
