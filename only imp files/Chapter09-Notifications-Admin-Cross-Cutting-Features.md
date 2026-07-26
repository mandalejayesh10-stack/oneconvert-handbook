# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 9 — Notifications, Admin & Cross-Cutting Features

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 1 (Framework, BRD/PRD structure, NFR baseline, prioritization rules), Chapter 2 (Account, Identity, Subscription — RBAC & admin privileges), Chapter 4-8 (Processing engines — background job status notifications & async queue handlers)

---

## 9.0 Chapter Scope

This chapter documents the features in the **Notifications, Admin, and Cross-Cutting** PRD domains (Chapter 1, Section 1.3). Cross-cutting features provide the shared infrastructure powering every user-facing engine in OneConvert — including async background job tracking, multi-channel push/email notifications, internationalization (i18n), telemetry/analytics, security auditing, in-app support, and enterprise administrative management.

These features enable scalable operations under **BRD-03** (Student verification workflows), **BRD-05** (AWS Serverless queueing), **BRD-06** (Offline state tracking), and **BRD-07** (Business & Enterprise administration).

Seven comprehensive features are specified in this chapter, followed by domain performance and offline NFR addenda.

| # | Feature | Domain | Priority |
|---|---|---|---|
| 1 | Multi-Channel Notification Engine | Notifications | Must (MVP) |
| 2 | Asynchronous Job Queue & Background Task Manager | Cross-Cutting | Must (MVP) |
| 3 | Internationalization (i18n) & Localization Engine | Cross-Cutting | Must (MVP) |
| 4 | App Preferences, Customization & Defaults System | Cross-Cutting | Must (MVP) |
| 5 | Telemetry, Analytics & Crash Reporting Pipeline | Cross-Cutting | Must (MVP) |
| 6 | Security Audit Logging & Compliance Manager | Security/Admin | Must (MVP) |
| 7 | Admin Portal & Enterprise Management Console | Admin Domain | Should (Fast-follow) |

---

## 9.1 Feature: Multi-Channel Notification Engine

**Purpose:** Deliver real-time push notifications (via FCM/APNs), in-app notification toasts, and transactional emails (via AWS SES) to inform users about long-running batch job completions, subscription billing updates, student verification approvals, and security alerts.

**Business Value:** Long-running engine tasks (batch OCR, video compression, large PDF merges) require asynchronous execution so users do not stare at loading screens. Multi-channel notifications bring users back into the app when their background jobs finish, directly increasing re-engagement and session frequency (BRD-01, BRD-02, BRD-05).

**User Story:**
> **US-ADM-01:** As a **user who submitted a 50-file batch OCR job**, I want to close the app and receive a push notification when processing is complete, so that I can open the converted files without waiting inside the app.
>
> Acceptance Criteria:
> - Given an async background job completes, when the user is outside the app, then a native push notification (FCM/APNs) is delivered to their mobile device.
> - Given a user actively using the app, when a job completes, then an interactive in-app toast notification appears at the top of the screen with a "View Output" button.
> - Given critical account events (subscription receipt, password change, student status verified), when triggered, then an email notification (AWS SES) is delivered to the user's registered address.

**Functional Requirements:**
- **FR-ADM-01:** The system shall deliver push notifications to Android, iOS, and Web browsers using Firebase Cloud Messaging (FCM) and Apple Push Notification service (APNs), given user permission.
- **FR-ADM-02:** The system shall present in-app toast notifications for real-time background task updates without interrupting active document editing or viewing.
- **FR-ADM-03:** The system shall send transactional emails (AWS SES) for account security, billing receipts, and student verification approvals under BRD-03.
- **FR-ADM-04:** The system shall provide a Notification Preferences Center allowing users to toggle specific notification channels (Push, Email, In-App) and categories (Job Completions, Marketing, Security, Account).

**Flow:** Event occurs (Job Complete / Payment Success) -> Event published to AWS EventBridge -> Notification Dispatcher evaluates user preferences -> Routes to FCM/APNs (Push), AWS SES (Email), or WebSocket (In-App) -> Delivery confirmed.

**Inputs:** System event payload; user device push tokens; user channel preferences.

**Outputs:** Push notification payload; transactional email; in-app notification record.

**Permissions:** Available across all tiers.

**Acceptance Tests:** Verify push notification delivers within 3 seconds of job completion; verify in-app toast opens output document when tapped; verify turning off email notifications blocks non-security emails.

