# UI Theme Compliance

## Purpose

确保 `src/shared/ui/` 中所有自定义 UI 组件严格使用语义化 CSS 变量表达颜色、
统一样式属性，使用 `class-variance-authority` 定义变体，与全局主题系统保持一致。

## Requirements

### Requirement: Custom UI components SHALL use semantic theme tokens for all colors

All custom UI components SHALL use only semantic CSS variable-based Tailwind classes for colors. Hardcoded Tailwind native color palette classes (e.g., `bg-amber-500`, `text-blue-600`, `border-red-300`, `bg-cyan-100`, `text-sky-700`, `bg-gray-200`) are forbidden. Acceptable classes include `bg-primary`, `text-muted-foreground`, `bg-quality-rare/10`, `border-border`, `bg-popover`, `text-popover-foreground`, `bg-game-combat/10`, `text-game-cultivation`等。

#### Scenario: item-tooltip uses zero hardcoded palette colors
- **WHEN** inspecting `src/shared/ui/data-display/item-tooltip.tsx` and `src/shared/ui/data-display/upgradeable-item-tooltip.tsx`
- **THEN** zero occurrences of Tailwind palette color classes are present
- **AND** all color classes reference semantic tokens (`primary`, `secondary`, `muted`, `accent`, `quality-*`, `game-*`, `background`, `foreground`, `border`, `card`, `popover`, `destructive`)

#### Scenario: All custom components pass color audit at new locations
- **WHEN** running `grep` for hardcoded Tailwind native color palette classes across `src/shared/ui/actions/`, `src/shared/ui/feedback/`, `src/shared/ui/data-display/`, `src/shared/ui/overlay/`, `src/shared/ui/forms/`
- **THEN** zero matches are found

#### Scenario: Dark mode variants use semantic tokens
- **WHEN** any custom component uses a `dark:` variant for color
- **THEN** the color portion references a semantic token (e.g., `dark:bg-card`, `dark:text-popover-foreground`)
- **AND** no `dark:bg-amber-*` or equivalent raw palette classes are present

### Requirement: Item rarity color mapping SHALL align with the global quality color system

The rarity-to-color mapping in `item-tooltip.tsx` and any extracted rarity utility files MUST match the quality color system defined in `globals.css`:

| 稀有度 | Quality Tier | CSS Variable | 视觉颜色 |
|--------|-------------|--------------|---------|
| 神话 | mythic | `--quality-mythic` | 红色 |
| 传说 | mythic | `--quality-mythic` | 红色 |
| 史诗 | legendary | `--quality-legendary` | 橙色 |
| 稀有 | epic | `--quality-epic` | 黄色/金色 |
| 精良 | rare | `--quality-rare` | 紫色 |
| 优秀 | uncommon | `--quality-uncommon` | 蓝色 |
| 普通 | common | `--quality-common` | 绿色 |
| 劣质 | poor | `--quality-poor` | 灰色 |
| 基础 | basic | `--quality-basic` | 白色 |

#### Scenario: Rarity text color matches quality system
- **WHEN** an item with rarity "史诗" is displayed in a tooltip
- **THEN** the rarity badge/text uses `quality-legendary` (orange) via `text-quality-legendary` or equivalent semantic class

#### Scenario: All 9 rarity tiers are mapped
- **WHEN** reviewing the rarity style mapping
- **THEN** every tier (神话/传说/史诗/稀有/精良/优秀/普通/劣质/基础) has an entry
- **AND** each entry references only `quality-*` CSS variables for color

### Requirement: Custom components SHALL use font-serif for text display

All 9 custom UI components displaying text content MUST explicitly include the `font-serif` class on text-containing elements, ensuring consistent font rendering regardless of CSS inheritance quirks in component trees.

#### Scenario: Every custom component uses font-serif on text
- **WHEN** running `grep "font-serif" src/shared/ui/*.tsx`
- **THEN** at minimum the following files have `font-serif` on text elements: item-tooltip.tsx, cooldown-button.tsx, empty.tsx, kbd.tsx, item.tsx, field.tsx
- **AND** input-group.tsx, button-group.tsx, spinner.tsx are confirmed as not needing font-serif (no CJK text content)

#### Scenario: Tooltip text uses serif font
- **WHEN** an item tooltip is rendered
- **THEN** text elements (name, type, description, stats, skills) use `font-serif` class
- **AND** the rendered text appears in Noto Serif SC or the configured serif fallback

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
- **WHEN** inspecting `src/shared/components/CooldownButton.tsx`
- **THEN** it EITHER uses CVA for its styling OR has inline styles with a documented reason for not using CVA

### Requirement: Game domain semantic colors SHALL be used for domain-specific styling

Custom components SHALL use `game-*` semantic color tokens (`game-combat`, `game-cultivation`, `game-recovery`, `game-economy`, `game-mental`, `game-tribulation`) for game-domain-specific visual communication, in addition to the existing primary/secondary/muted semantic tokens.

#### Scenario: Domain-specific backgrounds use game tokens
- **WHEN** a component displays combat-related information (e.g., damage numbers, battle panels)
- **THEN** the background element uses `bg-game-combat/10` instead of hardcoded `bg-red-50` or `bg-red-500/10`
- **AND** combat text uses `text-game-combat` instead of `text-red-600`

#### Scenario: Domain-specific borders use game tokens
- **WHEN** a component renders a border for domain-specific sections
- **THEN** the border uses `border-game-combat`, `border-game-cultivation`, etc. rather than hardcoded Tailwind palette borders
