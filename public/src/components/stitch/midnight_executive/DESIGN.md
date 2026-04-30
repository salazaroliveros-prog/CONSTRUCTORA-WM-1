---
name: Midnight Executive
colors:
  surface: '#111415'
  surface-dim: '#111415'
  surface-bright: '#373a3b'
  surface-container-lowest: '#0c0f10'
  surface-container-low: '#191c1d'
  surface-container: '#1d2021'
  surface-container-high: '#282a2b'
  surface-container-highest: '#323536'
  on-surface: '#e1e3e4'
  on-surface-variant: '#c5c6ce'
  inverse-surface: '#e1e3e4'
  inverse-on-surface: '#2e3132'
  outline: '#8e9098'
  outline-variant: '#44474d'
  surface-tint: '#b6c7e7'
  primary: '#b6c7e7'
  on-primary: '#20314a'
  primary-container: '#1a2b44'
  on-primary-container: '#8292b0'
  inverse-primary: '#4f5f7b'
  secondary: '#bdc7d9'
  on-secondary: '#27313f'
  secondary-container: '#3e4756'
  on-secondary-container: '#acb6c7'
  tertiary: '#e9c176'
  on-tertiary: '#412d00'
  tertiary-container: '#392700'
  on-tertiary-container: '#af8c47'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
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
  background: '#111415'
  on-background: '#e1e3e4'
  surface-variant: '#323536'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin: 24px
---

# Design System: Midnight Executive

## Brand & Style
The brand identity has transitioned from a high-energy, vibrant aesthetic to a sophisticated, "Midnight Executive" persona. The target audience is professional, value-driven users who require a focused, high-trust environment. 

The design style is **Corporate / Modern** with a lean toward **Minimalism**. It emphasizes reliability and depth through a dark-mode-first approach. By utilizing a deep navy foundation and gold accents, the UI evokes feelings of stability, premium quality, and institutional intelligence.

## Colors
The palette is built on a dark mode foundation designed for reduced eye strain and high visual hierarchy.

*   **Primary (#1A2B44):** A deep Midnight Navy used for core structural elements and high-level branding.
*   **Secondary (#707A8A):** A Slate Grey used for supporting UI elements, inactive states, and iconography.
*   **Tertiary (#C5A059):** A Muted Gold/Brass used sparingly for calls to action, highlights, and "premium" touchpoints.
*   **Neutral (#F8F9FA):** A Crisp White/Grey used for high-contrast text and surface definitions against the dark background.

## Typography
The system uses a dual-typeface approach to balance technical precision with modern readability.

*   **Headlines & Body (Inter):** A highly legible sans-serif that provides a neutral, professional tone across all interface scales. Headlines utilize heavier weights (600-700) to stand out against the dark canvas.
*   **Labels (Work Sans):** Used for micro-copy, navigation, and UI metadata. The slightly wider proportions of Work Sans improve glanceability in dense functional areas.

## Layout & Spacing
The layout follows a **Fluid Grid** model based on an 8px spatial rhythm.

*   **Rhythm:** Spacing increments (8, 16, 24, 48) ensure consistent vertical and horizontal pacing.
*   **Grid:** A standard 12-column grid is used for desktop views with 16px gutters to maintain clear separation between content blocks.
*   **Margins:** Generous 24px outer margins prevent content from feeling cramped against the screen edges, reinforcing the minimalist aesthetic.

## Elevation & Depth
In this dark-mode-centric system, depth is conveyed through **Tonal Layers** rather than heavy shadows.

*   **Surfaces:** Higher elevation levels are represented by lighter shades of the primary navy (#1A2B44), creating a "stacked" effect where the most interactive elements appear closest to the user.
*   **Accents:** Subtle 1px inner borders (low-contrast outlines) are preferred over drop shadows to define card boundaries and button states.

## Shapes
The shape language is **Soft**, utilizing subtle corner rounding to humanize the professional aesthetic.

*   **Standard Radius:** 0.25rem (4px) for small components like buttons and input fields.
*   **Container Radius:** 0.5rem (8px) for larger blocks like cards and modals.

This subtle rounding provides a modern feel without sacrificing the structured, corporate precision of the brand.

## Components
Consistent application of the style across core elements:

*   **Buttons:** Primary buttons use the Tertiary Gold (#C5A059) with dark text for maximum contrast. Secondary buttons use ghost styles with Slate Grey (#707A8A) outlines.
*   **Inputs:** Dark backgrounds with a 1px border. Focus states transition the border to the Tertiary Gold.
*   **Cards:** Use a slightly lightened version of the Primary Navy to pull forward from the background, with 8px rounded corners.
*   **Chips/Labels:** Utilize Work Sans for clear identification, with low-saturation backgrounds to remain secondary to primary actions.