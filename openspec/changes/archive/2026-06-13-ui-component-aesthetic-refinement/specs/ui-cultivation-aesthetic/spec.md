## ADDED Requirements

### Requirement: Container surfaces SHALL use subtle material gradients

Card, Dialog, and similar container components SHALL use a subtle gradient background (`from-card via-card to-muted/20`) to evoke the warmth of paper or silk, rather than flat color fills.

#### Scenario: Card has subtle vertical gradient
- **WHEN** a Card is rendered
- **THEN** its background uses `bg-gradient-to-b from-card via-card to-muted/20`
- **AND** the gradient is subtle enough that it is not immediately perceived as a gradient

#### Scenario: Dialog has subtle vertical gradient
- **WHEN** a Dialog is rendered
- **THEN** its background uses `bg-gradient-to-b from-popover via-popover to-muted/10`

### Requirement: Header sections SHALL use decorative accent dividers

Card and Dialog header sections SHALL include a subtle gradient divider line separating the header from body content.

#### Scenario: CardHeader has gradient divider
- **WHEN** a CardHeader is rendered above CardContent
- **THEN** the header uses `border-b border-border/50` or a gradient divider line

### Requirement: Interaction feedback SHALL use cultivation-appropriate metaphors

Button hover SHALL use a lift effect (`translateY(-1px)`) with warm shadow enhancement, evoking the sensation of picking up a brush or leafing through parchment, rather than the generic scale-down effect.

#### Scenario: Button lifts on hover
- **WHEN** a Button is hovered
- **THEN** it lifts with `translateY(-1px)` and the shadow warms/enhances
- **AND** this replaces the `active:scale-[0.98]` scale feedback
