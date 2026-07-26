# OneConvert — Engineering & Business Handbook
## Volume 3: UI & Design System
## Chapter 11 — Design Tokens, Theme System & Adobe Scan Mobile Aesthetics

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Volume 1 (Business Strategy), Volume 2 (Product Requirements — All 92 Features)

---

## 11.0 Scope & Design Philosophy

This chapter defines the core **Design System, Design Tokens, Theme Engine, and Visual Aesthetics** for OneConvert across mobile (Android & iOS) and Flutter Web. 

Per user directive, OneConvert's primary visual language and interaction model is heavily inspired by **Adobe Scan's premium mobile design language** — characterized by:
1. **Focus-First Viewfinder Surface:** Minimalist full-screen live camera viewfinder with high-contrast, electric-cyan dynamic edge overlays.
2. **Deep Slate & Glassmorphic Dark UI:** Deep slate/charcoal backgrounds (#0B0E14, #121824) paired with frosted glass (ackdrop-filter: blur(16px)), vibrant electric blue primary accents (#0066FF), and crisp white typography.
3. **Frictionless Camera-to-Review Lifecycle:** Continuous multi-page capture with immediate visual thumbnail stack buildup in the bottom-right corner, followed by a fluid transition into the Document Review & Enhancement Suite.
4. **Contextual Bottom Action Strips:** Single-tap access to Filter Modes (Magic Color, B&W, Greyscale), Crop Adjustments, Page Reordering, and PDF Export via thumb-friendly bottom toolbars.

---

## 11.1 Design Tokens Taxonomy

Design tokens define the single source of truth for all visual values across Flutter Mobile/Web and Web Prototypes.

### 11.1.1 Color System (Adobe Scan Mobile Palette)

`scss
// Primary Brand & Accent
-brand-primary:      #0066FF; // Adobe Scan-inspired Electric Blue
-brand-accent:       #00F0FF; // Cyber Cyan (Edge Overlay & Active Handles)
-brand-success:      #10B981; // Emerald Green (Capture Confirmation)
-brand-warning:      #F59E0B; // Amber (Hold Steady / Blur Alert)
-brand-danger:       #EF4444; // Crimson (Delete Page / Error)

// Surface & Backgrounds (Dark Mode Default)
-bg-camera:          #000000; // Pitch Black Viewfinder
-bg-base:            #090D16; // Deep Ocean Slate
-bg-card:            #121824; // Elevated Container Slate
-bg-glass:           rgba(18, 24, 36, 0.75); // Frosted Glass
-border-glass:        rgba(255, 255, 255, 0.12);

// Surface & Backgrounds (Light Mode)
-light-bg-base:      #F8FAFC; // Soft Slate Light
-light-bg-card:      #FFFFFF; // Pure White Card
-light-border:       #E2E8F0;

// Neutral Typography & Icons
-text-primary:       #F8FAFC; // 98% White
-text-secondary:     #94A3B8; // Muted Slate Blue
-text-tertiary:      #64748B; // Dark Muted Text
`

### 11.1.2 Typography System (Inter / Roboto Spec)

`scss
-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

// Font Scales
-size-display:   28px;  // Line height 34px, Weight 700
-size-h1:        22px;  // Line height 28px, Weight 700
-size-h2:        18px;  // Line height 24px, Weight 600
-size-body-lg:   16px;  // Line height 22px, Weight 500
-size-body:      14px;  // Line height 20px, Weight 400
-size-caption:   12px;  // Line height 16px, Weight 500
-size-badge:     10px;  // Line height 12px, Weight 700
`

### 11.1.3 Elevation, Radii & Motion

`scss
// Radii
-sm:   8px;
-md:   14px;
-lg:   20px;
-full: 9999px; // Floating Buttons & Badges

// Shadows & Glows
-glass:        0 8px 32px 0 rgba(0, 0, 0, 0.37);
-edge-overlay:   0 0 12px rgba(0, 240, 255, 0.6);
-button:         0 4px 20px rgba(0, 102, 255, 0.4);

// Animation Timing
-fast:   150ms;
-normal: 250ms;
-slow:   400ms;
-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1);
-smooth:   cubic-bezier(0.4, 0.0, 0.2, 1);
`

---

## 11.2 Theme Engine Architecture

The Theme Engine provides automatic switching between **Dark Glassmorphic Theme** (default scanner surface) and **Clean Light Mode** (optional reader/library view).

`
Theme Engine Architecture
├── Tokens (Colors, Type, Radii, Elevation)
├── Theme Provider (Flutter Riverpod / Web CSS Variables)
│   ├── Dark Mode (Default: Deep Ocean Slate #090D16)
│   └── Light Mode (Soft Slate #F8FAFC)
└── Component Adaptor (Auto-binds controls to active theme)
`

---

## 11.3 Accessibility & Tap-Target Compliance

- **Minimum Tap Target:** 48 x 48 dp on mobile screens for all buttons, toggles, and corner handles.
- **Contrast Ratio:** WCAG 2.1 AA compliant (minimum 4.5:1 text-to-background contrast).
- **Haptic Feedback:** Tactile haptic pulse delivered on edge-lock detection, shutter capture, and page deletion.

---
*End of Volume 3, Chapter 11. Next: Chapter 12 — Camera Viewfinder & Live Overlay UI.*
