# OneConvert — Engineering & Business Handbook
## Volume 3: UI & Design System
## Chapter 13 — Document Review, Filter Strip & Editing Suite UI

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 3 (Scanner Features), Chapter 11 & 12 (Design Tokens & Camera UI)

---

## 13.0 Scope

This chapter specifies the **Document Review & Enhancement Suite** — the post-capture interface where users review scanned pages, apply color filters (Magic Color, B&W, Greyscale), crop/deskew, reorder pages, and export to PDF.

---

## 13.1 Review Screen Layout (Adobe Scan Spec)

`
+---------------------------------------------------+
| [< Back]   Document Name (Scan 26 Jul)   [Save PDF] | <- Top Action Bar
+---------------------------------------------------+
|                                                   |
|            +-------------------------+            |
|            |                         |            |
|            |   CURRENT PAGE PREVIEW  |            | <- Main Page Carousel
|            |     (Page 2 of 4)       |            |    (Pinch-to-zoom active)
|            |                         |            |
|            +-------------------------+            |
|                                                   |
+---------------------------------------------------+
| [Page 1]  [*Page 2*]  [Page 3]  [Page 4]  [+ Add] | <- Horizontal Thumbnail Strip
+---------------------------------------------------+
| [📐 Reorder] [✂️ Crop] [🎨 Filter] [🔄 Rotate] [🗑️] | <- Bottom Toolbar
+---------------------------------------------------+
`

---

## 13.2 Live Filter Strip UX

When the user taps the **Color Filter** tool, a smooth bottom drawer slides up containing 4 live interactive filter previews:

1. **Original (Color):** Raw perspective-corrected camera photo.
2. **Magic Color (Auto-Enhance):** Contrast-boosted, shadow-removed, white background normalization. (Default applied).
3. **Black & White:** Crisp binary high-contrast text scan (for printed/written text).
4. **Greyscale:** Smooth 256-level greyscale.

Tapping any filter updates the current page preview in real time (< 100ms render latency) with a "Apply to all pages" toggle option.

---

## 13.3 Manual Corner Crop Editor UI

When **Crop** is selected, four corner handles (#00F0FF glowing circles) overlay the page with semi-transparent outer mask.
- User can drag any corner handle independently.
- Magnifying loupe glass appears above the user's thumb for millimeter-precise corner placement.
- Tapping "Checkmark" re-warps the perspective instantly.

---
*End of Volume 3, Chapter 13. Next: Interactive Web & Mobile Prototype Implementation.*
