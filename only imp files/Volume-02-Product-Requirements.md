# OneConvert — Engineering & Business Handbook

## Volume 2: Product Requirements

**Document status:** Living specification — updated incrementally, chapter by chapter
**Version:** 1.0
**Depends on:** Volume 1, Chapter 1 (Executive Summary) — pricing tiers, target personas, and platform scope defined there are treated as fixed inputs here.

---

## Chapter 1 — PRD/BRD Framework, Requirements Taxonomy, and MVP Scope

### 1.1 Purpose of This Chapter

Volume 1 established *why* OneConvert exists and *who* it serves. This volume translates that into *what must be built*. Because Volume 2 in the master specification also demands full documentation of all 92 approved features (each with purpose, flow, inputs, outputs, business logic, permissions, errors, limitations, acceptance tests, and future enhancements), this chapter first establishes the shared framework and templates that every one of those 92 feature specs will follow — so that feature documentation is consistent rather than reinvented 92 times. Subsequent chapters in this volume will then work through the features themselves, organized by engine/domain (Scanner, PDF, OCR, Office, Image/Video/Audio, Compression, Cloud, Account/Subscription) rather than attempting all 92 in a single pass, so that each feature gets real depth instead of a shallow one-line entry.

### 1.2 Business Requirements Document (BRD) — Summary

The BRD layer answers "what does the business need," independent of implementation. For OneConvert, the business requirements — derived directly from Volume 1 — are:

| ID | Business Requirement | Source |
|---|---|---|
| BRD-01 | Free tier must drive acquisition via document scanning, at zero marginal cost risk to margin | §1.6, Vol 1 |
| BRD-02 | Paid tiers (Student ₹19, Pro ₹49) must unlock the full engine set (PDF, OCR, Office, Image/Video/Audio, Compression, Cloud) | §1.6, Vol 1 |
| BRD-03 | Student tier must include a verification mechanism to prevent non-students from accessing the discounted tier | §1.6, Vol 1 |
| BRD-04 | Platform must run on Android, iOS, and Web from a single Flutter codebase | Master spec, Technology Constraints |
| BRD-05 | Backend must be AWS serverless-only, so infrastructure cost scales with active usage, not fixed capacity | §1.8, Vol 1 |
| BRD-06 | Product must support offline-first core actions (scanning) since target personas cannot assume reliable connectivity at point of capture | Persona needs, §1.5 Vol 1 |
| BRD-07 | Business/Enterprise tiers must be structurally anticipated (not necessarily built) in the data model and permission system, to avoid costly rearchitecture later | §1.6, Vol 1 |

Each BRD row is a business-level constraint. Every functional requirement below must trace to at least one BRD row; if it doesn't, it's scope creep and should be flagged, not silently built.

### 1.3 Product Requirements Document (PRD) — Structure

The PRD layer translates business requirements into product-level requirements: concrete capabilities, without yet specifying UI or implementation. OneConvert's PRD is organized by **engine/domain**, matching the processing engines defined in Volume 8, because that mapping keeps product scope and backend architecture in lockstep — a new product requirement should never exist without a clear engine owner, and vice versa.

```
PRD Domains
├── Account & Identity        (auth, profile, subscription state, student verification)
├── Scanner                   (capture, edge detection, multi-page, filters)
├── PDF Engine                (merge, split, compress, reorder, rotate, watermark, sign, protect, annotate)
├── OCR Engine                (text recognition, searchable PDF output, editable text export)
├── Office Engine              (PDF <-> Word/Excel/PowerPoint conversion)
├── Image Engine               (format conversion, resize, compress, background removal - future)
├── Video/Audio Engine         (format conversion, compression, trimming)
├── Compression Engine         (generic file compression across formats)
├── Cloud & Sync               (storage, cross-device sync, sharing)
├── Search & Organization      (file search, folders, favorites, history, trash)
├── Notifications              (processing status, subscription/billing events)
└── Subscription & Billing     (plan management, payments, entitlements)
```

