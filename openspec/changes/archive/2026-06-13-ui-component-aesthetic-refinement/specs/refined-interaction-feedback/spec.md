## ADDED Requirements

### Requirement: Button hover state SHALL use lift + shadow interaction

The default Button variant's hover state SHALL replace `active:scale-[0.98]` transform with a lift effect combining `translateY(-1px)` and enhanced shadow.

#### Scenario: Default button lifts on hover

- **WHEN** a default variant Button is hovered
- **THEN** it applies `translateY(-1px)` and `shadow-md` (up from `shadow-sm`)
- **AND** the transition uses `duration-150` for responsiveness

#### Scenario: Button active state shows press

- **WHEN** a Button is pressed (active)
- **THEN** it applies `translateY(0)` and returns to `shadow-sm`
- **AND** the inset highlight shadow is removed or darkened on active

### Requirement: Card hover SHALL use border color shift

The Card component's hover state SHALL transition its border color from `border-border` toward `border-primary/30` with an optional shadow enhancement.

#### Scenario: Card border glows on hover

- **WHEN** a Card is hovered
- **THEN** `border-border` transitions to `border-primary/30` over `duration-200`
- **AND** the shadow may subtly deepen

### Requirement: Input focus SHALL use thin ring + inset shadow

The Input component's focus indicator SHALL use a thinner ring (`ring-2`) combined with a subtle inset shadow, replacing the default `ring-[3px]`.

#### Scenario: Focus ring is precise

- **WHEN** an Input receives focus
- **THEN** it displays `ring-2 border-primary/50` combined with `shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]`
- **AND** the transition uses `duration-150`

#### Scenario: Textarea focus matches

- **WHEN** a Textarea receives focus
- **THEN** the same focus style as Input is applied (ring-2 + inset shadow)

### Requirement: Item hover SHALL use background shift + optional accent

The Item component's hover state SHALL shift the background by a subtle amount and may show a left accent border.

#### Scenario: Item row highlights on hover

- **WHEN** an Item is hovered
- **THEN** the background color transitions (e.g., `hover:bg-accent/50`)
- **AND** the hover transition uses `duration-150`

### Requirement: All interaction transitions SHALL use consistent timing

All interactive state transitions (hover, focus, active) across shared/ui components SHALL use `duration-150` for enter/active states and `duration-200` for exit/inactive states where applicable, ensuring a cohesive feel.

#### Scenario: Hover enter is faster than exit

- **WHEN** a hoverable component enters hover state
- **THEN** the transition uses `duration-150`
- **AND** when exiting hover state, it uses `duration-200`
