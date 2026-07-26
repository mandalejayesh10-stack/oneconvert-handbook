# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 8 — Cloud, Sync, Search & Organization Features

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 1 (Framework, BRD/PRD structure, NFR baseline, prioritization rules), Chapter 2 (Account, Identity, Subscription — Cloud storage quota & sync entitlements), Chapter 3 (Scanner intake), Chapter 4 (PDF Engine document structure), Chapter 5 (OCR Engine searchable text layers)

---

## 8.0 Chapter Scope

This chapter documents the features in the **Cloud, Sync, Search, and Organization** PRD domains (Chapter 1, Section 1.3). While processing engines (PDF, OCR, Office, Media) transform files, this domain governs how documents are stored, synchronized across devices, searched, organized, shared, and managed throughout their lifecycle.

Cloud synchronization and cross-device availability deliver BRD-04 (Flutter multi-platform UX) and BRD-05 (AWS Serverless storage infrastructure), while maintaining BRD-06 (offline-first execution).

Eight comprehensive features are specified in this chapter, followed by domain performance and offline NFR addenda.

| # | Feature | Domain | Priority |
|---|---|---|---|
| 1 | Multi-Cloud Provider Storage Integration | Cloud Domain | Must (MVP) |
| 2 | Cross-Device Encrypted Document Sync | Sync Domain | Must (MVP) |
| 3 | Full-Text & Semantic Metadata Search Engine | Search Domain | Must (MVP) |
| 4 | Hierarchical Document Library & Folder System | Organization | Must (MVP) |
| 5 | Secure Sharing & Time-Limited Access Links | Cloud Domain | Should (Fast-follow) |
| 6 | Document Version History & Trash Management | Organization | Must (MVP) |
| 7 | Smart Collections & Auto-Categorization | Organization | Should (Fast-follow) |
| 8 | Offline Storage Manager & Local Cache Optimizer | Organization | Must (MVP) |

---

## 8.1 Feature: Multi-Cloud Provider Storage Integration

**Purpose:** Connect third-party cloud storage accounts (Google Drive, Dropbox, Microsoft OneDrive, Box, iCloud Drive) via OAuth 2.0 to browse, import, export, and auto-sync documents directly between OneConvert and external cloud drives.

**Business Value:** Users rarely keep all their documents inside a single mobile app. Providing seamless integration with Google Drive, OneDrive, and Dropbox allows users to pull files directly from their existing cloud workflows and push converted outputs back to their preferred cloud storage without manual downloading (BRD-01, BRD-02, BRD-05).

**User Story:**
> **US-ORG-01:** As a **freelancer who keeps client files on Google Drive**, I want to connect my Drive account to OneConvert, so that I can select a scanned PDF from Drive, compress it, and save the compressed version straight back to Google Drive.
>
> Acceptance Criteria:
> - Given a user taps "Connect Cloud Storage", when they authorize Google Drive / Dropbox / OneDrive via OAuth 2.0, then their remote file directory appears in the in-app Cloud Browser.
> - Given a remote file selected in the Cloud Browser, when imported, then the file is streamed to OneConvert's local staging area for immediate processing.
> - Given a processed document, when the user selects "Save to Cloud", then the file uploads directly to the user's chosen remote cloud folder.

**Functional Requirements:**
- **FR-ORG-01:** The system shall authenticate third-party cloud storage providers (Google Drive, Dropbox, Microsoft OneDrive, Box) using OAuth 2.0 authorization code flow with PKCE, resulting in secure token storage in the device's secure enclave (Keychain/Keystore).
- **FR-ORG-02:** The system shall present a unified, responsive Cloud Directory Browser displaying remote folders, files, file sizes, and last modified timestamps across connected cloud providers.
- **FR-ORG-03:** The system shall support automatic export to a designated cloud folder (e.g., auto-save scans to Google Drive / OneConvert Scans /), given user configuration.
- **FR-ORG-04:** The system shall refresh expired OAuth access tokens automatically using stored refresh tokens without interrupting user document operations.

**Flow:** Connect Cloud -> Redirect to provider OAuth webview -> User authorizes -> Secure token stored in device Keychain -> Browse remote files -> Select & process file -> Auto-upload or manual save back to cloud.

**Inputs:** OAuth authorization codes; cloud file selection; cloud folder target paths.

**Outputs:** Authenticated cloud sessions; local copy of imported file; uploaded remote file asset.

