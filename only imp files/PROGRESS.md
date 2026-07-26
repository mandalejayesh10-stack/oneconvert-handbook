# OneConvert Handbook — Build Progress Tracker

Master index reference: 13 volumes (V1–V13), Volume 2 alone covers 92 approved features across 10 chapters.

## Status Legend
✅ Complete | 🔶 In progress | ⬜ Not started

## Volume 1 — Business & Product Strategy
⬜ Not started (source doc provided by user covers this at summary level only; full 20-chapter buildout not yet done)

## Volume 2 — Product Requirements
- ✅ Chapter 1 — PRD/BRD Framework, Requirements Taxonomy, MVP Scope (provided by user, stored as reference)
- ✅ Chapter 2 — Account & Identity, Subscription & Billing features (10 features fully specced)
- ✅ Chapter 3 — Scanner domain features (10 features fully specced)
- ✅ Chapter 4 — PDF Engine features (16 features fully specced)
- ⬜ Chapter 5 — OCR Engine features
- ⬜ Chapter 6 — Office Engine features
- ⬜ Chapter 7 — Image, Video, Audio, Compression Engine features
- ⬜ Chapter 8 — Cloud, Sync, Search & Organization features
- ⬜ Chapter 9 — Notifications, Admin, cross-cutting features
- ⬜ Chapter 10 — Consolidated backlog, edge case index, acceptance criteria index

## Volumes 3–13
⬜ Not started. Per the master spec's cross-referencing principle, these should be built AFTER Volume 2's 92 features
are fully specified, since UI (V3), Flutter (V4), Backend (V5), DB (V6), API (V7), and Engine (V8) docs all
cross-reference the feature specs rather than duplicating them.

## Feature Count Tracking (of 92 total)
- Chapter 2 (Account/Identity/Sub/Billing): 10 features specced ✅
- Chapter 3 (Scanner domain): 10 features specced ✅
- Chapter 4 (PDF Engine): 16 features specced ✅
- Running total specified: 36 / 92
- Next up: Chapter 5 — OCR Engine features

## Notes for continuation
- Each feature spec must include: Purpose, Flow, Inputs, Outputs, Business Logic, Permissions, Errors,
  Limitations, Acceptance Tests, Future Enhancements (per master spec, echoed in Vol 2 Ch1 §1.10).
- Every FR must trace to a BRD row (BRD-01 through BRD-07, defined in Vol 2 Ch1 §1.2) — flag anything that doesn't.
- Follow the exact FR/User-Story/Edge-Case-table formats fixed in Vol 2 Ch1 (§1.4, §1.6, §1.7).
- Priority tag every feature: Must (MVP) / Should (Fast-follow) / Could (Backlog) / Won't-yet, per §1.8.
