# PitchLab Riso Design System

This document outlines the "Riso" design language used in PitchLab. The aesthetic is inspired by Risograph printing: imperfect alignment, overlaying transparent inks, grainy paper textures, and bold, limited palettes.

## 1. Core Principles

-   **Ink Interactions**: Colors should feel like semi-transparent inks on paper. Darker colors on top of lighter ones multiply.
-   **Imperfect Registration**: Elements don't need to align perfectly. Shadows are hard offsets. Hover states shift position physically.
-   **Tactile Texture**: Everything sits on a grainy paper background.
-   **High Contrast**: Deep ink black text on off-white paper for maximum readability.

## 2. Color Palette (Inks)

We use a limited set of named "Inks".

| Name | Hex | Usage |
| :--- | :--- | :--- |
| **Ink Black** | `#2a2a2a` | Primary text, borders, structural lines. Never pure black. |
| **Ink Coral** | `#ff99a0` | Primary accent, pitch highs, errors. |
| **Ink Cornflower** | `#82a8e5` | Secondary accent, pitch lows, buttons, shadows. |
| **Ink Mint** | `#99e6c9` | Success states, highlights, selection backgrounds. |
| **Ink Sunflower** | `#ffc850` | Warnings, badges, decorative elements. |

## 3. Paper

| Name | Hex | Usage |
| :--- | :--- | :--- |
| **Paper White** | `#f9f8f2` | Main page background. Warm, off-white. |
| **Paper Off** | `#efefe5` | Card backgrounds, secondary areas. |

## 4. Typography

-   **Headings**: `Zen Kaku Gothic New` (Sans-serif). Bold, geometric but human.
-   **UI & Data**: `JetBrains Mono` (Monospace). Used for phonetic data, buttons, and technical labels.

## 5. Components & Tokens

### Shadows & Borders
-   **Border**: `2px solid theme('colors.ink.black')`
-   **Radius**: `rounded-riso` (12px) or `rounded-riso-lg` (18px).
-   **Shadow**: `shadow-riso` (4px 4px 0 cornflower-55).
-   **Hover Shadow**: `shadow-riso-hover` (6px 6px 0 cornflower-65).

### Common Utility Classes
-   `.riso-card`: Standard container with border, shadow, and off-white background.
-   `.riso-button`: Interactive button with physical press effect (translate + shadow shift).
-   `.paper-texture`: Fixed overlay adding SVG noise.
-   `.riso-gradient`: Subtle background radial gradients mimicking ink spots.

## 6. Usage Examples

### Card
```tsx
<div className="riso-card">
  <h2 className="font-sans font-bold text-ink-black">Title</h2>
  <p className="font-mono text-sm text-ink-black/70">Content</p>
</div>
```

### Button
```tsx
<button className="riso-button">
  Analyze
</button>
```