**Business Logic:**
- **Token Security:** OAuth tokens are never stored in plaintext or sent to OneConvert servers; authentication occurs client-side directly between the device and the cloud provider (BRD-06).
- **Entitlement Enforcer:** Free tier supports 1 connected cloud account (Google Drive or Dropbox); Student & Pro tiers support unlimited connected cloud accounts across all providers.

**Permissions:** Available across all tiers; account connection caps enforced per tier.

**Errors:**
| Error Case | Handling |
|---|---|
| Cloud access token revoked or expired | Prompt user: "Cloud session expired. Please re-authenticate Google Drive." Preserving current work intent. |
| Remote cloud storage full (QuotaExceeded) | Display specific error: "Upload failed: Google Drive storage is full. Please clear space or save locally." |

**Acceptance Tests:** Verify OAuth 2.0 flow completes for Google Drive & OneDrive; verify remote folder contents render accurately; verify uploaded PDF appears in remote cloud directory within 5 seconds.

**Traces to:** BRD-01, BRD-02, BRD-05.

---
## 8.2 Feature: Cross-Device Encrypted Document Sync

**Purpose:** Synchronize document files, folder structures, tags, annotations, and metadata across a user's Android, iOS, and Flutter Web devices via AWS S3/DynamoDB serverless backend, using client-side or transport-layer encryption with automated conflict resolution.

**Business Value:** Users switch seamlessly between their mobile phones (scanning on the go) and laptops/tablets (reviewing, editing, or signing). Cross-device sync ensures documents are available instantly on any screen, driving daily active usage and subscription retention (BRD-02, BRD-04, BRD-05).

**User Story:**
> **US-ORG-02:** As a **student who scanned lecture notes on my phone**, I want those notes to appear automatically in the OneConvert Web app on my laptop when I open it, so that I can read and type notes without emailing files to myself.
>
> Acceptance Criteria:
> - Given a user signed in on phone and laptop, when a document is saved on the phone, then it syncs to the cloud and appears on the laptop document library within 5 seconds.
> - Given document edits made offline on two devices, when both devices reconnect to the internet, then a Conflict Resolution dialog prompts the user to select which version to keep or merge.
> - Given user cloud storage, all document assets stored in AWS S3 are encrypted at rest (AES-256) and in transit (TLS 1.3).

**Functional Requirements:**
- **FR-ORG-05:** The system shall automatically synchronize local SQLite/Hive database metadata and S3 file objects with AWS Cloud infrastructure upon document modification, given an authenticated user session and network connection.
- **FR-ORG-06:** The system shall implement an Offline Sync Queue that records all local document creates, updates, and deletes while offline, replaying changes sequentially upon network restoration (BRD-06).
- **FR-ORG-07:** The system shall implement a 3-Way Vector Clock Conflict Resolution mechanism, detecting concurrent modifications on separate devices and providing a side-by-side visual comparison prompt to resolve conflicts.
- **FR-ORG-08:** The system shall enforce Cloud Storage Space Quotas based on account subscription tier (Free: 1 GB local sync cache / 0 GB cloud sync; Student: 50 GB cloud sync; Pro: 500 GB cloud sync) per Section 2.9.

**Flow:** Document modified locally -> Change recorded in local Sync Journal -> Sync Engine checks network -> If online: Push delta to AWS API Gateway/Lambda -> Lambda updates DynamoDB metadata & S3 binary -> Push notification (AWS SNS/FCM) alerts user's secondary devices -> Secondary device pulls delta.

**Inputs:** Local document state change; network state indicator; user conflict selection.

**Outputs:** Synchronized multi-device state; updated cloud storage quota tally.

**Permissions:** Signed-in Student & Pro tier users.

**Acceptance Tests:** Verify document saved on iOS appears on Web within 5 seconds; verify offline edit queues changes and syncs upon reconnection; verify conflict dialog displays visual preview of competing edits.

**Traces to:** BRD-02, BRD-04, BRD-05, BRD-06.

---

## 8.3 Feature: Full-Text & Semantic Metadata Search Engine

**Purpose:** Provide instantaneous search across all saved documents by filename, tag, category, custom metadata, and full-text content extracted via OCR or native PDF text layers, with keyword highlighting and spatial page jump.