**Traces to:** BRD-01, BRD-02, BRD-05.

---
## 9.2 Feature: Asynchronous Job Queue & Background Task Manager

**Purpose:** Manage, monitor, queue, pause, cancel, and retry long-running document processing jobs across local device background workers and AWS serverless cloud queues (AWS SQS + Lambda / Fargate), providing real-time progress status to the UI.

**Business Value:** Complex engine workflows (high-res OCR, 500-page PDF merges, video transcoding) cannot run synchronously on the UI thread without causing app freezes or ANR (Application Not Responding) crashes. A robust job queue provides UI responsiveness and failure resiliency (BRD-04, BRD-05).

**User Story:**
> **US-ADM-02:** As a **user processing a large 100-page PDF OCR job**, I want to see the job progress percentage and have the ability to pause or cancel it if I realized I selected the wrong file, so that I maintain control over my active processing queue.
>
> Acceptance Criteria:
> - Given an async processing job initiated, when viewed in the Processing Queue Manager, then real-time progress bar (0-100%), current step description, and ETA are displayed.
> - Given an in-progress queued job, when the user taps "Cancel", then the background worker stops processing immediately and frees allocated resources.
> - Given a failed job due to temporary network drop, when reconnected, then the job automatically retries with exponential backoff up to 3 attempts.

**Functional Requirements:**
- **FR-ADM-05:** The system shall queue and process asynchronous tasks locally using WorkManager (Android) / BGTaskScheduler (iOS) and in the cloud using AWS SQS + Lambda workers.
- **FR-ADM-06:** The system shall expose a unified Task Manager UI displaying active, queued, completed, and failed background jobs with percentage progress indicators.
- **FR-ADM-07:** The system shall support job lifecycle operations: Pause, Resume, Cancel, and Retry on failed tasks.
- **FR-ADM-08:** The system shall implement Dead Letter Queue (DLQ) handling for cloud jobs that fail 3 consecutive times, notifying the user with actionable diagnostics.

**Flow:** Job submitted -> Enqueued in local/cloud queue -> Worker picks up task -> Emits progress events -> UI updates progress bar -> On complete: Output delivered -> On error: Retry schedule or move to DLQ.

**Inputs:** Task definition payload; task control commands (Pause/Cancel/Retry).

**Outputs:** Task progress state; execution output asset; failure diagnostic log.

**Permissions:** Available across all tiers.

**Acceptance Tests:** Verify UI progress bar updates dynamically; verify Cancel action stops worker within 1 second; verify job automatically retries on network recovery.

**Traces to:** BRD-04, BRD-05, BRD-06.

---

## 9.3 Feature: Internationalization (i18n) & Localization Engine

**Purpose:** Provide full UI translation, regional number/currency/date formatting, and right-to-left (RTL) layout support across 12+ languages, ensuring OneConvert is localized for key demographic markets.

**Business Value:** Serving users across India and global markets requires localized experiences in regional languages (Hindi, Tamil, Telugu, Marathi, Bengali, etc.) alongside major international languages (Spanish, French, German, Arabic). Localization significantly lowers adoption barriers in non-English speaking markets (BRD-01, BRD-04).

**User Story:**
> **US-ADM-03:** As a **Hindi-speaking student**, I want to use OneConvert with the full UI translated into Hindi, so that I can easily navigate scan, OCR, and PDF features in my primary language.
>
> Acceptance Criteria:
> - Given language selection (e.g., Hindi, Tamil, Spanish, Arabic), when selected, then all UI buttons, menus, dialogs, and onboardings render in the selected language.
> - Given Arabic script selection, when active, then the entire app layout mirrors dynamically to Right-to-Left (RTL) orientation.
> - Given date/number displays, when localized, then regional formatting rules apply (e.g., DD/MM/YYYY vs MM/DD/YYYY, local currency symbols ₹, $, €).

**Functional Requirements:**
- **FR-ADM-09:** The system shall support full UI translation across at minimum: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Spanish, French, German, Arabic.
- **FR-ADM-10:** The system shall support dynamic Right-to-Left (RTL) UI mirroring for Arabic script.
- **FR-ADM-11:** The system shall format numbers, currencies, dates, and file sizes according to user locale preferences.

**Permissions:** Available across all tiers.

**Acceptance Tests:** Verify full app UI translates when language changed to Hindi; verify RTL layout flip on Arabic selection; verify date formats update per locale.

**Traces to:** BRD-01, BRD-04.

---

