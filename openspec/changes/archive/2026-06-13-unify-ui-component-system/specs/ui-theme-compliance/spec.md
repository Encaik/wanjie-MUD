## ADDED Requirements

### Requirement: Game domain semantic colors SHALL be used for domain-specific styling

Custom components SHALL use `game-*` semantic color tokens (`game-combat`, `game-cultivation`, `game-recovery`, `game-economy`, `game-mental`, `game-tribulation`) for game-domain-specific visual communication, in addition to the existing primary/secondary/muted semantic tokens.

#### Scenario: Domain-specific backgrounds use game tokens

- **WHEN** a component displays combat-related information (e.g., damage numbers, battle panels)
- **THEN** the background element uses `bg-game-combat/10` instead of hardcoded `bg-red-50` or `bg-red-500/10`
- **AND** combat text uses `text-game-combat` instead of `text-red-600`

#### Scenario: Domain-specific borders use game tokens

- **WHEN** a component renders a border for domain-specific sections
- **THEN** the border uses `border-game-combat`, `border-game-cultivation`, etc. rather than hardcoded Tailwind palette borders

## MODIFIED Requirements

### Requirement: Custom UI components SHALL use semantic theme tokens for all colors

All custom UI components SHALL use only semantic CSS variable-based Tailwind classes for colors. Hardcoded Tailwind native color palette classes (e.g., `bg-amber-500`, `text-blue-600`, `border-red-300`, `bg-cyan-100`, `text-sky-700`, `bg-gray-200`) are forbidden. Acceptable classes include `bg-primary`, `text-muted-foreground`, `bg-quality-rare/10`, `border-border`, `bg-popover`, `text-popover-foreground`, `bg-game-combat/10`, `text-game-cultivation`等.

#### Scenario: item-tooltip uses zero hardcoded palette colors

- **WHEN** inspecting `src/shared/ui/overlay/item-tooltip.tsx` and `src/shared/ui/overlay/upgradeable-item-tooltip.tsx`
- **THEN** zero occurrences of Tailwind palette color classes are present
- **AND** all color classes reference semantic tokens (`primary`, `secondary`, `muted`, `accent`, `quality-*`, `game-*`, `background`, `foreground`, `border`, `card`, `popover`, `destructive`)

#### Scenario: All custom components pass color audit at new locations

- **WHEN** running `grep` for hardcoded Tailwind native color palette classes across `src/shared/ui/actions/`, `src/shared/ui/feedback/`, `src/shared/ui/data-display/`, `src/shared/ui/overlay/`, `src/shared/ui/forms/`
- **THEN** zero matches are found

#### Scenario: Dark mode variants use semantic tokens

- **WHEN** any custom component uses a `dark:` variant for color
- **THEN** the color portion references a semantic token (e.g., `dark:bg-card`, `dark:text-popover-foreground`)
- **AND** no `dark:bg-amber-*` or equivalent raw palette classes are present

### Requirement: Custom components SHALL consistently use data-slot attributes

Each custom component's root rendered element MUST include a `data-slot` attribute identifying the component for debugging and CSS selection hooks. Custom components moved to subdirectories SHALL retain their existing `data-slot` attributes unchanged.

#### Scenario: All custom component roots have data-slot after reorganization

- **WHEN** inspecting all custom components in `src/shared/ui/actions/`, `src/shared/ui/feedback/`, `src/shared/ui/data-display/`, `src/shared/ui/overlay/`, `src/shared/ui/forms/`
- **THEN** each root rendered element has a `data-slot` attribute matching the component name
- **AND** the `data-slot` values are unchanged from their pre-move values

### Requirement: Custom components SHALL use CVA for variant definitions

All custom components that support variants (e.g., `size`, `variant` props) SHALL define their variant classes using `class-variance-authority` (`cva`). This ensures consistent variant handling and type safety across the component library.

#### Scenario: Spinner uses CVA for variants

- **WHEN** inspecting `src/shared/ui/feedback/spinner.tsx`
- **THEN** the variant selection uses CVA (`cva({ ... variants: { variant: { ... } } })`)
- **AND** the component accepts `VariantProps<typeof spinnerVariants>` in its props

#### Scenario: CooldownButton uses CVA (optional, non-blocking)

- **WHEN** inspecting `src/shared/components/CooldownButton.tsx` or `src/shared/components/cooldown-button.tsx`
- **THEN** it EITHER uses CVA for its styling OR has inline styles with a documented reason for not using CVA

## REMOVED Requirements

### Requirement: item-tooltip.tsx SHALL be split to comply with 300-line component limit

**Reason**: This requirement is superseded by the directory reorganization (`shared/ui/overlay/`). The file was already split into `item-tooltip.tsx` and `upgradeable-item-tooltip.tsx`. `EmptySlotCard` etc. have been migrated to `feedback/` per the empty-state-unification spec.
**Migration**: The two tooltip files remain as separate files in `src/shared/ui/overlay/`, and the empty state sub-components are now handled by the `feedback/` directory.
