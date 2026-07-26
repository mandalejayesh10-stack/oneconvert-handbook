# OneConvert — Engineering & Business Handbook

## Volume 1: Business & Product Strategy

**Document status:** Living specification — updated incrementally, chapter by chapter
**Version:** 1.0
**Last updated:** Chapter 1 of 20 complete

---

## Chapter 1 — Executive Summary

### 1.1 Purpose of This Chapter

This chapter establishes the foundational narrative for OneConvert: what it is, why it needs to exist, who it serves, and how it will make money. Every later chapter — product requirements, architecture, engine design, security posture — traces back to a claim made here. Where a later volume makes a technical tradeoff (for example, choosing serverless Lambda over containerized ECS for the OCR engine), the justification will ultimately reduce to something stated in this chapter: cost sensitivity for a ₹19/month student tier, unpredictable/bursty document-processing load, or a mobile-first, low-friction user journey.

### 1.2 One-Line Description

OneConvert is a mobile-first document productivity platform — for Android, iOS, and Web — that consolidates document scanning, PDF manipulation, OCR, office file conversion, image/video/audio utilities, and cloud-synced file management into a single, affordable app, so that a user who currently juggles four or five separate tools (a scanner app, a PDF app, an online converter, a compression tool, a cloud drive) can do all of it in one place.

### 1.3 The Core Problem

Document and file utility software today is fragmented and this fragmentation is the actual product opportunity, not a side detail. Three specific failure modes recur across the market:

**Fragmentation across apps.** A typical student or small-business user scans a document with one app, converts it to Word with a second, compresses it with a third (often a web tool, meaning a desktop-first workflow that breaks on mobile), and stores it in a fourth. Each handoff costs time, introduces upload/download friction, and often requires re-authenticating or re-uploading the same file multiple times.

**Pricing built for enterprises, not individuals in price-sensitive markets.** Adobe Acrobat, Nitro, and Foxit price primarily for Western enterprise budgets. A monthly subscription priced in USD is disproportionately expensive relative to purchasing power in markets like India, Southeast Asia, and Latin America — markets with very large populations of students and small business owners who need these tools daily but cannot justify $10–20/month.

**Desktop-first design retrofitted to mobile.** Most PDF/office tools were designed as desktop software (Adobe) or web tools (Smallpdf, iLovePDF) and later wrapped into a mobile app or a mobile browser experience. The interaction patterns — dense toolbars, multi-step wizards, file-picker-heavy workflows — do not match how people actually work on a phone: camera-first capture, single-thumb navigation, and an expectation of near-instant results.

OneConvert's founding bet is that a single, well-designed, mobile-native app, priced for the market it actually serves, can out-compete a fragmented set of desktop-era tools — the same way that Canva out-competed a fragmented set of design tools by being simpler, cheaper, and mobile/web-first, and the same way Notion consolidated notes, docs, and project tracking into one surface.

### 1.4 The Solution

OneConvert is architected around a single mental model: **capture, convert, and manage any document or file, from your phone, in one continuous flow, without leaving the app.** Concretely, this means:

- A best-in-class document scanner (camera capture, edge detection, perspective correction) as the primary entry point, because for most users the first step in any document workflow is turning a physical page into a digital file.
- A full PDF engine (merge, split, compress, reorder, rotate, watermark, password-protect, annotate, sign) operating on files that were either scanned in-app or imported.
- An OCR engine that makes scanned or image-based documents searchable and editable, with initial support prioritized by the language needs of the primary launch market.
- An Office engine that converts between PDF, Word, Excel, and PowerPoint formats without requiring a separate desktop suite.
- Image, video, audio, and compression utilities that round out the "file utility" category so that OneConvert is a genuine one-stop destination, not just a PDF app with extra steps.
- Cloud sync and cross-device access, so a document scanned on a phone is immediately available on web.

Each of these is documented in full in Volume 8 (Processing Engines). This chapter's job is only to establish *why* this bundle, together, is the product — not to specify how each engine works.

### 1.5 Target Users (Summary — full personas in Chapter 8)

OneConvert's initial focus is price-sensitive, high-frequency document users, specifically:

| Persona | Core need | Why existing tools fail them |
|---|---|---|
| Student | Scan notes/assignments, convert to PDF/Word, compress for submission portals | Enterprise tools too expensive; free tools are ad-heavy or single-purpose |
| Freelancer / small business owner | Scan invoices/contracts, convert formats, e-sign, manage client files | Needs 4–5 tools today; no single affordable mobile suite |
| Teacher / academic staff | Scan and OCR handwritten or printed material, merge/split PDFs for coursework | School-provided tools are often desktop-only or restricted |
| Government/office worker | Digitize physical paperwork, compress for upload limits | IT policy often blocks paid enterprise software; needs low-cost individual tool |