## 9.4 Feature: App Preferences, Customization & Defaults System

**Purpose:** Provide a centralized App Settings system allowing users to configure default processing quality, default export targets, camera preferences, dark/light visual themes, and automatic cloud sync rules.

**Business Value:** Power users expect customization options so they don't have to re-configure quality settings every time they perform an operation (BRD-01, BRD-02).

**User Story:**
> **US-ADM-04:** As a **frequent scanner**, I want to set "Default Export Format" to PDF and "Default Filter" to Magic Color in my app settings, so that every scan automatically saves with my preferred defaults.
>
> Acceptance Criteria:
> - Given App Preferences, when settings are modified, then defaults apply immediately to all subsequent scanner, PDF, and export operations.
> - Given visual theme settings (System Default / Dark Mode / Light Mode / High Contrast), when selected, then the app UI updates instantly without restart.

**Functional Requirements:**
- **FR-ADM-12:** The system shall store user preference keys (Default Image Quality, Default Export Path, Theme, Camera Sound, Auto-Crop default, Cloud Auto-Sync toggles) in encrypted local storage.
- **FR-ADM-13:** The system shall sync preference settings across authenticated user devices via AWS DynamoDB user profiles.

**Permissions:** Available across all tiers.

**Acceptance Tests:** Verify changing default image filter applies to new scans without manual selection; verify dark theme updates UI elements cleanly.

**Traces to:** BRD-01, BRD-04.

---
## 9.5 Feature: Telemetry, Analytics & Crash Reporting Pipeline

**Purpose:** Collect privacy-compliant app usage analytics, performance metrics, and crash stack traces (via Sentry / Firebase Crashlytics / AWS CloudWatch) to proactively identify engine bugs and optimize user flows.

**Business Value:** Proactive crash identification and performance tracking are critical for maintaining 99.9% uptime and high app store ratings (BRD-01, BRD-05). Strict privacy compliance ensures user document contents are never logged.

**User Story:**
> **US-ADM-05:** As an **engineering team lead**, I want automated crash reports with stack traces and device telemetry delivered to our monitoring dashboard when a conversion fails, so that we can fix bugs without requiring user bug reports.
>
> Acceptance Criteria:
> - Given an unhandled app crash or engine exception, when it occurs, then an anonymized crash report with stack trace and device specs is captured and dispatched to Sentry/Crashlytics.
> - Given user privacy regulations (GDPR / DPDP Act), all telemetry is fully anonymized and contains ZERO document text or image content.

**Functional Requirements:**
- **FR-ADM-14:** The system shall capture anonymized crash dumps, unhandled exceptions, and memory profiler telemetry.
- **FR-ADM-15:** The system shall track core product analytics (feature usage frequency, conversion completion rates, session duration) via privacy-preserving event pipelines.
- **FR-ADM-16:** The system shall enforce zero-document-data logging policies (scrubbing file names, text content, and image buffers from all telemetry payloads).

**Permissions:** Available across all tiers; user opt-out toggle provided in Settings.

**Acceptance Tests:** Verify crash event generates stack trace in dashboard; verify zero document PII is included in telemetry payloads.

**Traces to:** BRD-01, BRD-05.

---

## 9.6 Feature: Security Audit Logging & Compliance Manager

**Purpose:** Log security events (logins, password changes, permission modifications, data export requests) and provide data privacy tools (GDPR / India DPDP Act compliance: Download My Data, Delete My Account).

**Business Value:** Compliance with international data protection laws (EU GDPR, India Digital Personal Data Protection Act) is legally mandatory and essential for enterprise sales (BRD-02, BRD-07).

**User Story:**
> **US-ADM-06:** As a **privacy-conscious user**, I want to request a download of all my account data and permanently delete my account, so that I exercise my legal rights under data privacy laws.
>
> Acceptance Criteria:
> - Given a user selects "Download My Data", when requested, then a ZIP file containing all account metadata and saved files is generated and emailed to the user within 24 hours.
> - Given a user selects "Delete My Account", when confirmed, then all cloud database records, S3 files, and backup archives associated with the account are permanently purged within 30 days.

**Functional Requirements:**
- **FR-ADM-17:** The system shall record immutable security audit logs for account authentication, password changes, tier upgrades, and administrative actions.
- **FR-ADM-18:** The system shall provide an automated "Download My Data" export worker under GDPR / DPDP Act guidelines.
- **FR-ADM-19:** The system shall provide an automated "Delete My Account & Data" permanent purge workflow.

