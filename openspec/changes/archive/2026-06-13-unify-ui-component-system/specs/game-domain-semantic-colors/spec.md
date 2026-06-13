## ADDED Requirements

### Requirement: Game domain semantic CSS variables SHALL be defined in themes.css

`src/app/styles/themes.css` SHALL define the following game domain semantic color CSS variables in both `:root` and `.dark` blocks:

- `--game-combat` — 战斗领域色（赤红系）
- `--game-cultivation` — 修炼领域色（灵蓝系）
- `--game-recovery` — 恢复领域色（翠绿系）
- `--game-economy` — 经济领域色（金黄系）
- `--game-mental` — 心境领域色（紫韵系）
- `--game-tribulation` — 渡劫领域色（橙雷系）

Each variable SHALL use oklch color notation, consistent with the existing theme system.

#### Scenario: Light theme has combat color

- **WHEN** inspecting `:root` in `themes.css`
- **THEN** `--game-combat` is defined with an oklch value appropriate for light backgrounds (e.g., `oklch(0.55 0.18 25)`)
- **AND** it is visually distinguishable from `--destructive`

#### Scenario: Dark theme adjusts domain colors

- **WHEN** inspecting `.dark` in `themes.css`
- **THEN** all `--game-*` variables have adjusted values optimized for dark backgrounds
- **AND** they are visually distinguishable from each other

#### Scenario: tokens.css bridges all game domain colors

- **WHEN** inspecting `tokens.css`
- **THEN** each `--game-*` variable has a corresponding `--color-game-*` entry in the `@theme inline` block
- **AND** the bridge name matches the variable name (e.g., `--color-game-combat: var(--game-combat)`)

### Requirement: All hardcoded Tailwind palette colors in module components SHALL be replaced with game domain semantic colors

Components in `src/modules/` that currently use hardcoded Tailwind palette classes (e.g., `text-green-500`, `bg-blue-100`, `border-red-500/50`, `text-purple-600 dark:text-purple-400`) for domain-specific coloring SHALL be updated to use the corresponding `game-*`, `quality-*`, or standard semantic tokens.

#### Scenario: Combat components use game-combat

- **WHEN** inspecting `src/modules/combat/components/`
- **THEN** no instances of `text-red-*`, `bg-red-*`, `border-red-*` Tailwind palette classes remain for combat-related styling
- **AND** combat-related colors use `text-game-combat`, `bg-game-combat`, `border-game-combat`, or their `/10` / `/20` opacity variants

#### Scenario: Recovery/healing uses game-recovery

- **WHEN** inspecting components that display HP recovery, healing, or restoration
- **THEN** green palette classes (`text-green-*`, `bg-green-*`) are replaced with `text-game-recovery`, `bg-game-recovery/10`, etc.

#### Scenario: Economy displays use game-economy

- **WHEN** inspecting shop, currency, or economy-related components
- **THEN** yellow/gold palette classes are replaced with `text-game-economy`, `bg-game-economy/10`, etc.

#### Scenario: Mental state uses game-mental

- **WHEN** inspecting mental state displays in `CultivationPanel` and related components
- **THEN** purple palette classes related to mental state are replaced with `text-game-mental`, `bg-game-mental/10`

### Requirement: Game domain semantic colors SHALL NOT replace existing semantic tokens for non-domain uses

General-purpose UI states（primary/secondary/muted/destructive）SHALL continue using the existing semantic token system. Game domain colors are only for domain-specific visual communication (combat, cultivation, recovery, economy, mental, tribulation).

#### Scenario: Destructive actions use destructive token

- **WHEN** a "delete" or "danger" action button is rendered
- **THEN** it uses `bg-destructive` or `text-destructive`, NOT `bg-game-combat`
- **AND** `game-combat` is only used for game world-specific combat displays, not generic destructive UI
