# UI Theme Compliance

## Purpose

确保 `src/shared/ui/` 中所有自定义 UI 组件严格使用语义化 CSS 变量表达颜色、
统一样式属性，与全局主题系统保持一致。

## Requirements

### Requirement: Custom UI components SHALL use semantic theme tokens for all colors

All custom UI components in `src/shared/ui/` MUST use only semantic CSS variable-based Tailwind classes for colors. Hardcoded Tailwind native color palette classes (e.g., `bg-amber-500`, `text-blue-600`, `border-red-300`, `bg-cyan-100`, `text-sky-700`, `bg-gray-200`) are forbidden. Acceptable classes include `bg-primary`, `text-muted-foreground`, `bg-quality-rare/10`, `border-border`, `bg-popover`, `text-popover-foreground`等。

#### Scenario: item-tooltip uses zero hardcoded palette colors
- **WHEN** inspecting `src/shared/ui/item-tooltip.tsx` and any files it is split into
- **THEN** zero occurrences of `bg-amber-*`, `text-amber-*`, `border-amber-*`, `bg-blue-*`, `bg-purple-*`, `bg-red-*`, `bg-orange-*`, `bg-green-*`, `bg-cyan-*`, `bg-sky-*`, `bg-gray-*` classes are present
- **AND** all color classes reference semantic tokens (`primary`, `secondary`, `muted`, `accent`, `quality-*`, `background`, `foreground`, `border`, `card`, `popover`, `destructive`)

#### Scenario: All 9 custom components pass color audit
- **WHEN** running `grep` for hardcoded Tailwind native color palette classes across `src/shared/ui/` custom components (button-group, cooldown-button, empty, field, input-group, item, item-tooltip, kbd, spinner)
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

Each custom component's root rendered element MUST include a `data-slot` attribute identifying the component for debugging and CSS selection hooks.

#### Scenario: All custom component roots have data-slot
- **WHEN** inspecting the 3 currently-missing components (cooldown-button, spinner, item-tooltip)
- **THEN** each root rendered element has a `data-slot` attribute matching the component name (e.g., `data-slot="cooldown-button"`)

### Requirement: item-tooltip.tsx SHALL be split to comply with 300-line component limit

The `item-tooltip.tsx` file (currently 475 lines) MUST be split into multiple files so that no single component file exceeds 300 lines.

#### Scenario: item-tooltip.tsx is under 300 lines after split
- **WHEN** running `pnpm check-sizes`
- **THEN** `item-tooltip.tsx` and any new files it was split into each report ≤300 lines
- **AND** all existing exports (`ItemTooltip`, `UpgradeableItemTooltip`, `EmptySlotCard`, `BackpackHeader`, `EmptyBackpackHint`, `RARITY_STYLES`, `getRarityStyle`) remain importable from their original or documented new paths

#### Scenario: Rarity config is extracted to shared/utils
- **WHEN** checking the rarity styles location
- **THEN** `RARITY_STYLES` and `getRarityStyle` are in `src/shared/utils/` (e.g., `rarityStyles.ts`)
- **AND** `item-tooltip.tsx` imports them from the new location
