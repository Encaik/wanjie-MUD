# UI Cultivation Aesthetic

## Purpose

确保 `src/shared/ui/` 自定义组件具有修仙题材的视觉识别，
通过古典中式装饰元素、主题化动画和题材匹配的视觉隐喻，
消除通用 SaaS/shadcn 模板的"AI 生成感"。

## Requirements

### Requirement: Cooldown button SHALL use cultivation-themed visual feedback

The `CooldownButton` component (located at `src/shared/components/CooldownButton.tsx`) SHALL use a cultivation-genre visual metaphor for its cooldown indication.

#### Scenario: Cooldown shows cultivation-themed overlay
- **WHEN** a CooldownButton is in cooldown state
- **THEN** the visual overlay does NOT use `bg-black/60` dark rectangle
- **AND** the overlay uses a cultivation-themed visual (e.g., `bg-gradient-to-t from-primary/30 to-transparent` ink-wash fade)

#### Scenario: Cooldown timer text uses serif font
- **WHEN** the cooldown countdown text is displayed (e.g., "3.2s")
- **THEN** the text uses `font-serif` class
- **AND** the text remains readable against the themed overlay at all progress levels

#### Scenario: Cooldown button root has data-slot
- **WHEN** a CooldownButton is rendered
- **THEN** the root element includes `data-slot="cooldown-button"`

### Requirement: Spinner SHALL support a cultivation-themed loading variant

The `Spinner` component SHALL provide an optional `variant` prop with a cultivation-themed option.

#### Scenario: Default spinner unchanged
- **WHEN** Spinner is rendered without a `variant` prop or with `variant="default"`
- **THEN** the standard `Loader2Icon` with `animate-spin` is displayed as before

#### Scenario: Cultivation variant displays qi-orb animation
- **WHEN** Spinner is rendered with `variant="cultivation"`
- **THEN** a CSS-only dual-ring qi-orb animation is displayed (outer ring `border-primary/30`, inner ring `border-t-primary animate-spin`)
- **AND** the animation uses only Tailwind CSS classes — no new JS dependencies

#### Scenario: Both spinner variants have data-slot
- **WHEN** Spinner is rendered with any variant
- **THEN** the root element includes `data-slot="spinner"`

### Requirement: Item tooltip SHALL include subtle cultivation-genre decorative elements

The `ItemTooltip` and `UpgradeableItemTooltip` components SHALL include subtle decorative elements that evoke the cultivation genre without reducing readability.

#### Scenario: Tooltip has classical border styling
- **WHEN** an item tooltip content is rendered
- **THEN** the tooltip uses `bg-popover text-popover-foreground border-2 border-border shadow-lg` instead of hardcoded `bg-amber-50 border-amber-300`
- **AND** the decoration does not obscure text content

#### Scenario: Rarity badge uses quality colors with serif font
- **WHEN** an item's rarity badge is rendered
- **THEN** the badge uses `font-serif` and the correct `quality-*` color class
- **AND** the badge text (e.g., "史诗", "传说") is clearly readable

#### Scenario: Stat separators use gradient dividers
- **WHEN** a stats section is rendered inside a tooltip
- **THEN** the separator between sections uses `bg-gradient-to-r from-transparent via-border to-transparent h-px` instead of plain `border-t border-amber-200`

### Requirement: Empty state SHALL support cultivation-themed presentation

The `Empty` component family (located at `src/shared/ui/feedback/empty.tsx`) SHALL use cultivation-appropriate colors and fonts.

#### Scenario: EmptyMedia icon variant uses thematic colors
- **WHEN** `EmptyMedia` is rendered with `variant="icon"`
- **THEN** the icon container uses `bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground` instead of `bg-muted text-foreground`

#### Scenario: Empty state text uses serif font
- **WHEN** an empty state title or description is rendered
- **THEN** the text elements use `font-serif` class

### Requirement: EmptySlotCard and related SHALL maintain game aesthetic after migration to feedback/

The `EmptySlotCard`, `BackpackHeader`, and `EmptyBackpackHint` components (at `src/shared/ui/feedback/` after migration from `empty-slot.tsx`) SHALL maintain cultivation-appropriate styling.

#### Scenario: EmptySlotCard uses semantic border and muted colors
- **WHEN** `EmptySlotCard` is rendered
- **THEN** it uses `border-border bg-muted/30 text-muted-foreground` and `font-serif` on text

#### Scenario: BackpackHeader uses muted foreground
- **WHEN** `BackpackHeader` is rendered
- **THEN** it uses `text-muted-foreground` and `font-serif` on text

### Requirement: Module components using game aesthetic colors SHALL use game domain semantic tokens

Module-level components that previously defined their own domain color mappings (e.g., `MessagePanel.tsx`'s `rarityColors`, `CultivationPanel.tsx`'s `getPathColor`) SHALL use `game-*` semantic tokens or reference `modules/theme/data/rarityStyles.ts` instead.

#### Scenario: CultivationPanel path colors use game domain tokens
- **WHEN** inspecting `CultivationPanel.tsx`'s `getPathColor` function
- **THEN** color values reference `game-*` or `quality-*` tokens instead of hardcoded Tailwind palette classes
- **AND** the overall visual appearance is preserved

#### Scenario: MessagePanel rarity badge uses rarityStyles
- **WHEN** inspecting `MessagePanel.tsx`
- **THEN** the `rarityColors` local mapping is removed
- **AND** rarity badge colors come from `getRarityStyle()` in `modules/theme/data/rarityStyles.ts`

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
