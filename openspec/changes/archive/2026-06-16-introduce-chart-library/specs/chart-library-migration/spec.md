## MODIFIED Requirements

### Requirement: RadarChart SHALL use recharts RadarChart with shadcn ChartContainer

`src/shared/components/RadarChart.tsx` SHALL render radar charts using recharts `<RadarChart>` + shadcn `ChartContainer` instead of hand-written SVG elements (`<polygon>`, `<line>`, `<circle>`). The component SHALL maintain the same public interface (`RadarAxis`, `RadarSeries`, `RadarChartProps`).

#### Scenario: RadarChart uses recharts and ChartContainer internally

- **WHEN** inspecting `src/shared/components/RadarChart.tsx`
- **THEN** it imports from `recharts` (`RadarChart`, `PolarGrid`, `PolarAngleAxis`, `Radar`)
- **AND** it imports `ChartContainer` from `@/shared/ui/data-display/chart`
- **AND** it does NOT contain hand-written SVG polygon, line, or circle elements
- **AND** the `RadarAxis`, `RadarSeries`, `RadarChartProps` exports remain unchanged

#### Scenario: CharacterCard radar charts render correctly

- **WHEN** rendering the character selection page (`/character-select`)
- **THEN** each `CharacterCard` displays two radar charts (经脉资质 + 核心值)
- **AND** the radar charts show colored data polygons with grid lines
- **AND** the axis labels display the attribute names
- **AND** the charts are visually more polished than the previous hand-written SVG version

#### Scenario: Radar chart provides entrance animation

- **WHEN** a radar chart first renders
- **THEN** the data polygon animates in with a gradual fill effect (duration ~800ms)
- **AND** multiple series animate with staggered `animationBegin` offsets

#### Scenario: Radar chart tooltip on hover

- **WHEN** hovering over a data point or data area on the radar chart
- **THEN** a tooltip appears showing the axis label and raw value
- **AND** the tooltip uses the shadcn ChartTooltipContent styling (dot indicator, border, shadow)

#### Scenario: Radar chart adapts to dark/light theme

- **WHEN** switching between light and dark mode
- **THEN** the radar chart grid lines, labels, and tooltip colors update accordingly
- **AND** the CSS variables from ChartContainer (`--color-*`) control the color scheme

#### Scenario: Radar chart accessibility

- **WHEN** inspecting the rendered radar chart
- **THEN** the SVG has a `role="img"` attribute or equivalent accessibility markup
- **AND** the axis labels are readable by screen readers

### Requirement: StatisticsPanel SHALL use shared Progress component

The inline `ProgressBar` function in `src/modules/collection/components/StatisticsPanel.tsx` SHALL be deleted. All progress display in `StatisticsPanel` SHALL use the `Progress` component from `@/shared/ui/feedback/progress`.

#### Scenario: No inline ProgressBar in StatisticsPanel

- **WHEN** inspecting `src/modules/collection/components/StatisticsPanel.tsx`
- **THEN** there is NO local `ProgressBar` function definition
- **AND** the file imports `Progress` from `@/shared/ui/feedback/progress`

#### Scenario: Achievement progress renders with shared Progress

- **WHEN** viewing the statistics panel with achievement data
- **THEN** the achievement claim progress bar renders using the Radix UI `Progress` component
- **AND** the label and count display (`claimed/unlocked`) remain unchanged
- **AND** the progress indicator animates with the Radix UI CSS transition

## REMOVED Requirements

### Requirement: Hand-written SVG radar chart rendering

The previous implementation that manually computed polygon points, line coordinates, and circle positions using trigonometric functions SHALL be removed. The custom hover "hot zone" polygon (`strokeWidth={18}`, `fillOpacity={0}`) SHALL be removed.

#### Scenario: No hand-written SVG in RadarChart

- **WHEN** inspecting `src/shared/components/RadarChart.tsx`
- **THEN** there are NO calls to `Math.sin()` or `Math.cos()` for computing chart coordinates
- **THEN** there are NO `<polygon>` elements for data or grid rendering
- **THEN** there is NO transparent hover hot-zone polygon

### Requirement: Inline ProgressBar in StatisticsPanel

The local `ProgressBar` component defined inside `StatisticsPanel.tsx` SHALL be removed entirely.

#### Scenario: No duplicate progress implementation

- **WHEN** running `grep -r "function ProgressBar" src/`
- **THEN** zero results are returned outside of `shared/ui/feedback/progress.tsx`