**Permissions:** Available across all tiers.

**Acceptance Tests:** Verify "Download My Data" generates complete data ZIP archive; verify "Delete Account" purges user records from DynamoDB and S3.

**Traces to:** BRD-02, BRD-05, BRD-07.

---

## 9.7 Feature: Admin Portal & Enterprise Management Console

**Priority:** Should (Fast-follow)

**Purpose:** Provide a web-based administrative console for OneConvert support, ops, and enterprise team admins to manage user subscriptions, verify student credentials (BRD-03), monitor system metrics, and manage organizational licenses.

**Business Value:** Enables operational scalability, manual fallback for student verification under BRD-03, customer support ticket resolution, and enterprise license provisioning under BRD-07.

**User Story:**
> **US-ADM-07:** As a **OneConvert customer support agent**, I want to look up a user's subscription status and manually review an uploaded student ID card, so that I can approve their student discount if auto-verification fails.
>
> Acceptance Criteria:
> - Given an admin user logged into the Admin Portal (https://admin.oneconvert.app), when searching for a user email, then account tier, usage quotas, and support history are displayed.
> - Given a pending manual Student Verification request (BRD-03), when the admin reviews the uploaded document and clicks "Approve", then the user's account is upgraded to Student tier immediately.

**Functional Requirements:**
- **FR-ADM-20:** The system shall provide a role-based web Admin Portal (Super Admin, Support Agent, Verification Reviewer) with multi-factor authentication.
- **FR-ADM-21:** The system shall provide a Student Verification Review Queue allowing manual approval or rejection of student ID submissions under BRD-03.
- **FR-ADM-22:** The system shall provide System Health Dashboards displaying real-time Lambda execution metrics, active SQS queue depth, S3 storage consumption, and OCR engine throughput.

**Permissions:** Admin roles only.

**Acceptance Tests:** Verify admin login requires MFA; verify approving student verification updates user entitlement state in real time.

**Traces to:** BRD-02, BRD-03, BRD-05, BRD-07.

---

## 9.8 Performance Requirements (Domain NFR Addendum)

**Functional Requirements:**
- **FR-ADM-23:** The system shall deliver in-app toast notifications within 500 milliseconds of background job completion events.
- **FR-ADM-24:** The system shall render translated UI text with 0ms perceptible delay when switching languages.

**Traces to:** BRD-01, BRD-04, BRD-05.

---

## 9.9 Offline Support (Domain NFR Addendum)

**Functional Requirements:**
- **FR-ADM-25:** The system shall store push notification history and security audit events locally in SQLite while offline, syncing logs to AWS upon network restoration.

**Traces to:** BRD-06.

---

## 9.10 Chapter Summary and Traceability Check

| Feature | Priority | FRs | BRD Trace |
|---|---|---|---|
| Multi-Channel Notification Engine | Must (MVP) | FR-ADM-01 to 04 | BRD-01, BRD-02, BRD-05 |
| Async Job Queue & Task Manager | Must (MVP) | FR-ADM-05 to 08 | BRD-04, BRD-05, BRD-06 |
| i18n & Localization Engine | Must (MVP) | FR-ADM-09 to 11 | BRD-01, BRD-04 |
| App Preferences & Customization | Must (MVP) | FR-ADM-12 to 13 | BRD-01, BRD-04 |
| Telemetry & Crash Reporting Pipeline | Must (MVP) | FR-ADM-14 to 16 | BRD-01, BRD-05 |
| Security Audit Logging & Compliance | Must (MVP) | FR-ADM-17 to 19 | BRD-02, BRD-05, BRD-07 |
| Admin Portal & Enterprise Console | Should (Fast-follow) | FR-ADM-20 to 22 | BRD-02, BRD-03, BRD-05, BRD-07 |
| Performance Requirements (NFR) | Must (MVP) | FR-ADM-23 to 24 | BRD-01, BRD-04, BRD-05 |
| Offline Support (NFR) | Must (MVP) | FR-ADM-25 | BRD-06 |

Running feature count: **75 / 92** specified (10 Ch 2 + 10 Ch 3 + 16 Ch 4 + 8 Ch 5 + 8 Ch 6 + 8 Ch 7 + 8 Ch 8 + 7 Ch 9).

---
*End of Volume 2, Chapter 9. Next: Volume 2, Chapter 10 — Consolidated Backlog, Edge Case Index & Acceptance Criteria Index.*
