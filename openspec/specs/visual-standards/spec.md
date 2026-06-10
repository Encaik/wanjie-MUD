# Visual Standards

## Purpose

定义万界修行录游戏 UI 的视觉标准规范，涵盖间距系统、颜色使用、交互状态、空状态、响应式布局、中文排版、加载状态和动画一致性。确保所有游戏组件提供一致、可读、响应式的视觉体验。

## Requirements

### Requirement: Unified spacing system
All game UI components SHALL use Tailwind CSS spacing scale (e.g., `gap-2`, `p-4`, `m-6`) consistently. Custom pixel values in className SHALL be avoided in favor of the closest Tailwind spacing token.

#### Scenario: Consistent panel padding
- **WHEN** any game panel or card component renders
- **THEN** its internal padding, gap, and margin values SHALL use Tailwind spacing tokens only

#### Scenario: No mixed spacing
- **WHEN** code review scans component classNames
- **THEN** no component SHALL mix arbitrary pixel values (e.g., `p-[13px]`) with standard Tailwind tokens without documented justification

### Requirement: Semantic color usage
All game UI components SHALL use Tailwind semantic color tokens (e.g., `text-foreground`, `bg-card`, `border-border`) or project-defined CSS variables. Bare hex/rgb color values in className SHALL be avoided.

#### Scenario: Text readability
- **WHEN** any text element renders
- **THEN** its color SHALL have sufficient contrast against its background in both light and dark themes

#### Scenario: Component coloring
- **WHEN** a component uses background or border colors
- **THEN** it SHALL use semantic tokens to ensure dark mode compatibility

### Requirement: Interactive state feedback
All interactive elements (buttons, links, selectable cards) SHALL provide visual feedback for hover, focus, active, and disabled states.

#### Scenario: Button states
- **WHEN** a button is hovered, focused, pressed, or disabled
- **THEN** the user SHALL see a distinct visual change for each state

#### Scenario: Selectable cards
- **WHEN** a card or panel is clickable/selectable
- **THEN** it SHALL show hover highlight and active press feedback

### Requirement: Empty state display
All list-based or data-driven game panels SHALL display a meaningful empty state when no data exists, rather than rendering blank or broken UI.

#### Scenario: Empty inventory
- **WHEN** a player's inventory is empty
- **THEN** the inventory panel SHALL show a descriptive empty state with appropriate iconography and text

#### Scenario: Empty achievement list
- **WHEN** no achievements are unlocked
- **THEN** the achievement panel SHALL display a placeholder message indicating how to earn achievements

### Requirement: Responsive layout
All game UI components SHALL adapt to mobile viewport sizes using Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). Desktop-sidebar layouts SHALL collapse appropriately on narrow screens.

#### Scenario: Mobile sidebar collapse
- **WHEN** the viewport width is below the `md` breakpoint
- **THEN** sidebars SHALL collapse or transform to a bottom-sheet / hamburger menu pattern

#### Scenario: Mobile panel stacking
- **WHEN** the viewport width is below the `md` breakpoint
- **THEN** multi-column panels SHALL stack vertically without horizontal overflow

### Requirement: Chinese typography optimization
All Chinese text content SHALL use appropriate typography settings: `leading-relaxed` for body text, `font-bold tracking-wide` for headings, and `text-base` as minimum readable size.

#### Scenario: Body text readability
- **WHEN** Chinese body text renders in any game panel
- **THEN** it SHALL use `leading-relaxed` or equivalent line-height for readability

#### Scenario: Heading hierarchy
- **WHEN** section headings render in game panels
- **THEN** they SHALL use consistent font-weight and tracking across the same heading level

### Requirement: Loading state visibility
All panels that depend on async data SHALL display a loading indicator (skeleton or spinner) while data is being fetched.

#### Scenario: Data loading
- **WHEN** a panel's data is being fetched asynchronously
- **THEN** the panel SHALL show a loading skeleton or spinner instead of blank content

### Requirement: Animation consistency
Transitions and animations across game components SHALL use consistent duration and easing values. Sudden layout shifts without transition SHALL be avoided.

#### Scenario: Panel transitions
- **WHEN** a panel appears, disappears, or changes state
- **THEN** the transition SHALL use a duration between 150ms and 300ms with a consistent easing function
