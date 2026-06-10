# Mod Styles (Delta)

## MODIFIED Requirements

### Requirement: Mod SHALL declare CSS files in dataFiles.styles

A Mod providing styles MUST declare its CSS file path(s) in the `dataFiles` field of `mod.json` using the key `"styles"`. The value MAY be a single string path (single CSS file, backward compatible) or an array of strings (multiple CSS files loaded in order).

#### Scenario: Mod declares a single CSS file
- **WHEN** a Mod's `mod.json` contains `"dataFiles": { "styles": "styles/theme.css" }`
- **THEN** the StyleLoader fetches and injects `{modDir}/styles/theme.css`

#### Scenario: Mod declares multiple CSS files via array
- **WHEN** a Mod's `mod.json` contains `"dataFiles": { "styles": ["styles/theme.css", "styles/animations.css"] }`
- **THEN** the StyleLoader fetches and injects both CSS files in array order
- **AND** each file produces a separate `<style data-mod="<modId>">` element
- **AND** `theme.css` is injected before `animations.css` in `<head>`