### 1.4 Functional Requirements — Definition and Format

A functional requirement (FR) states what the system must *do*, expressed as a testable statement, not a design. OneConvert FRs follow this format throughout the handbook:

```
FR-<DOMAIN>-<NUMBER>: The system shall <capability>, given <preconditions>, 
resulting in <observable outcome>.
```

Example (Scanner domain):

> **FR-SCAN-01:** The system shall allow a signed-in or anonymous user to capture one or more pages via device camera, given camera permission has been granted, resulting in a locally-stored multi-page document with automatic edge detection applied to each page.

Every FR in later chapters will be written in this form, numbered per domain, so that Volume 11 (Testing) can map test cases 1:1 back to FR IDs — this traceability is why the format is standardized here rather than left loose per feature.

### 1.5 Non-Functional Requirements (NFRs) — Baseline for the Whole Product

NFRs apply across all features and are set once here rather than repeated per feature. Individual feature chapters will only call out NFRs where a feature has a *stricter* requirement than this baseline (e.g., OCR performance targets are tighter than the general baseline, and are restated in the OCR chapter).

| Category | Requirement | Rationale |
|---|---|---|
| Performance | P50 API response time < 300ms for non-processing endpoints (auth, metadata, listing); processing jobs (OCR, conversion, compression) are async and reported via job status, not synchronous latency | Mobile users on variable networks; synchronous long waits break the "instant" mobile UX promise from Vol 1 §1.3 |
| Availability | 99.9% monthly uptime target for API Gateway/Lambda tier | Standard SLA for a paid consumer product; formally revisited in Volume 5 |
| Scalability | Must handle bursty load (e.g., exam season scanning spikes among student persona) without manual capacity planning | Direct consequence of BRD-05 (serverless) |
| Offline support | Scanning and local file management must function fully offline; sync resumes automatically on reconnect | BRD-06 |
| Security | All file storage encrypted at rest (S3 SSE) and in transit (TLS 1.2+); auth via Cognito; no plaintext credential storage | OWASP baseline, detailed in Volume 10 |
| Cost efficiency | Backend cost per active paid user must remain low enough to preserve margin at the ₹19 tier | BRD-01, BRD-05; detailed in Volume 9 |
| Accessibility | UI must meet WCAG 2.1 AA where feasible on mobile (contrast, tap target size, screen reader labels) | Material Design / Apple HIG baseline, detailed in Volume 3 |
| Localization | Architecture must support adding languages/locales without code changes to business logic | Long-term market expansion beyond initial launch market |
| Data portability | Users must be able to export/delete their data (GDPR-aligned), even though initial launch market may not legally require it | Forward-compatibility with future markets; detailed in Volume 10 |

### 1.6 User Story Format

All user stories in this volume follow the standard three-part form, extended with an explicit persona reference back to Volume 1 §1.5:

```
As a <persona>, I want to <action>, so that <benefit>.

Acceptance Criteria:
- Given <context>, when <action>, then <expected result>.
- Given <context>, when <action>, then <expected result>.
```

Example:

> **US-SCAN-01:** As a **student**, I want to scan multiple pages of an assignment in one continuous session, so that I don't have to repeat the scan flow per page.
>
> Acceptance Criteria:
> - Given the camera view is open, when I capture a page, then the app shows a "capture next page" prompt without leaving the camera view.
> - Given I have captured 2+ pages, when I tap "Done," then all pages are combined into a single multi-page document in the order captured, with reordering available before save.

### 1.7 Edge Case Documentation Standard

Every feature chapter must include an edge case table, not prose, so edge cases are scannable and testable. Standard columns:

| Edge Case | Expected Behavior | Severity |
|---|---|---|

Severity is rated Blocker / Major / Minor, matching the triage vocabulary used in Volume 11 (Testing) so that QA can prioritize directly from this document without translation.

### 1.8 Feature Prioritization Framework (MVP vs. Future)

