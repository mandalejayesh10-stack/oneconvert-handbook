# OneConvert — Engineering & Business Handbook
## Volume 3: UI & Design System
## Chapter 15 — Accessibility (a11y), Touch Targets & Localization UX

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 11-14, BRD-04 (Flutter Cross-Platform)

---

## 15.0 Accessibility & Inclusive Design

OneConvert enforces **WCAG 2.1 Level AA** compliance across all UI components and platform targets (Android, iOS, Web).

### 15.1 Core Accessibility Rules

1. **Touch Target Dimensions:**
   - All interactive buttons, icon triggers, and corner handles must maintain a minimum touch target size of **48 x 48 dp / px**.
2. **Color Contrast Standards:**
   - Text vs. Background contrast ratio >= **4.5:1** for standard body text.
   - Text vs. Background contrast ratio >= **3.0:1** for large heading text (> 18pt bold).
3. **Screen Reader Compatibility (VoiceOver / TalkBack / Web ARIA):**
   - All interactive controls provide semantic labels (Semantics in Flutter, ria-label in HTML).
   - Camera viewfinder announces status changes via live region ("Document detected. Hold steady.").
4. **Motion & Reduced Animation:**
   - Respects prefers-reduced-motion OS settings by disabling camera flash animations and drawer slide transitions when requested.

---

## 15.2 Right-to-Left (RTL) Layout Mirroring

For Arabic, Hebrew, and Urdu locales:
- Top bar navigation back arrows, slider controls, drawer action buttons, and thumbnail lists mirror horizontally (180-degree flip).
- Text alignment adjusts to right-aligned by default.

---
*End of Volume 3, Chapter 15. Next: Chapter 16 — Volume 3 Completion Checklist.*