**Business Value:** As a user's library grows to hundreds of documents, finding a specific invoice, lecture note, or contract becomes impossible without deep search. Full-text OCR search makes every scanned paper document instantly searchable, acting as the ultimate digital filing cabinet (BRD-01, BRD-02).

**User Story:**
> **US-ORG-03:** As a **user searching for an old electricity bill scan**, I want to search "Electricity" or "kWh", so that the app finds the exact scanned page even if the file was named "Scan_004.pdf".
>
> Acceptance Criteria:
> - Given a search query (e.g., "Tax Invoice"), when executed, then results list all matching documents with highlighted text snippets and page number indications.
> - Given a search result tapped, when opened, then the document viewer jumps directly to the matching page and highlights the query keyword on the page.
> - Given search filters (Format: PDF/Doc, Date range, Tag: Academic), when applied, then search results update in real time.

**Functional Requirements:**
- **FR-ORG-09:** The system shall build an inverted full-text search index (SQLite FTS5 on-device / AWS OpenSearch in cloud) across all document names, text layers, OCR outputs, tags, and metadata attributes.
- **FR-ORG-10:** The system shall provide instant search results (< 300 ms response time) with keyword snippet highlighting and relevance scoring.
- **FR-ORG-11:** The system shall support advanced search filters: File Type (PDF, DOCX, XLSX, Image), Date Created / Modified range, Tag multi-select, Folder scope, and Document Category.

**Flow:** User types query -> FTS Index searched locally/cloud -> Ranked results list returned with text snippets -> Tap result -> Document opens on exact page with keyword highlighted.

**Inputs:** User search string; filter parameters (date, format, tags).

**Outputs:** Ranked document search results list; page jump index.

**Permissions:** All tiers (on-device local search); Cloud deep search for Student & Pro.

**Acceptance Tests:** Verify search query returns document matching OCR text within 300 ms; verify tapping result opens viewer to matching page; verify date filter narrows result set accurately.

**Traces to:** BRD-01, BRD-02, BRD-04.

---

## 8.4 Feature: Hierarchical Document Library & Folder System

**Purpose:** Organize documents into custom nested folder hierarchies, apply multi-color tags, star favorite files, grid/list view toggles, sort by attributes, and assign custom metadata key-value pairs.

**Business Value:** Flexible folder and tag organization allows users to structure their workspace according to personal or business needs (e.g., University / Semester 1 / Physics or Clients / AcmeCorp / Invoices), building long-term organizational habit retention (BRD-01, BRD-02).

**User Story:**
> **US-ORG-04:** As a **freelancer organizing client projects**, I want to create nested folders for each client and add colored tags (e.g., "Unpaid", "Contract"), so that I can manage my work orderly.
>
> Acceptance Criteria:
> - Given the document library, when a user creates a new folder, then nested sub-folders can be created to arbitrary depth.
> - Given a document, when colored tags are attached, then documents can be filtered by single or multiple tags simultaneously.
> - Given a selection of documents, when dragged into a folder, then file references move to the target folder immediately.

**Functional Requirements:**
- **FR-ORG-12:** The system shall support unlimited nested folder creation, folder renaming, folder color coding, and drag-and-drop file movement.
- **FR-ORG-13:** The system shall support multi-tag creation with custom color labels, allowing multiple tags attached per document.
- **FR-ORG-14:** The system shall provide Favorites / Starred file quick-access views and custom sorting (By Name, Date Modified, Date Created, File Size, File Type).

**Permissions:** Available across all tiers.

**Acceptance Tests:** Verify sub-folder creation up to 5 levels deep; verify dragging file into folder updates parent ID; verify filtering by green tag displays only tagged items.

**Traces to:** BRD-01, BRD-02.

---

## 8.5 Feature: Secure Sharing & Time-Limited Access Links

**Priority:** Should (Fast-follow)

**Purpose:** Share documents via secure, password-protected, and time-expiring web links, allowing recipients to view or download files without creating a OneConvert account.

**Business Value:** Sharing files externally is a primary viral acquisition loop. When a user shares a secure link with a client or classmate, the recipient experiences OneConvert's clean UI, driving brand awareness and new user signups (BRD-01, BRD-02).