OneConvert has 92 approved features. Not all 92 ship at launch. Priority is assigned using a variant of MoSCoW (Must/Should/Could/Won't-yet), with the "Must" criteria derived directly from the BRD:

- **Must (MVP):** Required to deliver the free scanning funnel (BRD-01) and the core paid bundle (BRD-02) at launch. This includes: Scanner (capture, edge detection, multi-page, basic filters), core PDF engine (merge, split, compress, reorder, rotate), core OCR (searchable PDF for at least the primary launch language), core Office conversion (PDF↔Word, PDF↔Excel at minimum), account/auth with student verification, subscription/billing, and basic cloud sync.
- **Should (Fast-follow):** Features that materially strengthen retention/differentiation but aren't launch-blocking: PDF annotation and e-signature, watermarking, password protection, image engine (compress/convert/resize), history/favorites/trash, richer OCR language support.
- **Could (Backlog):** Video/audio engine, advanced batch processing, advanced search, business/enterprise-only capabilities.
- **Won't-yet:** Anything requiring the not-yet-designed Business/Enterprise tier (seat management, admin console, SSO, audit logs) — structurally anticipated per BRD-07 but explicitly out of scope until a dedicated volume/chapter defines that tier.

This prioritization will be applied explicitly to each of the 92 features as they are documented domain-by-domain in the following chapters, so every feature carries an explicit MVP/Fast-follow/Backlog/Future tag — not left implicit.

### 1.9 Roadmap Skeleton (High-Level — detailed release plan in Chapter to follow)

```
Phase 0 — MVP Launch
  Scanner (core) -> PDF Engine (core) -> OCR (core, 1 language) -> 
  Office Engine (PDF<->Word, PDF<->Excel) -> Account/Subscription/Billing -> Cloud Sync (basic)

Phase 1 — Fast-follow (0-3 months post-launch)
  PDF Annotation & E-sign -> Watermark/Password Protect -> Image Engine -> 
  History/Favorites/Trash -> Additional OCR languages

Phase 2 — Expansion (3-9 months post-launch)
  Video/Audio Engine -> Advanced Batch Processing -> Advanced Search -> 
  Business/Enterprise tier design begins

Phase 3 — Future
  Business/Enterprise tier launch -> AI-assisted features (referenced as "AI Market (Future)" 
  in Vol 1 Ch 7) -> Additional platform integrations
```

This phase structure is the backbone for Chapter 20 (Future Vision) in Volume 1 and will be revisited with hard dates once Volume 9 (DevOps) establishes realistic delivery velocity assumptions — this document does not fabricate delivery dates without that engineering input, per the master specification's rule to never assume information without stating assumptions.

### 1.10 What Comes Next in This Volume

The remaining chapters of Volume 2 will document the 92 approved features in full, grouped by domain to keep each chapter coherent:

- Chapter 2 — Account & Identity, Subscription & Billing features
- Chapter 3 — Scanner domain features
- Chapter 4 — PDF Engine features
- Chapter 5 — OCR Engine features
- Chapter 6 — Office Engine features
- Chapter 7 — Image, Video, Audio, Compression Engine features
- Chapter 8 — Cloud, Sync, Search & Organization features
- Chapter 9 — Notifications, Admin, and cross-cutting features
- Chapter 10 — Consolidated backlog, edge case index, and acceptance criteria index

Each will apply the FR/user-story/edge-case/prioritization formats defined above per feature, exactly as specified in the master requirement that every feature include purpose, business value, user story, UI, UX, workflow, architecture, API, database, permissions, validation, error handling, performance, security, offline behavior, testing, acceptance criteria, and future enhancements — full UI/architecture/API/DB detail for each feature will be cross-referenced to Volumes 3, 5, 6, and 7 respectively once those volumes exist, rather than duplicated here, to preserve the single-source-of-truth principle.

---

*End of Volume 2, Chapter 1. Next: Volume 2, Chapter 2 — Account & Identity, Subscription & Billing Features.*
