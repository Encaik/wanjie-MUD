## ADDED Requirements

### Requirement: Rounded corners SHALL use differentiated strategy per component type

Components SHALL use component-type-specific `rounded-*` values instead of uniform rounding. See `rounded-corner-strategy` spec for detailed mapping.

#### Scenario: Interactive elements use smaller rounding
- **WHEN** rendering interactive elements (Button, Input, Badge)
- **THEN** they use `rounded-sm` rather than `rounded-md`

#### Scenario: Container elements retain larger rounding
- **WHEN** rendering container elements (Card, Dialog)
- **THEN** they use `rounded-xl` for soft container boundaries

### Requirement: Shadows SHALL use warm-hue color

All `--shadow-*` CSS tokens SHALL use warm brown hue color components (`oklch` hue ~55) instead of neutral black.

#### Scenario: Default shadow uses warm tint
- **WHEN** inspecting `--shadow-md` value
- **THEN** the shadow color is `oklch(0.3 0.04 55 / ...)` rather than `rgb(0 0 0 / ...)`

## MODIFIED Requirements

### Requirement: Interactive state feedback

All interactive elements (buttons, links, selectable cards) SHALL provide visual feedback for hover, focus, active, and disabled states. Hover and active state SHALL use lift + shadow transitions rather than scale transforms.

#### Scenario: Button states
- **WHEN** a button is hovered
- **THEN** it lifts with `translateY(-1px)` and enhanced shadow (`shadow-md`)
- **WHEN** a button is active (pressed)
- **THEN** it returns to resting position with default shadow
- **AND** the inset highlight may darken
- **WHEN** disabled
- **THEN** it SHALL show reduced opacity and no interactive feedback

#### Scenario: Selectable cards
- **WHEN** a card or panel is clickable/selectable
- **THEN** it SHALL show hover border color transition (`border-border` → `border-primary/30`)

### Requirement: Focus indicator style

All focusable form controls SHALL use a thin focus ring (`ring-2`) with inset shadow, replacing wider default rings.

#### Scenario: Input focus
- **WHEN** an input, textarea, or select receives focus
- **THEN** it displays `ring-2 ring-primary/50` with `shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]`
- **AND** the transition duration is 150ms