**User Story:**
> **US-ORG-05:** As a **freelancer sending a confidential proposal**, I want to create a share link that expires in 48 hours and requires a password, so that only the intended client can view it for a limited time.
>
> Acceptance Criteria:
> - Given a saved document, when "Share Link" is generated, then a unique URL is created (e.g., https://oneconvert.app/s/xyz123).
> - Given optional link protection settings (Set Password, Set Expiry: 1 hr / 24 hrs / 7 days, Disable Download), when configured, then the link enforces those restrictions upon access.
> - Given an expired link, when accessed by a recipient, then an "Access Link Expired" notice is displayed.

**Functional Requirements:**
- **FR-ORG-15:** The system shall generate secure public share URLs backed by AWS CloudFront / API Gateway presigned URL infrastructure.
- **FR-ORG-16:** The system shall support optional password protection (PBKDF2/bcrypt) and expiration TTL (Time-To-Live) on share links.
- **FR-ORG-17:** The system shall provide a Share Analytics dashboard showing link view count, download count, and access timestamps for document owners.

**Permissions:** Student & Pro tier feature.

**Acceptance Tests:** Verify share link opens in incognito web browser; verify password prompt blocks view until valid password entered; verify link returns expired page after TTL elapses.

**Traces to:** BRD-01, BRD-02, BRD-05.

---
## 8.6 Feature: Document Version History & Trash Management

**Purpose:** Protect users against accidental deletion or unwanted edits by providing a 30-day Trash recovery bin and multi-version revision history for all cloud-synced documents.

**Business Value:** Accidental deletion of an important document or bad edit overwrite causes severe user distress. Providing a safety net with version restore and soft-delete trash builds trust and prevents catastrophic data loss (BRD-01, BRD-02).

**User Story:**
> **US-ORG-06:** As a **user who accidentally deleted an important contract PDF**, I want to open the Trash bin and restore it, so that my file is recovered to its original folder without loss.
>
> Acceptance Criteria:
> - Given a deleted document, when deleted, then it moves to the Trash bin where it remains for 30 days before permanent purging.
> - Given a document in the Trash, when "Restore" is tapped, then the document returns to its original folder location with all metadata intact.
> - Given a document edited multiple times, when Version History is viewed, then previous saved versions can be previewed and restored.

**Functional Requirements:**
- **FR-ORG-18:** The system shall implement Soft Delete for all document operations, retaining deleted files in a Trash state for 30 days before background auto-purging.
- **FR-ORG-19:** The system shall maintain a Version History log (up to 10 versions for Student, 50 versions for Pro) in AWS S3 Object Versioning, allowing preview and one-click rollback to prior file states.

**Permissions:** Soft delete Trash available to all tiers; Version History available to Student & Pro tiers.

**Acceptance Tests:** Verify deleted file appears in Trash; verify restoring file puts it back in original folder; verify restoring version 2 of a document reverts binary content accurately.

**Traces to:** BRD-01, BRD-02, BRD-05.

---

## 8.7 Feature: Smart Collections & Auto-Categorization

**Priority:** Should (Fast-follow)

**Purpose:** Automatically categorize incoming scanned or imported documents into smart collections (Receipts, Invoices, Academic Notes, ID Cards & Passports, Legal Contracts, Tax Files) using OCR text pattern matching and computer vision document classifiers.

**Business Value:** Manual folder organization takes effort that many users neglect. Auto-categorization keeps the document library organized effortlessly, automatically grouping receipts for tax season or ID cards for quick travel access (BRD-01, BRD-02).

**User Story:**
> **US-ORG-07:** As a **user scanning receipts throughout the month**, I want OneConvert to automatically tag and group them into a "Receipts & Expense" collection, so that I don't have to manually create folders for every receipt.
>
> Acceptance Criteria:
> - Given a newly scanned document, when processed, then automatic layout and keyword classification assigns it to a Smart Collection (e.g., Receipt, ID Card, Invoice).
> - Given Smart Collections in the sidebar, when tapped, then all documents categorized under that smart rule display dynamically regardless of their physical folder location.

**Functional Requirements:**
- **FR-ORG-20:** The system shall execute document classification rules (detecting keywords like "Invoice", "Tax", "Total Amount", "ID Number", "Passport", "University") during document ingest, assigning automatic category tags.
- **FR-ORG-21:** The system shall provide predefined Smart Collections (Receipts & Invoices, ID & Passports, Academic & Study, Contracts & Legal, Photos & Scans) alongside user-defined custom rule collections.

**Permissions:** Student & Pro tier feature.

**Acceptance Tests:** Verify scanned receipt automatically receives "Receipt" category tag; verify Smart Collection view lists all tagged files.

**Traces to:** BRD-01, BRD-02.

---

## 8.8 Feature: Offline Storage Manager & Local Cache Optimizer

**Purpose:** Monitor device local disk usage, manage cached cloud files, provide manual storage cleanup tools, and alert users before local storage thresholds are exceeded.

**Business Value:** Storing large PDF scans and OCR caches locally can consume device storage on low-spec mobile phones. A smart cache manager keeps the app lightweight, preventing device "Storage Full" crashes (BRD-01, BRD-06).

**User Story:**
> **US-ORG-08:** As a **user with low storage on my phone**, I want to clear temporary processing caches and offload old cloud-synced files, so that OneConvert doesn't take up excessive storage space.
>
> Acceptance Criteria:
> - Given the Storage Manager screen, when opened, then local storage usage is broken down by categories: Local Documents, Cloud Offline Cache, OCR Engine Models, Temporary Staging.
> - Given "Clear Cache" button tapped, when confirmed, then temporary staging files and non-essential caches are deleted without affecting saved documents.

**Functional Requirements:**
- **FR-ORG-22:** The system shall track and display real-time local storage consumption breakdown (Documents, Offline Cache, Staging Trash, Engine Models).
- **FR-ORG-23:** The system shall provide an automated Cache Optimization Policy that purges temporary staging files older than 48 hours and offloads local copies of cloud-synced files when free device storage drops below 500 MB.

**Permissions:** Available across all tiers.

**Acceptance Tests:** Verify Storage Manager displays accurate breakdown; verify Clear Cache deletes temporary files while keeping user documents safe.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 8.9 Performance Requirements (Domain NFR Addendum)

**Functional Requirements:**
- **FR-ORG-24:** The system shall return full-text local search results within 300 milliseconds for a library of 1,000 documents.
- **FR-ORG-25:** The system shall complete cloud metadata synchronization within 2.0 seconds of network connectivity restoration.

**Traces to:** BRD-01, BRD-04, BRD-05, BRD-06.

---

## 8.10 Offline Support (Domain NFR Addendum)

**Functional Requirements:**
- **FR-ORG-26:** The system shall maintain complete library browsing, folder management, tag creation, local search, and offline file access while completely disconnected from the network.
- **FR-ORG-27:** The system shall record all offline library modifications in a local sync journal, replaying changes to AWS Cloud infrastructure upon reconnection.

**Traces to:** BRD-06.

---

## 8.11 Chapter Summary and Traceability Check

| Feature | Priority | FRs | BRD Trace |
|---|---|---|---|
| Multi-Cloud Provider Integration | Must (MVP) | FR-ORG-01 to 04 | BRD-01, BRD-02, BRD-05 |
| Cross-Device Encrypted Document Sync | Must (MVP) | FR-ORG-05 to 08 | BRD-02, BRD-04, BRD-05, BRD-06 |
| Full-Text & Semantic Search Engine | Must (MVP) | FR-ORG-09 to 11 | BRD-01, BRD-02, BRD-04 |
| Hierarchical Library & Folder System | Must (MVP) | FR-ORG-12 to 14 | BRD-01, BRD-02 |
| Secure Sharing & Access Links | Should (Fast-follow) | FR-ORG-15 to 17 | BRD-01, BRD-02, BRD-05 |
| Version History & Trash Management | Must (MVP) | FR-ORG-18 to 19 | BRD-01, BRD-02, BRD-05 |
| Smart Collections & Auto-Categorization | Should (Fast-follow) | FR-ORG-20 to 21 | BRD-01, BRD-02 |
| Offline Storage & Cache Manager | Must (MVP) | FR-ORG-22 to 23 | BRD-01, BRD-04, BRD-06 |
| Performance Requirements (NFR) | Must (MVP) | FR-ORG-24 to 25 | BRD-01, BRD-04, BRD-05, BRD-06 |
| Offline Support (NFR) | Must (MVP) | FR-ORG-26 to 27 | BRD-06 |

Running feature count: **68 / 92** specified (10 Ch 2 + 10 Ch 3 + 16 Ch 4 + 8 Ch 5 + 8 Ch 6 + 8 Ch 7 + 8 Ch 8).

---
*End of Volume 2, Chapter 8. Next: Volume 2, Chapter 9 — Notifications, Admin & Cross-Cutting Features.*
