# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 1 — PRD/BRD Framework, Requirements Taxonomy, and MVP Scope

**Document status:** Living specification — updated incrementally, chapter by chapter
**Version:** 1.0
**Depends on:** Volume 1, Chapter 1 (Executive Summary) — pricing tiers, target personas, and platform scope defined there are treated as fixed inputs here.

---

### 1.1 Purpose of This Chapter

Volume 1 established *why* OneConvert exists and *who* it serves. This volume translates that into *what must be built*. Because Volume 2 in the master specification also demands full documentation of all 92 approved features (each with purpose, flow, inputs, outputs, business logic, permissions, errors, limitations, acceptance tests, and future enhancements), this chapter first establishes the shared framework and templates that every one of those 92 feature specs will follow — so that feature documentation is consistent rather than reinvented 92 times. Subsequent chapters in this volume will then work through the features themselves, organized by engine/domain (Scanner, PDF, OCR, Office, Image/Video/Audio, Compression, Cloud, Account/Subscription) rather than attempting all 92 in a single pass, so that each feature gets real depth instead of a shallow one-line entry.

### 1.2 Business Requirements Document (BRD) — Summary

| ID | Business Requirement | Source |
|---|---|---|
| BRD-01 | Free tier must drive acquisition via document scanning, at zero marginal cost risk to margin | §1.6, Vol 1 |
| BRD-02 | Paid tiers (Student ₹19, Pro ₹49) must unlock the full engine set (PDF, OCR, Office, Image/Video/Audio, Compression, Cloud) | §1.6, Vol 1 |
| BRD-03 | Student tier must include a verification mechanism to prevent non-students from accessing the discounted tier | §1.6, Vol 1 |
| BRD-04 | Platform must run on Android, iOS, and Web from a single Flutter codebase | Master spec, Technology Constraints |
| BRD-05 | Backend must be AWS serverless-only, so infrastructure cost scales with active usage, not fixed capacity | §1.8, Vol 1 |
| BRD-06 | Product must support offline-first core actions (scanning) since target personas cannot assume reliable connectivity at point of capture | Persona needs, §1.5 Vol 1 |
| BRD-07 | Business/Enterprise tiers must be structurally anticipated (not necessarily built) in the data model and permission system, to avoid costly rearchitecture later | §1.6, Vol 1 |

### 1.3 Product Requirements Document (PRD) — Structure

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

```
FR-<DOMAIN>-<NUMBER>: The system shall <capability>, given <preconditions>, 
resulting in <observable outcome>.
```

Example: **FR-SCAN-01:** The system shall allow a signed-in or anonymous user to capture one or more pages via device camera, given camera permission has been granted, resulting in a locally-stored multi-page document with automatic edge detection applied to each page.

### 1.5 Non-Functional Requirements (NFRs) — Baseline for the Whole Product

| Category | Requirement | Rationale |
|---|---|---|
| Performance | P50 API response time < 300ms for non-processing endpoints (auth, metadata, listing); processing jobs (OCR, conversion, compression) are async and reported via job status, not synchronous latency | Mobile users on variable networks |
| Availability | 99.9% monthly uptime target for API Gateway/Lambda tier | Standard SLA for a paid consumer product |
| Scalability | Must handle bursty load (e.g., exam season scanning spikes among student persona) without manual capacity planning | Direct consequence of BRD-05 (serverless) |
| Offline support | Scanning and local file management must function fully offline; sync resumes automatically on reconnect | BRD-06 |
| Security | All file storage encrypted at rest (S3 SSE) and in transit (TLS 1.2+); auth via Cognito; no plaintext credential storage | OWASP baseline |
| Cost efficiency | Backend cost per active paid user must remain low enough to preserve margin at the ₹19 tier | BRD-01, BRD-05 |
| Accessibility | UI must meet WCAG 2.1 AA where feasible on mobile | Material Design / Apple HIG baseline |
| Localization | Architecture must support adding languages/locales without code changes to business logic | Long-term market expansion |
| Data portability | Users must be able to export/delete their data (GDPR-aligned), even though initial launch market may not legally require it | Forward-compatibility |

### 1.6 User Story Format

```
As a <persona>, I want to <action>, so that <benefit>.

Acceptance Criteria:
- Given <context>, when <action>, then <expected result>.
- Given <context>, when <action>, then <expected result>.
```

### 1.7 Edge Case Documentation Standard

| Edge Case | Expected Behavior | Severity |
|---|---|---|

Severity: Blocker / Major / Minor (matches Volume 11 Testing triage vocabulary).

### 1.8 Feature Prioritization Framework (MVP vs. Future)

- **Must (MVP):** Scanner (capture, edge detection, multi-page, basic filters), core PDF engine (merge, split, compress, reorder, rotate), core OCR (searchable PDF, primary launch language), core Office conversion (PDF↔Word, PDF↔Excel minimum), account/auth with student verification, subscription/billing, basic cloud sync.
- **Should (Fast-follow):** PDF annotation and e-signature, watermarking, password protection, image engine (compress/convert/resize), history/favorites/trash, richer OCR language support.
- **Could (Backlog):** Video/audio engine, advanced batch processing, advanced search, business/enterprise-only capabilities.
- **Won't-yet:** Business/Enterprise tier (seat management, admin console, SSO, audit logs) — structurally anticipated per BRD-07, out of scope until a dedicated volume/chapter defines that tier.

### 1.9 Roadmap Skeleton

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
  Business/Enterprise tier launch -> AI-assisted features -> Additional platform integrations
```

### 1.10 What Comes Next in This Volume

- Chapter 2 — Account & Identity, Subscription & Billing features
- Chapter 3 — Scanner domain features
- Chapter 4 — PDF Engine features
- Chapter 5 — OCR Engine features
- Chapter 6 — Office Engine features
- Chapter 7 — Image, Video, Audio, Compression Engine features
- Chapter 8 — Cloud, Sync, Search & Organization features
- Chapter 9 — Notifications, Admin, and cross-cutting features
- Chapter 10 — Consolidated backlog, edge case index, and acceptance criteria index

---
*End of Volume 2, Chapter 1. Next: Volume 2, Chapter 2 — Account & Identity, Subscription & Billing Features.*
