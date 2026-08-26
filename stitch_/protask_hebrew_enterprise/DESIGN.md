---
name: ProTask Hebrew Enterprise
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
  on-surface-variant: '#434653'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737784'
  outline-variant: '#c3c6d5'
  surface-tint: '#1d59c1'
  primary: '#003c90'
  on-primary: '#ffffff'
  primary-container: '#0f52ba'
  on-primary-container: '#bcceff'
  inverse-primary: '#b0c6ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#732900'
  on-tertiary: '#ffffff'
  tertiary-container: '#993900'
  on-tertiary-container: '#ffc0a7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001945'
  on-primary-fixed-variant: '#00419c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Assistant
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  display-lg-mobile:
    fontFamily: Assistant
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Assistant
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-base:
    fontFamily: Assistant
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Assistant
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Assistant
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 16px
  gutter: 12px
  card-padding: 20px
  touch-target: 48px
---

## Brand & Style

This design system is engineered for high-stakes corporate environments where clarity, speed, and reliability are paramount. It follows a **Minimalist-Corporate** aesthetic, blending the precision of enterprise software with the approachability of modern mobile-first applications. 

The core personality is "Silent Efficiency." The UI recedes into the background to prioritize user content and task flow. It utilizes a heavy emphasis on whitespace, crisp alignment, and a strict adherence to Right-to-Left (RTL) reading patterns. 

**Key Principles:**
- **RTL-First:** All visual weights and directional cues are mirrored for the Hebrew language.
- **Enterprise Grade:** High legibility and standardized density for complex data management.
- **Mobile-Centric:** Generous touch targets and card-based containers that adapt seamlessly from smartphone to desktop.

## Colors

The palette is anchored by a "Professional Blue" (#0F52BA) to evoke trust and authority. The secondary palette utilizes slate greys to maintain a neutral, non-distracting environment for content consumption.

**Functional Color Logic:**
- **Primary:** Used for main actions (Submit, Create), active navigation states, and primary brand presence.
- **Secondary/Neutral:** Used for backgrounds, borders, and secondary text.
- **Status Semantic Colors:** 
    - **Red (#EF4444):** Reserved exclusively for urgent tasks, overdue deadlines, and critical errors.
    - **Orange (#F59E0B):** Indicates pending items, new notifications, or medium-priority tasks.
    - **Green (#10B981):** Signals completion, success states, and resolved forum threads.

## Typography

The system utilizes **Assistant** (or Heebo as a fallback), a modern Hebrew sans-serif designed for screen legibility. 

**RTL Implementation:**
- **Text Alignment:** All text defaults to `right`. 
- **Line Height:** Increased slightly for Hebrew characters to accommodate diacritics and complex strokes without crowding.
- **Hierarchy:** Headlines use heavier weights (600-700) to create clear sections within dense task lists. Labels are used for metadata like dates and tag counts.

## Layout & Spacing

This design system uses a **Fluid-Fixed Hybrid** model. On mobile, elements utilize a single-column layout with 16px side margins. On desktop, content is contained within a 1280px max-width 12-column grid.

**Spacing Rhythm:**
- A 4px baseline grid ensures vertical consistency.
- **Card-based Layouts:** All tasks and forum posts are housed in cards to provide distinct separation of information.
- **Touch Areas:** All interactive elements (checkboxes, buttons, nav items) maintain a minimum of 48px height for mobile accessibility.

## Elevation & Depth

To maintain a "Clean & Professional" look, the system avoids heavy shadows. Depth is communicated through:

1.  **Low-Contrast Outlines:** Cards use a subtle 1px border (`#E2E8F0`) combined with a very soft, diffused shadow (`0 4px 6px -1px rgb(0 0 0 / 0.05)`).
2.  **Tonal Backgrounds:** The main application background is a soft light grey (`#F8FAFC`), while cards are pure white (`#FFFFFF`) to make them "pop" toward the user.
3.  **Active Elevation:** When a user interacts with a task card, the shadow intensity increases slightly to indicate focus.

## Shapes

The design system uses an "Extra Rounded" profile for containers to soften the corporate atmosphere and make the app feel modern.

- **Cards:** Use `rounded-2xl` (1.5rem / 24px) to create a distinct, friendly container.
- **Buttons & Inputs:** Use `rounded-lg` (0.5rem / 8px) for a more professional, stable feel.
- **Badges/Tags:** Use `rounded-full` (9999px) for a pill-shaped appearance, making them easily distinguishable from other UI elements.

## Components

### Cards
Cards are the primary container. They must include:
- White background with `rounded-2xl`.
- Subtle 1px slate-200 border.
- **Unread State:** A 2px primary-blue vertical bar on the right edge (RTL) or a subtle blue tint background.

### Badges (Tags)
Used for Team, Group, or Role identifiers.
- **Style:** Semi-transparent background (10% opacity) of the text color.
- **Typography:** `label-caps`.
- **Spacing:** Horizontal padding of 8px, vertical 2px.

### Checkboxes
- **Unfinished:** A clean 24px circle with a subtle grey border.
- **Completed:** Filled with Primary Blue or Success Green with a white checkmark.
- **Placement:** Always located on the right side of the task card in RTL.

### Bottom Navigation (Mobile)
- Fixed to the bottom of the viewport.
- 4 to 5 icons maximum.
- Active state indicated by a primary blue color and a small dot indicator below the icon.

### Input Fields
- High-contrast text on a white background.
- Floating labels or clear right-aligned labels.
- Focused state uses a 2px primary blue halo.

### Visual Indicators
- **Unread Forum Post:** A small 8px orange dot positioned to the top-right of the title.
- **Priority Marker:** A vertical colored strip on the right-most edge of the card (Red for high priority).