Lawyer, HR, and accountant personas are addressed as expansion segments once the Business/Enterprise tier exists (Chapter 13), since their document-security and audit-trail requirements are heavier than the initial consumer tiers are built to support.

### 1.6 Business Model (Summary — full detail in Chapters 12–14)

OneConvert uses a freemium, tiered-subscription model calibrated to the price sensitivity described in 1.3:

- **Free** — document scanning only. This is the acquisition funnel: scanning is the highest-frequency, lowest-friction action, so it is the free hook.
- **Student — ₹19/month** — full feature access, gated behind verified student status. This tier exists because students are high-frequency users with near-zero willingness/ability to pay Western pricing, but represent significant future lifetime value once they enter the workforce.
- **Pro — ₹49/month** — full feature access for general users.
- **Business / Enterprise** — reserved for future definition (seat-based licensing, admin controls, audit logs, SSO) once core consumer product-market fit is established.

The strategic logic: price low enough to make OneConvert an obvious "why not" purchase relative to the cost of staying fragmented across free-tier tools with ads and limits, while using the free scanner as a large top-of-funnel acquisition surface. This is discussed further, including unit economics and AWS serverless cost modeling that makes this pricing viable, in Chapter 13 (Revenue Model) and Volume 9 (DevOps — Cost Optimization).

### 1.7 Competitive Positioning (Summary — full analysis in Chapter 10)

OneConvert does not compete head-on with Adobe Acrobat on enterprise document security features, nor with Google Docs on collaborative document editing. It competes on **breadth of everyday document utility at mobile-native speed and consumer pricing**. The closest comparables in spirit (not feature set) are:

- **Canva** — replaced a fragmented set of design tools with one affordable, mobile-first, easy tool.
- **CamScanner / Adobe Scan** — proved the standalone scanner category, but neither is a full document *productivity* suite.
- **iLovePDF / Smallpdf** — proved the "PDF utility bundle" category, but both are web-first, retrofit to mobile, and priced for global/USD markets.

OneConvert's differentiated position is being the first to combine scanner-grade capture, a full PDF/office engine, and aggressive market-appropriate pricing in a single mobile-native app.

### 1.8 Why Now

Three converging trends make this the right time to build OneConvert:

1. **Mobile-first digitization of paperwork** is accelerating in the markets OneConvert targets first — students and small businesses increasingly do document work entirely on a phone, with no desktop as a fallback.
2. **On-device and cloud OCR/ML quality** has reached a point where scan quality, text recognition, and compression can meet professional expectations without professional-grade cost.
3. **Serverless cloud infrastructure** (the AWS stack detailed in Volume 5) makes it economically viable to offer compute-heavy features (OCR, conversion, compression) at ₹19–49/month price points, because cost scales with actual usage rather than requiring always-on infrastructure. This is the technical enabler behind the business model in 1.6, and it is why the technology constraints in the master specification mandate serverless-only backend architecture.

### 1.9 What Success Looks Like

At a business level (detailed KPIs in Chapter 20 and Volume 12), OneConvert's early success criteria are:

- Free-to-paid conversion driven by the scanner funnel, not paid acquisition.
- Retention anchored in habitual, high-frequency use (document scanning is a recurring need, unlike one-off conversions).
- Unit economics where AWS serverless processing cost per active paid user remains comfortably below the ₹19 student price point, preserving margin even at the lowest tier.

### 1.10 What This Document Is (and Isn't)

This handbook is written to be detailed enough that a new engineer could build the product, an AI coding assistant could generate production-quality code from it, and a CTO or investor could evaluate the architecture and business case — per the standard set in the master specification. It is a **living specification**: later chapters must remain consistent with the decisions made here, and any change to a foundational assumption (pricing, target persona, platform scope) should be reflected back into this chapter rather than silently diverging.

This chapter intentionally does not go deep into TAM/SAM/SOM sizing, detailed competitor feature matrices, or persona-level user journeys — those are the explicit subject of Chapters 6–9, and duplicating them here would violate the "never contradict previous documentation" principle by creating two sources of truth for the same numbers.

---

*End of Chapter 1. Next: Chapter 2 — Vision.*
