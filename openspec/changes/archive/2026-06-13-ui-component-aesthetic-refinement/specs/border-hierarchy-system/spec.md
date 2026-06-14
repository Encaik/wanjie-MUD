## ADDED Requirements

### Requirement: Components SHALL use a multi-layer border hierarchy

Components SHALL move beyond single `border-border` to a layered border system: outer frame, inner highlight, and decorative dividing lines.

#### Scenario: Card and Dialog use inset highlight

- **WHEN** inspecting `src/shared/ui/data-display/card.tsx`
- **THEN** the root element includes `shadow-[inset_0_1px_0_oklch(1_0_0/0.05)]` or equivalent to simulate an inner highlight
- **AND** the outer border uses `border-border/80` (slightly transparent)

#### Scenario: Button uses inset highlight for raised feel

- **WHEN** inspecting `src/shared/ui/actions/button.tsx`
- **THEN** the default variant includes a subtle top inner highlight via `shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]`
- **AND** the highlight darkens or disappears on `active` state

#### Scenario: Input focus uses combined inner shadow

- **WHEN** an input element receives focus
- **THEN** the focus ring uses `ring-2` with `shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]` for a recessed feel
- **AND** the ring color uses `border-primary/50` or `ring-primary/50`

#### Scenario: Card header uses gradient divider line

- **WHEN** a `CardHeader` or `DialogHeader` is rendered
- **THEN** it SHALL use `border-b border-border/50` or a decorative `h-px bg-gradient-to-r from-transparent via-border to-transparent` divider below the title
- **AND** the divider is visually softer than a solid border

#### Scenario: Item row uses left accent border

- **WHEN** an `Item` is hovered
- **THEN** it may optionally show a `border-l-2` accent bar in the item's designated color
- **AND** the accent bar transitions in with `duration-150`
