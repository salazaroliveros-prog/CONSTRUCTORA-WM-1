---
name: Architectural Excellence
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#44474d'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#4f5f7b'
  primary: '#04162e'
  on-primary: '#ffffff'
  primary-container: '#1a2b44'
  on-primary-container: '#8292b0'
  inverse-primary: '#b6c7e7'
  secondary: '#555f6e'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f2'
  on-secondary-container: '#596373'
  tertiary: '#1f1400'
  on-tertiary: '#ffffff'
  tertiary-container: '#392700'
  on-tertiary-container: '#af8c47'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b6c7e7'
  on-primary-fixed: '#091c34'
  on-primary-fixed-variant: '#374762'
  secondary-fixed: '#d9e3f5'
  secondary-fixed-dim: '#bdc7d9'
  on-secondary-fixed: '#121c29'
  on-secondary-fixed-variant: '#3e4756'
  tertiary-fixed: '#ffdea5'
  tertiary-fixed-dim: '#e9c176'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4201'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  h1:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-label:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  gutter: 24px
  section-gap: 64px
  data-tight: 4px
---

## Brand & Style

The visual identity of the design system is rooted in the principles of structural integrity, precision, and longevity. Designed for **CONSTRUCTORA WM/M&S**, the aesthetic reflects the firm’s slogan, "Edificando el Futuro," by balancing heavy-industry reliability with high-end architectural sophistication.

The UI style follows a **Corporate Modern** approach. It utilizes a rigorous grid-based layout to mirror architectural blueprints, ensuring that complex data—such as project timelines, budget KPIs, and structural analytics—is presented with absolute clarity. The atmosphere is professional and authoritative, evoking a sense of trust and "top-tier" craftsmanship through generous whitespace and meticulous alignment.

## Colors

The palette is anchored by **Midnight Navy**, providing a foundation of stability and corporate depth. **Slate Grey** acts as a structural secondary tone, reminiscent of concrete and steel, used primarily for secondary UI elements and borders.

For highlights, this design system employs a dual-accent strategy:
*   **Architectural Gold:** Used for high-end brand moments, luxury project headings, and premium status indicators.
*   **Construction Orange:** Reserved for high-visibility "action" items, safety alerts, and critical data points within charts to provide a functional nod to the construction site.

Backgrounds remain primarily off-white to maintain a clean "blueprint" feel, while subtle cool-grey washes differentiate sections in data-heavy reports.

## Typography

This design system utilizes **Inter** for its systematic, neutral, and highly legible characteristics, making it ideal for technical documentation and corporate interfaces. To complement this, **Work Sans** is introduced for labels and technical data, providing a slightly more grounded, industrial feel for numerical values and KPIs.

Headlines feature tight tracking and bold weights to convey strength. Body text is optimized with generous line heights to ensure readability in long-form construction contracts and technical reports. Data labels are intentionally set in uppercase with increased letter spacing to mimic architectural notations.

## Layout & Spacing

The layout is built on a **12-column fixed grid** for desktop dashboards and reports, ensuring a disciplined alignment of data widgets and text blocks. A baseline grid of 8px dictates all internal spacing, creating a rhythmic and predictable flow.

For report headers and professional documentation, the design system utilizes a "Golden Ratio" distribution, where the primary content occupies 62% of the horizontal space, leaving the remainder for contextual metadata or KPIs. Tables and data visualizations use a "data-tight" 4px unit for internal cell padding to maximize information density without sacrificing clarity.

## Elevation & Depth

To maintain a "High-End Corporate" feel, depth is achieved through **low-contrast outlines** and **ambient shadows**. Instead of heavy dropshadows, the design system uses subtle 1px borders in Slate Grey (#D1D5DB) for containers.

Elevation levels:
1.  **Flat:** Used for the main canvas background.
2.  **Raised:** Cards and data modules feature a soft, diffused shadow (0px 4px 20px rgba(26, 43, 68, 0.05)) to separate them from the background.
3.  **Overlay:** Modals and dropdowns use a slightly more defined shadow and a subtle backdrop blur to maintain focus during high-level decision-making.

Data visualizations avoid depth entirely, remaining flat to ensure precision in reading charts and graphs.

## Shapes

The shape language is **Soft (0.25rem)**, leaning towards the "Sharp" end of the spectrum to reinforce the architectural theme. Crisp corners signify precision and engineering excellence.

Large container elements, such as project cards or report sections, may use `rounded-lg` (0.5rem) to provide a modern touch, but interactive elements like input fields and buttons remain strictly "Soft" to maintain a serious, professional tone. Circular shapes are used exclusively for user avatars or specific status pips to contrast against the dominant rectangular geometry.

## Components

### Report Header (Letterhead Style)
The header for reports is designed for formal presentation. It features the "CONSTRUCTORA WM/M&S" logo on the left, balanced by a vertical Slate Grey divider. To the right, project metadata (Project ID, Date, Lead Architect) is displayed using the `data-label` typography style. A thick 3px Navy Blue bottom border provides a "heavy" structural base to the header.

### Buttons & Inputs
*   **Primary Action:** Solid Navy Blue with white text. High-contrast and authoritative.
*   **Secondary Action:** Ghost style with a Slate Grey border.
*   **KPI Highlight:** Gold background with Navy text for "Total Budget" or "Project Value" highlights.
*   **Inputs:** Clean borders with a 2px Navy focus ring. Labels are always positioned above the field in `data-label` style.

### Data Visualization
Charts should use a custom palette derived from the brand colors: Navy (Primary), Slate (Secondary), and Orange (Trend/Attention). Grid lines in charts must be faint (5% opacity Navy) to keep the focus on the data points.

### Cards
Cards are the primary container for project summaries. They feature a 1px border, no background color (transparent), and a subtle `Raised` elevation effect on hover to indicate interactivity.