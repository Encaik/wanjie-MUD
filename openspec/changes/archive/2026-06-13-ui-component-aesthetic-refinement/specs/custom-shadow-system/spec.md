## ADDED Requirements

### Requirement: Box shadow tokens SHALL use warm-hue color

All `--shadow-*` CSS custom properties in `tokens.css` SHALL use a warm brown hue (`oklch` hue angle ~55) instead of the default neutral black (`rgb(0 0 0)`).

#### Scenario: --shadow-sm uses warm hue

- **WHEN** inspecting `--shadow-sm` in `tokens.css`
- **THEN** the shadow color uses `oklch(0.3 0.04 55 / <alpha>)` instead of `rgb(0 0 0 / <alpha>)`
- **AND** the visual difference is subtle enough not to be immediately noticeable

#### Scenario: All shadow tokens are updated consistently

- **WHEN** inspecting all `--shadow-*` tokens
- **THEN** each token from `--shadow-2xs` through `--shadow-2xl` uses an `oklch()` color with hue angle 50-60
- **AND** larger shadows have proportionally higher alpha values

#### Scenario: Dark mode shadows use lower lightness

- **WHEN** the `.dark` variant is active
- **THEN** shadow colors maintain the same hue angle but use lower lightness (e.g., `oklch(0.15 0.03 55 / <alpha>)`)
- **AND** shadows are generally less visible in dark mode

### Requirement: Shadow tokens SHALL maintain Tailwind compatibility

The custom shadow tokens SHALL be overridden in the `@theme inline` block of `tokens.css`, preserving Tailwind utility class usage (`shadow-sm`, `shadow-md`, etc.).

#### Scenario: Tailwind utility classes produce warm shadows

- **WHEN** any component uses `shadow-sm` class
- **THEN** the rendered shadow uses the warm-hue custom value from `--shadow-sm`
- **AND** no component needs to change its Tailwind shadow class usage
