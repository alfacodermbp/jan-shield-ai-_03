---
name: Jan-Shield AI System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cc'
  surface-tint: '#585e6f'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#151b2a'
  on-primary-container: '#7d8496'
  inverse-primary: '#c0c6da'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001a42'
  on-tertiary-container: '#3980f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f6'
  primary-fixed-dim: '#c0c6da'
  on-primary-fixed: '#151b2a'
  on-primary-fixed-variant: '#404757'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-md:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for high-stakes civic technology, where clarity, authority, and reliability are paramount. The brand personality is "Futuristic but Realistic"—it avoids sci-fi tropes in favor of a hyper-modern, high-performance enterprise aesthetic. It is tailored for government officials and public service operators who require immediate cognitive processing of complex data.

The design style is **Corporate / Modern** with a lean toward **Minimalism**. It utilizes expansive white space, a disciplined color application, and high-precision typography. The emotional response should be one of "calm control"—positioning the AI not as a black box, but as a transparent, powerful tool for public safety and administration. Visuals are grounded in structural integrity, using crisp lines and a systematic approach to density.

## Colors

This color palette is anchored in a "Deep Navy" to project institutional stability and authority. The primary and secondary blues function as action colors, guiding the user through interactive flows and highlighting active states. 

The background uses a subtle "Off-white" to reduce eye strain during long-duration monitoring, while the "Text Primary" provides maximum contrast for legibility. Semantic colors are strictly reserved for status indicators and data alerts; they must never be used for purely decorative purposes. Use "Critical Red" sparingly to ensure it retains its psychological urgency.

## Typography

The design system utilizes **Inter** for all UI elements to ensure a neutral, systematic, and highly utilitarian reading experience. For data-heavy dashboards, use `body-sm` for dense tables and `label-md` (uppercase) for category headers to create clear structural boundaries.

Large headlines (`display-lg`) use tight letter spacing to feel more "engineered" and impactful. On mobile devices, ensure headlines scale down to `headline-lg-mobile` to maintain layout integrity. When displaying system logs or AI-generated IDs, use a monospaced font like **JetBrains Mono** to distinguish technical data from human-readable content.

## Layout & Spacing

The layout is based on a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The system uses an 8px rhythmic scale, with 4px increments for micro-adjustments in component internals (e.g., checkbox alignment).

- **Desktop:** 12 columns, 24px gutters, 32px side margins. 
- **Tablet:** 8 columns, 16px gutters, 24px side margins.
- **Mobile:** 4 columns, 16px gutters, 16px side margins.

Content density should be managed dynamically. In "Dashboard View," use `sm` (8px) and `md` (16px) spacing to maximize information density. In "Settings" or "Content Creation" views, use `lg` (24px) and `xl` (32px) to provide a more focused, less overwhelming experience.

## Elevation & Depth

Visual hierarchy is established primarily through **Tonal Layers** and **Low-contrast Outlines**. Surfaces should feel integrated into the background rather than floating high above it.

1.  **Level 0 (Background):** #F8FAFC (Off-white).
2.  **Level 1 (Cards/Containers):** White (#FFFFFF) with a 1px border of #E2E8F0. No shadow or a very faint 2px blur shadow (alpha 0.04).
3.  **Level 2 (Popovers/Dropdowns):** White (#FFFFFF) with a 1px border of #CBD5E1 and a medium-diffused shadow (Y: 4px, Blur: 12px, Alpha: 0.08).
4.  **Level 3 (Modals):** White (#FFFFFF) with a heavy-diffused shadow (Y: 10px, Blur: 30px, Alpha: 0.12) and a backdrop blur of 8px on the layer below.

Shadows should never be pure black; they are tinted with the Primary Deep Navy (#0B1220) to maintain a cohesive, high-end feel.

## Shapes

The shape language is **Soft (Level 1)**, utilizing a 0.25rem (4px) base radius. This provides a professional, geometric look that feels precise and technical without being sharp or aggressive.

- **Standard Elements (Inputs, Buttons):** 4px (0.25rem).
- **Cards & Larger Containers:** 8px (0.5rem).
- **Badges & Tags:** 12px (0.75rem) to provide a subtle "pill" contrast against rectangular data cells.
- **Avatars:** Circular (999px) to distinguish human entities from system data.

## Components

### Buttons
- **Primary:** Solid Deep Navy (#0B1220) with white text. High-contrast, sharp, and authoritative.
- **Secondary:** Outlined with 1px #CBD5E1 and Primary Blue (#2563EB) text.
- **Ghost:** No background/border, used for low-priority actions in toolbars.

### Input Fields
- Use a 1px border (#E2E8F0) that transitions to Primary Blue (#2563EB) on focus.
- Labels must be `label-md` and positioned consistently above the input.
- Error states utilize a 1px border of Critical Red (#DC2626) with a small helper icon.

### Cards
- White background, 1px #E2E8F0 border, 8px corner radius.
- Headers within cards should have a subtle bottom border to separate controls from content.

### Data Visualizations
- Use a consistent stroke width of 2px for line charts.
- Use the semantic palette (Red, Orange, Amber, Green) only for charts representing risk or health. 
- For multi-series data without semantic meaning, use a rotating palette of Primary Blue, Secondary Blue, and Deep Navy tints.

### Priority Badges
- Small, uppercase labels with a light background tint (10% opacity) of the semantic color and a dark solid text of the same color. For example, a "High" badge uses #EA580C at 10% opacity for the background and solid #EA580C for the text.

### Iconography
- Use **Lucide** style icons: 24px bounding box, 2px stroke width, rounded ends.
- Icons should be monochromatic (Deep Navy) unless indicating a specific semantic state.