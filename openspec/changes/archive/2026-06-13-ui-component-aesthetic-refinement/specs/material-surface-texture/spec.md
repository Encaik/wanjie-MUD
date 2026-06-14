## ADDED Requirements

### Requirement: Floating container components SHALL use subtle material gradient backgrounds

Card, Dialog, Sheet, Popover, Tooltip, and similar container components SHALL use a subtle gradient overlay on their background to suggest material depth and texture.

#### Scenario: Card uses vertical gradient

- **WHEN** inspecting Card's `className`
- **THEN** it includes `bg-gradient-to-b from-card via-card to-muted/20`
- **AND** the gradient is subtle enough that it is not immediately perceived as a gradient

#### Scenario: Dialog and Popover use vertical gradient

- **WHEN** inspecting Dialog or Popover `className`
- **THEN** `bg-popover` is replaced with `bg-gradient-to-b from-popover via-popover to-muted/10`

#### Scenario: Sheet uses vertical gradient

- **WHEN** inspecting Sheet `className`
- **THEN** `bg-background` or `bg-sidebar` is replaced with a gradient variant ending in `to-muted/15`

#### Scenario: Dark mode gradient remains visible

- **WHEN** inspecting the same components in `.dark` mode
- **THEN** the gradient end color uses `to-muted/30` (higher opacity for dark backgrounds)
- **AND** the visual effect is comparable to the light mode appearance

#### Scenario: Gradient does not affect component layout

- **WHEN** a component has `bg-gradient-to-b` applied
- **THEN** it still has an explicit `bg-*` as fallback before the gradient
- **AND** all child elements render correctly within the gradient container
