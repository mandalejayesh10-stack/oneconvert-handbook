# OneConvert — Engineering & Business Handbook

> **A living specification for the OneConvert document productivity platform.**
> Maintained incrementally, chapter by chapter, across 13 volumes.

---

## Repository Purpose

This repository contains the full OneConvert Engineering & Business Handbook — the single source of truth for all product requirements, architecture decisions, feature specifications, business logic, and implementation guidance for the OneConvert platform (Android, iOS, Flutter Web, AWS Serverless backend).

---

## Volume Index

| Volume | Title | Status |
|--------|-------|--------|
| V1 | Business & Product Strategy | 🔶 Chapter 1 complete (of 20) |
| V2 | Product Requirements | 🔶 Chapters 1–3 complete (of 10) |
| V3 | UI / Design System | ⬜ Not started |
| V4 | Flutter Architecture | ⬜ Not started |
| V5 | Backend Architecture (AWS Serverless) | ⬜ Not started |
| V6 | Database Design | ⬜ Not started |
| V7 | API Specification | ⬜ Not started |
| V8 | Processing Engines | ⬜ Not started |
| V9 | DevOps & Cost Optimization | ⬜ Not started |
| V10 | Security | ⬜ Not started |
| V11 | Testing | ⬜ Not started |
| V12 | Analytics & KPIs | ⬜ Not started |
| V13 | Launch & Go-to-Market | ⬜ Not started |

---

## Feature Progress (Volume 2)

**20 / 92 features** fully specified.

| Chapter | Domain | Features |
|---------|--------|----------|
| Ch 1 | Framework & MVP Scope | ✅ |
| Ch 2 | Account & Identity, Subscription & Billing | ✅ 10/10 |
| Ch 3 | Scanner Domain | ✅ 10/10 |
| Ch 4 | PDF Engine | ⬜ 0/~12 |
| Ch 5 | OCR Engine | ⬜ 0/~8 |
| Ch 6 | Office Engine | ⬜ 0/~8 |
| Ch 7 | Image, Video, Audio, Compression Engines | ⬜ 0/~15 |
| Ch 8 | Cloud, Sync, Search & Organization | ⬜ 0/~12 |
| Ch 9 | Notifications, Admin, Cross-cutting | ⬜ 0/~10 |
| Ch 10 | Consolidated Backlog & Acceptance Criteria Index | ⬜ 0/17 |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Flutter (Android, iOS, Web) |
| State Management | Riverpod |
| Routing | GoRouter |
| Backend | AWS Lambda, API Gateway, DynamoDB, S3, SQS, SNS, EventBridge |
| Auth | AWS Cognito |
| Storage | S3 + CloudFront |
| Observability | CloudWatch |
| Email | SES |

---

## Specification Rules

- Every feature spec includes: Purpose · Business Value · User Story · Acceptance Criteria · Functional Requirements · Flow · Inputs · Outputs · Business Logic · Permissions · Errors · Limitations · Edge Cases · Acceptance Tests · Future Enhancements · BRD Trace
- Every FR traces to at least one BRD row (BRD-01 through BRD-07)
- FR format: `FR-<DOMAIN>-<NUMBER>: The system shall <capability>, given <preconditions>, resulting in <observable outcome>.`
- Priority tags: **Must (MVP)** / **Should (Fast-follow)** / **Could (Backlog)** / **Won't-yet**
