# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 4 — PDF Engine Features

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 1 (Framework, BRD/PRD structure, NFR baseline, prioritization rules), Chapter 2 (Account, Identity, Subscription — entitlement enforcement gates every tier-gated PDF operation), Chapter 3 (Scanner — PDF Viewer and all PDF Engine features receive files produced by the Scanner domain or the Import flow)

---

## 4.0 Chapter Scope

This chapter documents the features in the **PDF Engine** PRD domain (Chapter 1, Section 1.3). The PDF Engine is the largest single domain by feature count in Volume 2: it encompasses viewing, editing, structuring, securing, annotating, signing, redacting, compressing, converting, and intelligently analysing PDF documents.

The PDF Engine is the core of the paid-tier value proposition (BRD-02): every feature in this chapter except the PDF Viewer baseline is gated at Student or Pro tier, meaning entitlement enforcement (Feature 2.9) is exercised more here than in any other domain. The engine also introduces the first features that depend on server-side async processing (compression, OCR integration, export, AI) — establishing the pattern used by all subsequent engine chapters: client submits a job, backend queues and processes it, client polls or receives a push notification on completion.

Sixteen features are specified. Every feature carries a priority tag per Section 1.8 and traces to at least one BRD row. Features 4.15 (Performance Requirements) and 4.16 (Offline Support) are documented as domain-level non-functional requirement addenda rather than standalone user-facing features, but carry explicit FRs for testability.

| # | Feature | Domain | Priority |
|---|---|---|---|
| 1 | PDF Viewer | PDF Engine | Must (MVP) |
| 2 | Merge PDF | PDF Engine | Must (MVP) |
| 3 | Split PDF | PDF Engine | Must (MVP) |
| 4 | Compress PDF | PDF Engine | Must (MVP) |
| 5 | Organize Pages | PDF Engine | Must (MVP) |
| 6 | Watermark | PDF Engine | Should (Fast-follow) |
| 7 | Password Protection | PDF Engine | Should (Fast-follow) |
| 8 | Unlock PDF | PDF Engine | Should (Fast-follow) |
| 9 | Annotation | PDF Engine | Should (Fast-follow) |
| 10 | Fill and Sign | PDF Engine | Should (Fast-follow) |
| 11 | Redaction | PDF Engine | Could (Backlog) |
| 12 | OCR Integration | PDF Engine | Must (MVP) |
| 13 | Export (PDF to Other Formats) | PDF Engine | Should (Fast-follow) |
| 14 | AI PDF Assistant | PDF Engine | Won't-yet (Future) |
| 15 | Performance Requirements (Domain NFR) | PDF Engine | Must (MVP) |
| 16 | Offline Support (Domain NFR) | PDF Engine | Must (MVP) |

---
## 4.1 Feature: PDF Viewer

**Purpose:** Provide a high-fidelity, performant in-app PDF viewer that renders any PDF document — from a single-page scan to a 1000-page technical manual — with essential reading controls (zoom, scroll, search, bookmarks, dark mode) and handles edge cases like password-protected and large files, without requiring the user to leave the app or use a third-party viewer.

**Business Value:** The PDF Viewer is the foundational surface on which all other PDF Engine features are accessed. A user who cannot reliably open and read their documents within OneConvert will not trust it for editing, annotating, or sharing. The viewer also directly serves the free-tier acquisition goal (BRD-01) — the ability to view any PDF at no cost gives new users immediate value before they encounter a paid-feature prompt.

**User Story:**
> **US-PDF-01:** As a **student who has just scanned a 40-page textbook chapter**, I want to open the resulting PDF and read it in-app with smooth scrolling and the ability to jump to a specific page, so that I can verify the scan quality and use it for studying without exporting it to another app.
>
> Acceptance Criteria:
> - Given I open a saved PDF, when the viewer loads, then the first page renders within 2 seconds for files under 50 MB on a mid-range device.
> - Given I have a multi-page PDF open, when I scroll, then pages load lazily (only visible pages are rendered at full resolution; upcoming pages are pre-rendered at thumbnail resolution).
> - Given I search for a word, when I submit the query, then all matching occurrences are highlighted and I can step through them with next/previous controls.
> - Given the PDF is password-protected, when I open it, then I am prompted for the password before the viewer renders any content.

**Functional Requirements:**
- **FR-PDF-01:** The system shall render PDF pages using a native or cross-platform PDF rendering engine, given a valid PDF file path is provided to the viewer, resulting in accurate, anti-aliased page rendering at the device's display resolution.
- **FR-PDF-02:** The system shall implement infinite (lazy-loading) scrolling for multi-page PDFs, given the document has more than one page, resulting in only a configurable window of pages being held in memory at any time (default: 3 rendered pages + 2 thumbnail-pre-rendered pages ahead and behind the viewport).
- **FR-PDF-03:** The system shall provide pinch-to-zoom and double-tap-to-zoom controls, given the viewer is active, resulting in smooth zoom from fit-to-width up to 500% with no re-render lag at the zoomed level.
- **FR-PDF-04:** The system shall provide a searchable text layer within the viewer, given the PDF contains a text layer (either native or OCR-generated), resulting in keyword search with highlighted matches and next/previous navigation.
- **FR-PDF-05:** The system shall provide a bookmark feature allowing the user to mark and name specific pages, given a signed-in session, resulting in bookmarks persisted to the document's metadata record and accessible from a bookmark panel within the viewer.
- **FR-PDF-06:** The system shall provide a dark mode rendering option within the viewer, given the user enables it, resulting in an inverted or sepia-toned rendering that reduces eye strain in low-light conditions without altering the underlying document.
- **FR-PDF-07:** The system shall prompt for a password and decrypt the PDF before rendering any content, given a password-protected PDF is opened, resulting in decryption occurring client-side for standard encryption standards (AES-128, AES-256) with no plaintext content exposed until the correct password is entered.

**Flow:** User taps a saved document -> viewer opens -> loading indicator shown while first page renders -> page-strip thumbnail panel available on swipe -> user reads, zooms, scrolls, searches, or bookmarks -> exit viewer returns to document library.

**Inputs:** PDF file (local path or cloud reference); user password (for protected files); search query; bookmark name.

**Outputs:** Rendered page views; search result highlight set; saved bookmark records; viewer state (last-read page) persisted per document.

**Business Logic:**
- Last-read page position is saved per document automatically on exit, so reopening a document resumes at the last viewed page (not page 1).
- Page thumbnail strip (sidebar or bottom strip) is generated lazily from the full document; thumbnails are cached to disk so they do not need to be re-rendered on subsequent opens.
- Search is executed against the text layer; for image-only PDFs (no text layer), search returns "no text layer found — run OCR to enable search" rather than silently returning zero results.
- Dark mode is applied as a render-time filter only (invert or sepia matrix applied to the rendered image); the underlying PDF bytes are never modified.
- For files over 100 MB, the viewer displays a "large file" indicator and pre-renders only 1 page ahead/behind the viewport to conserve memory (adaptive lazy-loading window).
- Bookmarks are a signed-in-only feature; guest users can view but not create persistent bookmarks (bookmark data has no anonymous-UUID-scoped storage path).

**Permissions:**
- PDF Viewer (open, scroll, zoom): All users including guests. Free tier.
- Search within PDF: Free tier (text-layer PDFs only); OCR-generated searchable PDFs require OCR Engine entitlement (Chapter 5).
- Bookmarks: Signed-in users only (any tier).
- Password-protected PDF opening: All users (the password is the access control, not the tier).
- Dark mode: All users.

**Errors:**
| Error Case | Handling |
|---|---|
| PDF file is corrupted or malformed | Reject with a specific "this PDF appears to be damaged" error; offer to re-scan or re-import |
| Wrong password entered for a protected PDF | Clear the password field and re-prompt with a specific "incorrect password" message; do not expose any page content |
| Insufficient memory to render a very large page (e.g., a 600 DPI engineering drawing) | Render at a reduced resolution with a warning banner; do not crash |
| PDF uses an unsupported encryption scheme | Notify the user that this encryption type is not supported; suggest decrypting with the original creating app |

**Limitations:**
- PDF forms (interactive AcroForms) are rendered as visual-only in the viewer in MVP; interactive form filling is handled by the Fill and Sign feature (Section 4.10), not the core viewer.
- Annotations created by other apps (e.g., Adobe Acrobat) are rendered as part of the page content but may not be editable within OneConvert MVP (annotation editing is Section 4.9).
- On Flutter Web, very large PDFs (above 200 MB) may exhibit slower rendering due to browser memory constraints; a file-size advisory is shown for files above 100 MB on Web.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| PDF has 1000+ pages | Viewer handles gracefully via lazy loading; thumbnail strip shows a representative sample and paginated loading; no crash or freeze on open | Major |
| PDF contains embedded video or JavaScript | Media/script elements are ignored (not executed); the page is rendered as a static image for that region with a note "embedded media not supported" | Minor |
| User rotates device while on page 47 | Viewer re-renders in the new orientation and returns to page 47, not page 1 | Minor |
| PDF opened while device is offline | If the file is local, it opens normally; if the file is cloud-only (not yet downloaded), a specific "file not available offline" error is shown | Major |

**Acceptance Tests:** Verify a 500-page PDF opens without crash and scrolls smoothly; verify search highlights the correct text on the correct pages; verify password prompt blocks content before correct password entry; verify last-read page is restored on reopen; verify dark mode does not modify the underlying file.

**Future Enhancements:** Page thumbnails panel with drag-to-navigate; presentation/fullscreen mode; reading rulers and text selection for copy; cross-reference and hyperlink navigation within the PDF; continuous reading mode with auto-scroll.

**Traces to:** BRD-01, BRD-02, BRD-04, BRD-06.

---
## 4.2 Feature: Merge PDF

**Purpose:** Combine two or more PDF files — or a mix of PDFs and images — into a single, ordered PDF document, with the user in full control of source selection, page ordering, and duplicate handling before the merge is committed.

**Business Value:** Merge is one of the highest-frequency PDF operations across all personas (BRD-02): students merge chapter scans into a single submission; freelancers merge contract pages; teachers merge assignment handouts. It is a core MVP feature and a primary upsell driver for Free-tier users who hit a file-count limit and see the Pro unlock path.

**User Story:**
> **US-PDF-02:** As a **student who has scanned three separate sections of a report on different days**, I want to merge those three PDFs into one document and control the order of the sections, so that I can submit a single file to my university portal.
>
> Acceptance Criteria:
> - Given I open the Merge PDF tool, when I select files, then I can pick multiple PDFs from my library, device storage, or cloud (if signed in) in a single selection flow.
> - Given I have selected files, when I drag a file card to a new position in the merge queue, then the page order preview updates immediately.
> - Given I trigger the merge, when processing completes, then the output is a single PDF containing all pages from all source files in the specified order, with no content loss.

**Functional Requirements:**
- **FR-PDF-08:** The system shall allow the user to select two or more PDF or image files (JPEG, PNG, TIFF) as merge sources from the local library, device file picker, or connected cloud storage, given the Merge PDF tool is active, resulting in a populated merge queue displaying each source as a reorderable card showing a first-page thumbnail and file name.
- **FR-PDF-09:** The system shall support drag-to-reorder of source files in the merge queue, given the merge queue is displayed, resulting in the final merged PDF reflecting the user-defined sequence.
- **FR-PDF-10:** The system shall detect and surface duplicate files in the merge queue (same file added twice), given the user adds a source that is already in the queue, resulting in a duplicate warning with options to keep both, keep one, or cancel.
- **FR-PDF-11:** The system shall display a real-time progress indicator during merge processing, given a merge job is submitted, resulting in per-source-file progress visibility and a final completion confirmation with the output file ready to open or share.
- **FR-PDF-12:** The system shall support batch merge (multiple merge jobs queued sequentially), given the user submits additional merge jobs while one is processing, resulting in jobs queued and processed in order without requiring the user to wait for each one before starting the next.

**Flow:** User opens Merge PDF -> selects sources (local / picker / cloud) -> reorders cards via drag -> reviews page count and estimated output size -> taps Merge -> progress indicator shows -> on completion: output PDF appears in library with merge summary (source count, total pages, file size) -> Share / Open actions available.

**Inputs:** Two or more PDF/image source file references; user-defined order array; output document name (defaulting to "Merged_<date>").

**Outputs:** Single merged PDF file in the local document library; merge job metadata record (sources used, merge timestamp, output path).

**Business Logic:**
- Merging is performed server-side for files above a configurable size threshold (default: total source bytes above 50 MB) to avoid OOM issues on low-RAM devices; small merges can be performed on-device.
- For server-side merges, source files are uploaded to a temporary S3 location with a short-lived pre-signed URL; the merged output is returned to S3 and downloaded to the client. All temporary files are purged from S3 within a configurable TTL (default: 24 hours) regardless of whether the client collected the output.
- Image sources (JPEG, PNG, TIFF) are each treated as a single PDF page in the merge order.
- Metadata (author, title, keywords) from source PDFs is not merged into the output in MVP — the output PDF has OneConvert-generated metadata only. Metadata preservation is a fast-follow option.
- Free tier: merge is limited to 2 source files per operation. Student and Pro tiers: unlimited source files. This limit is enforced server-side (per Entitlement Enforcement, Section 2.9), not just in the UI.

**Permissions:**
- Free tier: merge of up to 2 files (local files only; no cloud source).
- Student / Pro tier: unlimited sources; cloud source support enabled.

**Errors:**
| Error Case | Handling |
|---|---|
| A source file is deleted between selection and merge execution | Skip the missing file with a warning; offer to proceed with remaining sources or cancel |
| Server-side merge fails (processing error) | Return a specific job-failure status; preserve source files; allow the user to retry the job without reselecting sources |
| Output exceeds local storage available | Notify the user before download begins; offer cloud save as an alternative destination |
| Free-tier user attempts to add a third file | Surface a specific upgrade prompt referencing the Merge limit; do not silently discard the third file |

**Limitations:**
- In MVP, merge does not support selecting individual page ranges from each source (e.g., "merge pages 3-7 of File A with pages 1-2 of File B") — that combination requires Split (Section 4.3) followed by Merge. Page-range selection within merge is a fast-follow enhancement.
- Batch merge queue is limited to 5 simultaneous jobs per user to prevent backend resource exhaustion; additional jobs are queued client-side.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User merges a password-protected PDF as a source | Prompt for the source PDF's password before including it in the merge; if password is not provided, exclude that source with a warning | Major |
| Merge of 50 large PDFs totaling 2 GB | Job is accepted and queued; user is notified this is a large job with an estimated time range; standard async job pattern applies | Minor |
| User renames or moves a source file mid-merge (local file) | The merge engine works from a read copy captured at job-submission time; rename/move does not affect the in-progress job | Minor |
| Two users merge the same source cloud file simultaneously | No conflict: each job operates on an independent copy; server-side processing is stateless per job | Minor |

**Acceptance Tests:** Verify a 3-file merge produces a PDF with the correct total page count in the correct order; verify the server-side path is triggered for large files and produces an identical result to the on-device path; verify the Free-tier 2-file limit is enforced server-side; verify duplicate detection fires and the user choice is respected.

**Future Enhancements:** Per-source page range selection within the merge flow; merge metadata options (preserve/override title, author); merge as a batch-scheduled background task; merge with automatic page-size normalization (fit all pages to the largest source page size).

**Traces to:** BRD-01, BRD-02, BRD-05.

---
## 4.3 Feature: Split PDF

**Purpose:** Divide a single PDF into multiple smaller PDFs by splitting every page into its own file, by defining custom page ranges, or by extracting a specific selection of pages — with a preview of the split result before committing, and batch export of all output files.

**Business Value:** Split is the complement of Merge and equally high-frequency: teachers split a combined curriculum PDF into per-topic handouts; freelancers extract specific pages from contracts for clients; students extract chapters for focused study. It is a core MVP feature and a top-of-funnel conversion driver (BRD-02), since splitting is the first operation where Free-tier limitations become visibly frustrating and the Pro upgrade CTA is most effective.

**User Story:**
> **US-PDF-03:** As a **teacher with a 200-page curriculum PDF**, I want to split it into 10 chapter PDFs by specifying the page range for each chapter, so that I can distribute each chapter separately to students without manual copy-paste.
>
> Acceptance Criteria:
> - Given I open the Split PDF tool with a multi-page PDF, when I select "Split by range" and define ranges (e.g., 1-20, 21-45, 46-80), then a preview shows the number of output files and pages per file before I confirm.
> - Given I confirm the split, when processing completes, then each defined range is saved as a separate, correctly ordered PDF in my library.
> - Given I select "Extract selected pages," when I check individual page thumbnails, then only those pages appear in the output PDF.

**Functional Requirements:**
- **FR-PDF-13:** The system shall split a PDF into individual single-page PDFs (one output file per page), given the user selects "Split every page," resulting in N output PDFs where N equals the source document's page count, each named by page number.
- **FR-PDF-14:** The system shall split a PDF according to user-defined page ranges, given the user selects "Split by range" and enters one or more non-overlapping page ranges, resulting in one output PDF per defined range containing only the pages in that range in their original order.
- **FR-PDF-15:** The system shall allow extraction of individually selected pages into a single output PDF, given the user selects "Extract selected pages" and picks pages from the thumbnail grid, resulting in a new PDF containing only the selected pages in document order.
- **FR-PDF-16:** The system shall present a pre-split preview panel showing the number of output files, pages per output, and estimated file sizes before the split is executed, given any split mode is configured, resulting in the user being able to verify the configuration before any processing begins.

**Flow:** User opens Split PDF with a source document -> selects split mode (every page / by range / extract selected) -> (by range: enters range strings; extract selected: taps page thumbnails to select) -> preview panel shows output summary -> user confirms -> async split job runs -> on completion: all output files appear in the library under a split-set folder named after the source document -> batch export / share all option available.

**Inputs:** Source PDF file; split mode selection; page ranges (text, e.g., "1-20, 21-45") or selected page set; output naming convention choice.

**Outputs:** One or more split PDF files in the local library; a split-set metadata record grouping the outputs by their source document.

**Business Logic:**
- Page range validation: ranges must not overlap, must not reference pages outside the source's page count, and must not be empty. Validation occurs client-side with specific error messages before job submission.
- "Split every page" on a 500-page PDF produces 500 output files; the user is warned of the volume and storage implications before confirmation.
- Output file naming defaults: "every page" mode produces <SourceName>_p001.pdf, _p002.pdf,...; "by range" mode produces <SourceName>_1-20.pdf, _21-45.pdf,...; "extract selected" produces <SourceName>_extracted.pdf.
- Splitting is performed server-side for source files above 50 MB; on-device for smaller files (same threshold as Merge, Section 4.2).
- Free tier: not available (split is a Pro/Student feature; the tool entry point in the UI shows an upgrade prompt for Free users). Student / Pro: unlimited splits, unlimited output files.

**Permissions:** Student / Pro tier only. Free-tier users see the feature in the UI but are routed to an upgrade prompt on selection.

**Errors:**
| Error Case | Handling |
|---|---|
| Page range references pages beyond the document length | Reject the range with a specific inline error ("Page X does not exist in this document; it has N pages") before job submission |
| Overlapping ranges defined | Highlight the conflicting ranges with a specific inline error; do not submit the job until resolved |
| Split produces more output files than local storage can hold | Warn the user before committing; offer cloud save for the output set |
| Source file is password-protected | Prompt for the password before loading the split tool; the tool does not function on an undecrypted source |

**Limitations:**
- "Split by range" in MVP accepts ranges defined as a text string (e.g., "1-20, 21-45"). A visual drag-to-define range interface is a fast-follow enhancement.
- Batch split (splitting multiple source PDFs in one operation) is not in MVP scope; each split operation targets one source document.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User defines a single-page range (e.g., "5-5") | Valid; produces a one-page PDF. No error. | Minor |
| User selects all pages in "extract selected" mode | Equivalent to a copy of the full source document; produce the output with a warning that all pages were selected | Minor |
| Split every page on a 1-page PDF | Produces exactly 1 output file identical to the source; a notification clarifies the result | Minor |
| Network drops mid server-side split | Job state is preserved server-side; client can poll for completion or receive a push notification when done; output is available for download when ready | Major |

**Acceptance Tests:** Verify "split every page" on a 10-page PDF produces exactly 10 files each with 1 page; verify "by range" with ranges 1-3, 4-7, 8-10 produces 3 files with 3, 4, and 3 pages respectively; verify overlapping ranges are caught before submission; verify the pre-split preview matches the actual output; verify the Free-tier block fires server-side even if the client-side gate is bypassed.

**Future Enhancements:** Visual drag-to-define range interface; split by bookmarks (using the PDF's existing bookmark/outline structure as split points); batch split across multiple source documents; split and immediately email each output to a different recipient.

**Traces to:** BRD-02, BRD-05.

---
## 4.4 Feature: Compress PDF

**Purpose:** Reduce the file size of a PDF document through image downsampling, content stream optimization, and optionally lossless structural compression — with user-selectable quality presets, an estimated output size preview before processing, and a side-by-side quality comparison after processing.

**Business Value:** Compression is among the top three most-used PDF tools across the target personas (BRD-02): students compress scanned PDFs to meet submission portal size limits (common: 5 MB, 10 MB caps); freelancers compress client deliverables for email attachment limits; government workers compress files for portal uploads. This is a high-conversion upsell moment: Free-tier users who encounter a portal size limit and see the compress tool are among the most likely to upgrade immediately.

**User Story:**
> **US-PDF-04:** As a **student whose 22 MB scanned PDF exceeds the 10 MB portal limit**, I want to compress it to below 10 MB with the minimum possible quality loss, so that I can submit it without re-scanning at lower resolution.
>
> Acceptance Criteria:
> - Given I open the Compress PDF tool, when I select a compression level, then an estimated output size is shown before I commit to processing.
> - Given I confirm compression, when processing completes, then the output file is smaller than the input file and the PDF remains valid and openable.
> - Given compression completes, when I tap "Compare," then I see a side-by-side or overlay view of a representative page from the original and compressed versions.

**Functional Requirements:**
- **FR-PDF-17:** The system shall provide three compression presets — Low (maximum quality, minimal size reduction), Medium (balanced quality and size), High (maximum size reduction, noticeable quality impact) — given the Compress PDF tool is active, resulting in the user having a clear, named choice rather than a raw quality percentage slider.
- **FR-PDF-18:** The system shall display an estimated output file size for the selected compression preset before the user confirms processing, given a preset is selected, resulting in the user being able to judge whether the compression meets their target before committing.
- **FR-PDF-19:** The system shall apply image downsampling (reducing embedded image DPI to a preset target) as the primary compression mechanism for image-heavy PDFs, given compression is executed, resulting in a valid output PDF with reduced image resolution matching the selected preset.
- **FR-PDF-20:** The system shall provide a lossless compression option (structure and stream optimization without image quality reduction), given the user selects it, resulting in size reduction through PDF structural optimization only, with no pixel-level quality change to embedded images.
- **FR-PDF-21:** The system shall present a quality comparison view after compression, given processing is complete, resulting in the user being able to inspect a zoomed-in region of the original versus compressed page side-by-side before deciding to save the output or discard it and retry with a different preset.

**Flow:** User opens Compress PDF with source document -> selects preset (Low / Medium / High / Lossless) -> estimated size shown -> user confirms -> async compression job submitted -> progress indicator -> on completion: comparison view shown (original vs. output) -> user accepts (output saved to library) or rejects (discard output, try different preset) -> if accepted: original preserved as backup for a configurable period (default: 7 days) before auto-deletion.

**Inputs:** Source PDF; selected compression preset; lossless toggle.

**Outputs:** Compressed PDF in the local library; compression report metadata (original size, output size, compression ratio, preset used, processing time).

**Business Logic:**
- Image downsampling targets by preset:
  - Low: 200 DPI (highest quality retained)
  - Medium: 150 DPI (standard document quality)
  - High: 96 DPI (screen-resolution quality, maximum size reduction)
  - Lossless: No image downsampling; applies PDF content stream compression (Flate/ZLIB) and removes redundant objects only.
- The estimated size shown before processing is a heuristic (based on the ratio of image bytes to total file size and the target DPI reduction). It is presented as a range (e.g., "estimated 6–9 MB") not a precise figure, to set correct expectations.
- Compression is always server-side (Lambda + processing library, Volume 8 Engine decision) to ensure consistent output quality regardless of device capability.
- The original file is never overwritten: the compressed output is a new file. The user explicitly chooses to keep or discard the output after viewing the comparison.
- Free tier: Compress PDF is not available (upgrade prompt shown). Student / Pro: unlimited compressions.

**Permissions:** Student / Pro tier only.

**Errors:**
| Error Case | Handling |
|---|---|
| Compression produces a file larger than the source (can happen with lossless on already-optimised PDFs) | Display the result clearly ("compressed file is larger than original — your PDF was already well-optimised"); recommend the user try a different preset or accept no change |
| Source file is password-protected | Prompt for password before processing; the compression engine must decrypt, compress, and re-encrypt the output with the same password |
| Server-side compression job times out (very large or complex PDF) | Return a timeout status; offer to retry; for consistently failing files, suggest splitting the PDF first and compressing sections |

**Limitations:**
- Compression quality is not guaranteed to meet a specific target file size (e.g., "compress to under 5 MB") in MVP — that feature requires iterative binary-search compression and is a fast-follow enhancement.
- Lossless compression may achieve 5-20% size reduction on typical scanned PDFs and up to 40-60% on PDFs with significant redundant structure; results vary by source file.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User runs High compression on an already-High-compressed PDF | Output may be marginally smaller or identical; comparison view makes this visible; no error | Minor |
| PDF contains vector graphics (not rasterised images) | Vector content is unaffected by image downsampling; size reduction will be less than expected; the comparison view should be used to assess the result | Minor |
| User closes the app during compression (server-side job) | Job continues server-side; push notification sent on completion; output available for download on next app open | Minor |

**Acceptance Tests:** Verify a 20 MB image-heavy PDF compressed at High preset produces a file measurably smaller than the source and renders correctly in the viewer; verify the estimated size shown before processing is within 30% of the actual output size; verify the comparison view renders at a zoom level sufficient to assess quality difference; verify the lossless option produces an output identical in visual quality to the source.

**Future Enhancements:** Target-size compression (user inputs a desired maximum output size and the engine iterates to achieve it); per-image compression settings for PDFs with mixed image types; compression of embedded fonts and metadata; integration with the Batch Scan workflow (auto-compress on save).

**Traces to:** BRD-01, BRD-02, BRD-05.

---
## 4.5 Feature: Organize Pages

**Purpose:** Provide a full-page-management suite within an existing PDF — rotate individual or multiple pages, delete pages, duplicate pages, insert blank pages, insert pages from another PDF, and reorder pages via drag — all within a thumbnail-grid editor before committing changes to the document.

**Business Value:** Page organization is the "table editor" of the PDF world — it is used constantly and its absence in a PDF tool is felt immediately. This is an MVP feature that serves all paid personas (BRD-02) and represents a key differentiator from basic free tools that offer only view-only or single-operation access.

**User Story:**
> **US-PDF-05:** As a **freelancer who realises the pages of a scanned contract are in the wrong order and one is upside-down**, I want to reorder the pages by drag, rotate the upside-down page, and delete a duplicate page that was accidentally scanned twice, all in one editing session before saving, so that I don't have to re-scan the entire document.
>
> Acceptance Criteria:
> - Given I open Organize Pages for a document, when the thumbnail grid loads, then I see every page as a numbered thumbnail that I can tap to select.
> - Given I select multiple pages (multi-select), when I choose "Rotate 90 clockwise," then all selected pages rotate and the thumbnails update immediately.
> - Given I drag a page thumbnail to a new position, when I release, then the page order updates instantly in the grid and is reflected in the saved document.

**Functional Requirements:**
- **FR-PDF-22:** The system shall display all pages of a PDF as a scrollable thumbnail grid in the Organize Pages editor, given the editor is opened, resulting in each page shown with its page number and current rotation state, with support for pages up to 1000+.
- **FR-PDF-23:** The system shall support rotating selected pages in 90-degree increments (clockwise and counter-clockwise), given one or more pages are selected, resulting in the rotation being applied to the page content (not just the viewport) and committed to the saved document.
- **FR-PDF-24:** The system shall support deletion of selected pages with a confirmation step, given one or more pages are selected and delete is tapped, resulting in those pages being permanently removed from the document on save, not merely hidden.
- **FR-PDF-25:** The system shall support duplicating selected pages (inserting a copy immediately after the original), given one or more pages are selected and duplicate is tapped, resulting in exact copies inserted at the correct positions with updated page numbers.
- **FR-PDF-26:** The system shall support inserting a blank page at a specified position, given the user taps "Insert blank page" and selects an insertion point, resulting in a blank white page of the same dimensions as the adjacent page inserted at that position.
- **FR-PDF-27:** The system shall support inserting pages from another PDF at a specified position in the current document, given the user selects a source PDF from the library or file picker and specifies an insertion point, resulting in the selected pages from the source being inserted into the target document at the correct position.

**Flow:** User opens Organize Pages -> thumbnail grid loads (lazy for large documents) -> user performs edits (rotate, delete, duplicate, insert, reorder via drag) -> all edits are applied to an in-memory edit stack (not to the file) -> user taps Save -> all edits are committed to a new version of the PDF (original preserved as previous version for a configurable undo period) -> saved document updated in library.

**Inputs:** Source PDF; user edit operations (type, target pages, parameters); insertion source PDF (for insert-from-PDF); blank page insertion position.

**Outputs:** Revised PDF with all committed edits applied; edit history metadata (for undo support within the session).

**Business Logic:**
- All edits within a session are non-destructive until the user taps Save: the underlying PDF file is not modified during editing, only the in-memory edit stack is updated. This allows unlimited undo/redo within the session.
- Rotation is stored as a PDF rotation value (0, 90, 180, 270 degrees) in the page dictionary, not as a new rasterised image — this preserves text layer quality and keeps file size stable.
- Multi-select: the user can tap individual pages to select them, or use "Select all" to select the entire document. A selection counter is shown in the toolbar.
- Reorder is implemented as a drag-to-new-position gesture. On the Web platform (BRD-04), this uses mouse drag events and is explicitly tested for parity.
- Insert-from-PDF: the user selects a source document and then selects which pages of that document to insert (all pages or a range). This is a lightweight version of Merge scoped to page-level insertion.
- Saving commits all edits in one server-side or on-device operation; partial saves (committing some edits and leaving others pending) are not supported.

**Permissions:** Student / Pro tier only. Free-tier users see an upgrade prompt when opening the Organize Pages tool.

**Errors:**
| Error Case | Handling |
|---|---|
| User attempts to delete all pages of a document | Block the action with a specific error: "A PDF must contain at least 1 page." The delete action is not permitted if it would leave an empty document |
| Insert-from-PDF source is the same as the target document | Disallow self-insertion to prevent circular references; show a specific error |
| Drag-to-reorder on a very long document (1000 pages) causes performance lag | Implement virtual scrolling on the thumbnail grid so only visible thumbnails are rendered; reorder operation applies to the index array, not to rendered thumbnails |

**Limitations:**
- In MVP, only one document version is preserved as "previous" after a save (one-level history). A full version history with named versions is a fast-follow enhancement.
- The insert-from-PDF feature in MVP inserts all pages of the selected range at one insertion point; multiple insertion points in a single operation are not supported.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User rotates a page, then undoes, then saves | The undo stack is applied correctly; the saved document reflects the pre-rotation state | Minor |
| User drags Page 1 to the last position (reversing a 2-page document) | Valid operation; the saved document has the pages in the new order | Minor |
| Insert-from-PDF source is password-protected | Prompt for the source PDF's password before page selection is available | Major |
| User applies 20 consecutive edits and runs out of memory | Edit stack is serialised to disk as a journal file; the session continues without in-memory loss | Minor |

**Acceptance Tests:** Verify rotating page 3 of a 5-page PDF and saving produces a PDF where page 3's content is rotated 90 degrees in the output; verify deleting pages 2 and 4 from a 5-page PDF produces a 3-page output; verify drag-reorder of pages produces the correct page sequence in the saved file; verify all pages can be selected and rotated in one operation.

**Future Enhancements:** Drag-to-select (rubber-band selection) for non-contiguous page ranges; full named version history; page dimension editor (resize individual pages); flatten annotations before save option within Organize Pages.

**Traces to:** BRD-02, BRD-05.

---
## 4.6 Feature: Watermark

**Purpose:** Apply a text or image watermark to every page (or a specified subset of pages) of a PDF — with full control over opacity, rotation, position, and page targeting — and commit the watermark permanently to the output file.

**Business Value:** Watermarking is a standard professional document workflow for protecting drafts ("CONFIDENTIAL"), branding deliverables (logo watermark), and marking document status ("DRAFT", "FOR REVIEW"). It is a Fast-follow feature that extends the Pro-tier value proposition (BRD-02) beyond basic editing into professional document production workflows.

**User Story:**
> **US-PDF-06:** As a **freelancer sharing a draft proposal with a client**, I want to watermark every page of the PDF with the word "DRAFT" in red, semi-transparent text at a 45-degree diagonal, so that the client cannot mistake the document for a final deliverable.
>
> Acceptance Criteria:
> - Given I open the Watermark tool, when I configure a text watermark with "DRAFT" in red at 45 degrees and 50% opacity, then a live preview page shows the watermark as it will appear on the output.
> - Given I confirm the watermark, when processing completes, then every page of the output PDF has the watermark permanently embedded.
> - Given I want to watermark only the first and last pages, when I specify the page range, then only those pages carry the watermark in the output.

**Functional Requirements:**
- **FR-PDF-28:** The system shall support text watermarks with configurable font, size, colour, opacity (0-100%), rotation (-180 to +180 degrees), and position (predefined positions: centre, top-left, top-right, bottom-left, bottom-right, and free-position via offset), given the user selects text watermark mode, resulting in a configurable text watermark specification.
- **FR-PDF-29:** The system shall support image watermarks (JPEG, PNG) with configurable opacity, rotation, scale (as a percentage of page width), and position, given the user selects image watermark mode and provides an image from the device gallery or library, resulting in the image embedded as a transparent overlay on each target page.
- **FR-PDF-30:** The system shall provide a live preview of the watermark on a representative page of the document (defaulting to page 1), given any watermark parameter is changed, resulting in the preview updating within 1 second of the parameter change to reflect the configured appearance.
- **FR-PDF-31:** The system shall apply the watermark to user-specified pages (all pages, first page only, last page only, odd pages, even pages, or a custom page range), given the user specifies a page target rule, resulting in only the targeted pages carrying the watermark in the output.
- **FR-PDF-32:** The system shall embed the watermark permanently into the PDF page content (as a PDF content stream element, not as an annotation layer), given the user confirms and processing completes, resulting in a watermark that cannot be trivially removed by PDF readers or annotation erasure.

**Flow:** User opens Watermark tool with source document -> selects watermark type (text / image) -> configures parameters -> live preview updates on representative page -> sets page target rule -> confirms -> async job processes -> output PDF in library with watermark embedded -> original preserved.

**Inputs:** Source PDF; watermark type and parameters (text string / image file, font, size, colour, opacity, rotation, position, scale); page target rule.

**Outputs:** Watermarked PDF in the local library; watermark specification metadata (for reference, not for re-editing the already-committed watermark).

**Business Logic:**
- Watermarks are embedded as PDF content stream elements (drawn before page content to appear "behind" text, or after to appear "in front"). The default is "in front" (over content) so the watermark is visible over images and graphics. A "behind content" option is available for translucent watermarks on text pages where readability is important.
- Text watermarks use a PDF-standard font (Helvetica as default; the user can select from a curated set of 5-8 fonts). Custom font embedding is a fast-follow enhancement.
- Image watermarks: the image is scaled to the user-configured percentage of the page width, maintaining aspect ratio. Opacity is applied via a PDF transparency group.
- Processing is server-side for all watermark jobs, to ensure consistent rendering of fonts and images across page dimensions that may vary.
- Free tier: not available. Student / Pro: available.

**Permissions:** Student / Pro tier only.

**Errors:**
| Error Case | Handling |
|---|---|
| Watermark text is empty | Disable the "Apply" button; inline validation message: "Watermark text cannot be empty" |
| Uploaded watermark image exceeds 5 MB | Reject with a specific message and suggest compressing the image before use |
| Source PDF is password-protected | Prompt for password before opening the watermark tool |

**Limitations:**
- MVP does not support removing a watermark after it has been embedded (redaction can be used for this, Section 4.11, but it is not a clean undo).
- Multiple simultaneous watermarks (e.g., a text watermark and an image watermark in the same operation) are not supported in MVP; one watermark type per operation.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| Watermark text contains special characters or Unicode (e.g., Hindi script) | Render using a font that supports the character set; if the default font does not support the characters, fall back to a Unicode-capable font automatically | Minor |
| Page target rule specifies "even pages" on a 1-page document | Zero pages are watermarked; output is identical to source; user is informed "no pages matched the specified rule" | Minor |
| Image watermark with full opacity (100%) covers all page content | Valid operation (user intent may be to obscure content); no error; the comparison preview makes the result obvious before committing | Minor |

**Acceptance Tests:** Verify a text watermark at 45-degree rotation appears correctly oriented on all pages of the output; verify opacity 50% produces a clearly semi-transparent watermark; verify the page target rule "odd pages only" watermarks only odd pages; verify the watermark cannot be removed by toggling annotation visibility in a standard PDF reader (i.e., it is embedded in the content stream, not an annotation).

**Future Enhancements:** Multiple simultaneous watermarks; custom font upload for text watermarks; "behind content" vs "over content" toggle per watermark; watermark templates (save and reuse a watermark configuration); QR code watermark generator.

**Traces to:** BRD-02, BRD-05.

---
## 4.7 Feature: Password Protection

**Purpose:** Add password-based access control to a PDF document — setting an open password (required to view), a permissions password (required to change document restrictions), and configurable restriction flags (printing, editing, copying) — using AES-128 or AES-256 encryption.

**Business Value:** Password protection is a table-stakes professional feature (BRD-02): any PDF tool competing with Adobe, iLovePDF, or Smallpdf must offer it. It serves the freelancer persona protecting contract deliverables, the teacher protecting exam papers, and the enterprise persona (BRD-07) requiring document DRM. It is a Fast-follow feature because it depends on the encryption infrastructure also needed by Unlock PDF (Section 4.8).

**User Story:**
> **US-PDF-07:** As a **freelancer sending a sensitive contract PDF by email**, I want to set an open password on the PDF so that only the recipient who knows the password can read it, and I want to restrict copying of text so the recipient cannot extract the contract text into another document.
>
> Acceptance Criteria:
> - Given I open Password Protection for a PDF, when I set an open password and enable "Restrict copying," then the output PDF requires the password to open and returns an error in standard readers if the user tries to copy text.
> - Given I set both an open password and a permissions password, when saved, then the permissions password is required to change or remove the restrictions, not just to open the file.
> - Given I select AES-256 as the encryption algorithm, when the output is generated, then it is encrypted with AES-256 and can be verified as such using a standard PDF analysis tool.

**Functional Requirements:**
- **FR-PDF-33:** The system shall allow the user to set an open password for a PDF, given the Password Protection tool is active, resulting in the output PDF requiring the exact open password to decrypt and display content in any compliant PDF reader.
- **FR-PDF-34:** The system shall allow the user to set a permissions password (separate from the open password), given the tool is active, resulting in the permissions password being required to modify or remove document restrictions in any compliant PDF reader.
- **FR-PDF-35:** The system shall provide configurable permission restriction flags — restrict printing (no printing allowed), restrict high-quality printing (allow low-quality only), restrict copying (no text/image copying), restrict editing (no content modification), restrict annotations (no annotation changes) — given the user configures restrictions, resulting in those flags being set in the PDF encryption dictionary.
- **FR-PDF-36:** The system shall support AES-128 and AES-256 encryption, given the user selects the encryption standard, resulting in the output PDF encrypted to the selected standard and compatible with PDF specification version 1.4 (AES-128) and 1.6 (AES-256).

**Flow:** User opens Password Protection with source document -> sets open password (with confirm field) -> optionally sets permissions password -> configures restriction flags -> selects encryption standard (AES-128 / AES-256) -> confirms -> processing (on-device, no need for server-side for encryption) -> output encrypted PDF in library -> original preserved.

**Inputs:** Source PDF; open password string; permissions password string (optional); restriction flag selections; encryption standard selection.

**Outputs:** Encrypted PDF in the local library; the original file is preserved unencrypted (the output is a new file, not an in-place overwrite).

**Business Logic:**
- Password strength validation: the UI enforces a minimum password length (configurable, default: 4 characters) and shows a strength indicator. The system does not enforce a maximum complexity policy (that is the user's responsibility), but does warn if the password is very short (below 8 characters).
- If only an open password is set (no permissions password): the open password unlocks all permissions — printing, copying, editing are all permitted for the holder of the open password. The permissions password is only meaningful when a separate, more restrictive access level is desired.
- Encryption is performed on-device (no server-side call required; encryption libraries are bundled in the app per BRD-04/BRD-06 requirements).
- The original unencrypted file is always preserved for the configured backup period (default: 7 days) so the user can re-process if the password is forgotten.
- A password-manager integration note is surfaced after protection: "Save this password somewhere safe — OneConvert does not store it."

**Permissions:** Student / Pro tier only.

**Errors:**
| Error Case | Handling |
|---|---|
| Open password and confirm password do not match | Inline error highlighted on confirm field; Apply button disabled until they match |
| Open password and permissions password are the same | Warn the user that using the same password for both open and permissions effectively grants full access to all openers; allow override but make the consequence clear |
| Source PDF is already password-protected | Prompt for the existing password to decrypt before re-encrypting with new credentials |

**Limitations:**
- PDF permission flags are enforced by PDF reader software, not by physical DRM. A non-compliant PDF reader may ignore restriction flags. This limitation is documented in user-facing help content; OneConvert is not responsible for non-compliant readers.
- In MVP, fine-grained permissions (e.g., "allow form filling but not general editing") are not configurable; the restriction flags cover the standard PDF security handler permission bits only.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User applies protection, then immediately uses the Unlock feature (Section 4.8) on the same file | Unlock requires the permissions password that was just set; if provided, the PDF is decrypted normally | Minor |
| Source PDF already has restrictions; user adds more | New restrictions are additive (the output respects both the existing and newly added restrictions) | Minor |
| Empty open password (user leaves it blank) | Allowed: a blank open password produces a PDF that opens without a prompt but has the configured restrictions enforced by the permissions password | Minor |

**Acceptance Tests:** Verify a password-protected output requires the correct open password in a third-party PDF reader and rejects incorrect passwords; verify restriction flags are readable and set correctly via PDF analysis (e.g., pdfinfo tool); verify AES-256 encryption is confirmed by a PDF header analysis; verify the original file remains unencrypted in the library.

**Future Enhancements:** Digital certificate-based protection (X.509); rights management integration (enterprise DRM); batch password-protect multiple files with a single shared password; password expiry watermarks (visual "expired on" overlays that auto-render after a date).

**Traces to:** BRD-02, BRD-05, BRD-07.

---
## 4.8 Feature: Unlock PDF

**Purpose:** Remove password protection from a PDF document (both open and permissions passwords) when the user possesses the authorising password — producing an unencrypted, unrestricted output PDF — and optionally preserve all original document metadata. Supports batch unlock of multiple files.

**Business Value:** Unlock is the counterpart to Password Protection (Section 4.7) and is used constantly in real workflows: teams receive password-protected PDFs from vendors, government portals, or banks and need to unlock them for further processing (OCR, editing, compression). A tool that protects but cannot unlock would frustrate these users; the pair together creates a complete secure-document lifecycle.

**User Story:**
> **US-PDF-08:** As a **freelancer who received a password-protected invoice PDF from a client**, I want to unlock it using the password the client gave me, so that I can process it (OCR, compress, merge) without having to enter the password every single time I open it.
>
> Acceptance Criteria:
> - Given I open the Unlock PDF tool with a protected PDF, when I enter the correct permissions password, then the output is an unencrypted PDF that opens without a password prompt in any reader.
> - Given I need to unlock 10 protected invoices all sharing the same password, when I use batch unlock with that password, then all 10 are unlocked and saved in one operation.
> - Given the PDF has no restrictions (only an open password), when I enter the open password and unlock, then the output PDF has no password and no restrictions.

**Functional Requirements:**
- **FR-PDF-37:** The system shall accept the user-provided password (open or permissions password) and produce an unencrypted, unrestricted output PDF, given a password-protected PDF is loaded in the Unlock tool and the correct password is entered, resulting in the output containing identical content to the source with no encryption dictionary.
- **FR-PDF-38:** The system shall preserve all original document metadata (title, author, creation date, keywords, subject) in the unlocked output, given metadata preservation is enabled (on by default), resulting in the output being metadata-identical to the source except for the removal of the encryption dictionary.
- **FR-PDF-39:** The system shall support batch unlock of multiple password-protected PDFs in a single operation using a shared password, given the user selects multiple files and enters one password, resulting in all files for which the password is correct being unlocked and saved, and files for which it is incorrect being flagged individually with a specific error.

**Flow:** User opens Unlock PDF -> adds source file(s) (single file or batch selection) -> enters password -> confirms -> on-device decryption -> unencrypted output(s) saved to library -> per-file status shown (unlocked / wrong password / already unlocked).

**Inputs:** One or more protected PDF files; password string (shared for batch).

**Outputs:** Unlocked PDF file(s) in the local library; per-file unlock result status (success / wrong password / not protected).

**Business Logic:**
- Unlock is performed entirely on-device (no network required). The app's PDF engine decrypts the file and writes a new PDF without the encryption dictionary. BRD-06 compliance.
- If the user provides the open password but not the permissions password: the PDF is unlocked (encryption removed) but only if the permissions password is not separately required to remove restrictions. Standard PDF encryption means the owner/permissions password is the one authorised to change encryption; the open password alone is not sufficient to produce an unrestricted file if the permissions password is different.
- "Already unlocked" files (PDFs without a password) are processed without error: the output is identical to the source; the user is informed the file was not protected.
- Free tier: not available. Student / Pro: available.

**Permissions:** Student / Pro tier only.

**Errors:**
| Error Case | Handling |
|---|---|
| Incorrect password entered | Clear the password field and re-prompt with a specific "incorrect password" message; no content exposed |
| Batch unlock: some files use a different password than the one entered | Those files are marked as "incorrect password" in the per-file status; the user can retry those files individually |
| File uses an unsupported or proprietary encryption method | Reject with a specific "encryption method not supported" message; list the common tools that can handle this encryption type |

**Limitations:**
- This feature cannot brute-force or recover forgotten passwords. The user must possess the correct password. This is not a limitation of OneConvert's design but of the legal and ethical boundaries of PDF security.
- Removing password protection from a PDF the user is not authorised to unlock is a potential misuse of this feature. OneConvert's terms of service require users to have legal authorisation; the product cannot technically prevent misuse but documents this constraint explicitly.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| PDF has an open password but no restrictions (permission password same as open) | Entering the open password successfully produces an unrestricted output | Minor |
| Batch unlock of 50 files, all with different passwords | Only the files matching the provided password are unlocked; each non-matching file is flagged with an individual "wrong password" status | Minor |

**Acceptance Tests:** Verify that a PDF protected with a known password is unlocked to a fully unprotected state; verify that the unlocked output opens without a password prompt in a third-party reader; verify batch unlock correctly processes matching-password files and flags non-matching files individually; verify metadata is preserved identically in the output.

**Future Enhancements:** Per-file individual password entry in batch unlock; unlock history log (for auditing which files were unlocked and when); integrate with Password Protection to create a "change password" workflow.

**Traces to:** BRD-02, BRD-06.

---
## 4.9 Feature: Annotation

**Purpose:** Allow users to mark up a PDF with highlights, underlines, strikethroughs, shapes, freehand pencil drawings, sticky notes, text comments, and an eraser tool — with full colour picker access — producing a markup layer stored as PDF annotations (not burned into the page content), so annotations remain editable after save.

**Business Value:** Annotation is the primary study and review tool for the student persona and a key collaboration and review tool for the freelancer and enterprise personas (BRD-02, BRD-07). It transforms OneConvert from a scan-and-store tool into an active reading and review platform, increasing time-in-app and session depth, which are key retention metrics (Volume 1, strategy).

**User Story:**
> **US-PDF-09:** As a **student studying for an exam**, I want to highlight important passages in yellow, add a sticky note with my own comment beside a paragraph I don't understand, and draw an arrow shape pointing to a key diagram, so that when I review the PDF later my annotations help me focus on what matters.
>
> Acceptance Criteria:
> - Given I am in the annotation viewer, when I drag to select text, then a highlight is applied in the current selected colour and the annotation appears in the annotation panel.
> - Given I tap anywhere on the page with the sticky note tool, when the note editor opens, then I can type a comment that appears as a collapsible sticky note icon on the page.
> - Given I save annotations, when I reopen the document, then all annotations are visible and the sticky note text is preserved exactly.

**Functional Requirements:**
- **FR-PDF-40:** The system shall provide a highlight annotation tool that applies a translucent colour fill over selected text, given the user selects text in the viewer with the highlight tool active, resulting in a PDF highlight annotation stored in the annotation layer at the correct page coordinates.
- **FR-PDF-41:** The system shall provide underline and strikethrough annotation tools, given the user selects text with the respective tool active, resulting in PDF underline and strikethrough annotations stored at the correct text positions.
- **FR-PDF-42:** The system shall provide a shapes annotation tool (rectangle, ellipse, line, arrow), given the user selects a shape type and draws on the page, resulting in a PDF geometric annotation stored at the drawn coordinates with the selected stroke colour, fill colour, and line width.
- **FR-PDF-43:** The system shall provide a freehand pencil (ink annotation) tool, given the user draws on the page with the pencil tool active, resulting in a PDF ink annotation stored as a polyline path matching the drawn path, with the selected colour and line width.
- **FR-PDF-44:** The system shall provide a sticky note annotation tool, given the user taps a position on the page, resulting in a PDF text annotation (popup note) stored at that position, with the note text editable at any time and the note icon visible on the page.
- **FR-PDF-45:** The system shall provide a free text annotation tool, given the user taps a position and types, resulting in a PDF free text annotation with the typed text visible directly on the page (not collapsed into an icon).
- **FR-PDF-46:** The system shall provide an eraser tool that removes individual annotations, given the user taps or drags the eraser over existing annotations, resulting in those annotation objects being removed from the annotation layer.

**Colour Picker:** All annotation tools share a colour picker providing at minimum: 12 preset colours (including common highlight colours: yellow, green, pink, blue, orange) and a custom colour input (RGB hex). The selected colour persists as the default for each tool type between sessions.

**Flow:** User opens a PDF -> annotation toolbar appears at bottom of viewer -> user selects a tool -> interacts with the page -> annotations rendered immediately -> user can tap any existing annotation to select, edit, or delete it -> Save commits annotation layer to the PDF file -> annotations are persisted as standard PDF annotations.

**Inputs:** Page content (for text selection coordinates); user touch/draw events (for ink, shapes, free text, sticky notes); colour and line-width parameters.

**Outputs:** PDF with annotation layer; each annotation stored as a standard PDF annotation object (type: Highlight, Underline, StrikeOut, Ink, FreeText, Text, Square, Circle, Line, PolyLine).

**Business Logic:**
- Annotations are stored as PDF-standard annotation objects, not burned into page content. This means they can be viewed by other PDF readers (Adobe, Foxit, Preview) that support PDF annotations, and they can be toggled visible/hidden in the viewer.
- The annotation layer is saved incrementally (incremental update to the PDF file) so that large files do not need to be fully rewritten on every annotation save.
- Auto-save: annotations are auto-saved every 60 seconds and on exit, to prevent loss from unexpected app termination.
- An annotation panel (slide-in sidebar) lists all annotations with their page number, type, colour, and text (for text-based annotations), allowing quick navigation.
- Undo/Redo: within an annotation session, up to 20 undo steps are maintained in memory.

**Permissions:** Student / Pro tier only.

**Errors:**
| Error Case | Handling |
|---|---|
| Annotation save fails (e.g., disk full) | Present a save error with an option to retry; annotated state is preserved in memory for the current session |
| User attempts to annotate a permission-restricted PDF (editing restricted) | Inform the user that the document's restrictions prevent annotation; suggest using Unlock PDF first |

**Limitations:**
- In MVP, annotations created in OneConvert may render differently in PDF readers that partially support the annotation standard (e.g., some mobile readers render ink annotations at lower resolution). This is a cross-application interoperability limitation, documented in help content.
- The pencil tool does not use pressure sensitivity in MVP (all strokes are uniform width); pressure-sensitive drawing is a fast-follow enhancement for devices with stylus support.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User highlights text that spans two pages (page break mid-sentence) | A separate highlight annotation is created on each page for the respective text region; no annotation crosses page boundaries in PDF standard | Minor |
| User draws an ink annotation on a rotated page | The ink path coordinates are stored relative to the page's native coordinate system (accounting for rotation), so the annotation renders correctly in all viewers | Major |
| Annotation layer grows very large (hundreds of ink strokes on a single page) | Performance degrades gracefully; a warning is shown if the annotation layer exceeds a configurable size threshold; save operation may take longer | Minor |

**Acceptance Tests:** Verify a highlight annotation saved in OneConvert is visible and correctly positioned when the PDF is opened in a third-party reader; verify undo removes the most recent annotation; verify sticky note text is preserved after close and reopen; verify eraser removes only the tapped annotation and not adjacent ones.

**Future Enhancements:** Annotation export as a summary report (all annotations with page references, extracted into a separate document); collaborative annotations (shared annotation layer visible to multiple users); pressure-sensitive ink for stylus; text extraction from ink annotations via handwriting recognition.

**Traces to:** BRD-02, BRD-04, BRD-07.

---
## 4.10 Feature: Fill and Sign

**Purpose:** Allow users to fill in form fields within a PDF, create and apply a handwritten or typed signature and initials, insert date fields and free-text labels at any position, use saved image signatures (e.g., a photograph of a physical signature), and save reusable signatures for future documents — producing a filled and signed PDF that is legally presentable for most standard form-signing scenarios.

**Business Value:** Fill and Sign is among the highest-value Pro features (BRD-02): it eliminates the print-sign-scan cycle that is still the dominant signature workflow in the target markets (India, Southeast Asia, SME businesses). It is a primary purchase driver for the Pro tier. It also serves BRD-07 (enterprise) where multi-page contract signing is a standard workflow.

**User Story:**
> **US-PDF-10:** As a **freelancer who received a client contract PDF that needs a signature**, I want to tap the signature field on the contract, draw my signature with my finger, and save the signed PDF, so that I can return the contract to the client without printing or scanning anything.
>
> Acceptance Criteria:
> - Given I open Fill and Sign for a PDF, when I tap an empty form field, then I can type text into it and it renders in the field at the correct position.
> - Given I tap the signature tool and draw my signature, when I place it on the page, then the signature image is embedded at the tapped position at the correct scale.
> - Given I save a signature, when I open the next document and open Fill and Sign, then my previously saved signature is available in the signature library without re-drawing.

**Functional Requirements:**
- **FR-PDF-47:** The system shall detect and highlight interactive form fields (AcroForm text fields, checkboxes, radio buttons, dropdown lists) in a PDF, given the PDF contains AcroForm elements, resulting in form fields being visually indicated and tappable for interactive filling.
- **FR-PDF-48:** The system shall allow freehand signature creation by finger or stylus drawing on a signature canvas, given the user selects "Create signature," resulting in a captured signature image (transparent PNG) stored in the user's signature library.
- **FR-PDF-49:** The system shall allow initials creation (same freehand drawing canvas, smaller target) and typed signature creation (user types their name and selects a cursive or print font rendering), given the user selects the respective creation mode, resulting in initials or typed-name images stored in the signature library.
- **FR-PDF-50:** The system shall allow placing a signature, initials, or typed text at any position on any page by tap-to-position, given the user selects an element from the signature library or a free-text tool, resulting in the element placed at the tapped position with handles for repositioning and scaling.
- **FR-PDF-51:** The system shall support date field insertion (today's date in a user-configurable format, e.g., DD/MM/YYYY, MM-DD-YYYY), given the user selects the date tool, resulting in the formatted date placed as a free text element at the tapped position.
- **FR-PDF-52:** The system shall support image signature import (user provides a photograph of a physical signature as JPEG/PNG), given the user selects "Import signature image," resulting in the image added to the signature library with background removal applied to produce a transparent-background signature image.

**Flow:** User opens Fill and Sign -> form fields highlighted (if present) -> user fills form fields by tapping and typing -> user taps signature tool -> selects from library or creates new -> places signature on page by tap -> repositions/scales via handles -> adds date, free text, initials as needed -> Save -> signed PDF in library -> share.

**Inputs:** Source PDF; form field fill values; signature/initials image or typed name; date format preference; placement coordinates and scale.

**Outputs:** Filled and signed PDF with form fields filled and signature/initials/text elements embedded as standard PDF annotation objects (or flattened to content on explicit "flatten" save option).

**Business Logic:**
- Signature elements are stored as PDF annotation objects by default (non-destructive, editable later). The user can optionally "flatten" the document (burn all annotations into page content) at save time, which is appropriate when submitting a final, tamper-evident copy.
- The signature library is stored locally, associated with the signed-in user's local profile. Signatures are synced to cloud storage if cloud sync is enabled (Chapter 8), so they are available across devices.
- Background removal for imported signature images: a simple threshold-based algorithm removes white/near-white backgrounds. The user can review the result and retry with adjusted threshold if the removal is imperfect.
- The system does not provide legally certified e-signatures (digital certificates with PKI) in MVP. A help tooltip makes clear that this is a handwritten-signature-image feature, not a cryptographic e-signature, and advises the user to confirm the signing requirements with the receiving party. Cryptographic e-signature is a future enterprise enhancement.
- Reusable signatures: the library holds up to 10 saved signatures/initials per user. Library management (rename, delete, reorder) is available.

**Permissions:** Student / Pro tier only.

**Errors:**
| Error Case | Handling |
|---|---|
| Form field cannot be filled because the PDF has editing restrictions | Inform the user that the field is restricted; suggest using Unlock PDF first or placing a free-text element over the field instead |
| Imported signature image background removal produces poor results | Show before/after preview; allow the user to adjust the removal threshold or accept the result as-is |

**Limitations:**
- In MVP, AcroForm field detection works for standard text fields, checkboxes, and radio buttons. Complex form elements (digital signature fields, JavaScript-triggered fields) are displayed as static images and cannot be interacted with.
- The "flatten" option produces an irreversible change — the user is warned with a specific confirmation dialog before flattening.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User places a signature, then rotates the page (via Organize Pages), then views the signature | The signature annotation coordinates are page-relative and render correctly in the rotated context | Major |
| Signature library is empty (first-time user) | The signature tool opens directly to the signature creation canvas with onboarding guidance | Minor |
| User attempts to sign a password-protected PDF with editing restrictions | Unlock the PDF first (Section 4.8); the Fill and Sign tool surfaces an "unlock first" prompt with a direct link to the Unlock tool | Major |

**Acceptance Tests:** Verify text typed into an AcroForm field renders at the correct position in the output; verify a freehand signature placed on page 2 is visible at the correct position and scale in a third-party reader; verify the flatten option produces a PDF where the signature cannot be selected or moved in any reader; verify the signature library saves and restores correctly across app restarts.

**Future Enhancements:** Cryptographic digital signatures (X.509 certificate-based); signature request workflow (request signature from another OneConvert user by email); audit trail generation for signed documents; multi-party signing queue.

**Traces to:** BRD-02, BRD-05, BRD-07.

---
## 4.11 Feature: Redaction

**Priority:** Could (Backlog)

**Purpose:** Permanently remove sensitive content from a PDF — by area selection or keyword-based search-and-redact — replacing the redacted regions with solid black (or configurable colour) rectangles, and stripping the underlying text and image data from the PDF structure so the content cannot be recovered. Also removes document metadata that may contain sensitive information.

**Business Value:** Redaction is a legal, compliance, and government workflow requirement (BRD-07). It is beyond the needs of the student and most freelancer personas, but critical for government office workers, legal firms, HR departments, and healthcare providers who regularly share PDFs containing sensitive data (PII, case numbers, salary figures). It is marked Backlog because it requires OCR-backed search (Chapter 5) for the search-and-redact workflow, and its implementation must be validated for legal adequacy.

**User Story:**
> **US-PDF-11:** As a **government worker preparing a court document for public release**, I want to redact all instances of witness names and addresses permanently from the PDF, so that no technical means can recover the original text from the released file.
>
> Acceptance Criteria:
> - Given I open the Redaction tool, when I draw a box over a text region, then that region is marked for redaction with a visual preview of the redacted state.
> - Given I use "Search and redact" and enter a name, when I confirm, then all occurrences of that name across the document are marked for redaction.
> - Given I apply redactions, when processing completes, then the redacted regions in the output PDF contain no recoverable text or image data — a copy-paste of the redacted region yields nothing.

**Functional Requirements:**
- **FR-PDF-53:** The system shall allow the user to mark rectangular regions on any page for redaction by drawing a selection box, given the Redaction tool is active, resulting in the selected area highlighted in a preview colour (default: red border) before the redaction is applied.
- **FR-PDF-54:** The system shall provide a search-and-redact function where the user enters a keyword and the system marks all text matches across the document for redaction, given a search query is submitted, resulting in all text matches highlighted for redaction review before application.
- **FR-PDF-55:** The system shall permanently remove all pixel data and text content within redacted areas and replace those regions with solid opaque rectangles in the applied redaction colour (default: black), given the user confirms and applies redactions, resulting in an output PDF from which the original content cannot be recovered by any standard PDF extraction method.
- **FR-PDF-56:** The system shall remove or sanitise document metadata (author, title, creation date, modification date, embedded thumbnails, JavaScript, attached files) from the redacted output, given metadata removal is enabled (on by default), resulting in a PDF that does not leak sensitive information through its metadata layer.

**Flow:** User opens Redaction tool -> marks areas (draw selection or search-and-redact) -> reviews all marked regions in a list view -> optionally edits marks (remove false positives) -> confirms apply -> irreversible processing: engine replaces content with fill rectangles, strips underlying data -> output PDF in library.

**Business Logic:** Redaction is irreversible once applied. The user must explicitly acknowledge an irreversibility warning before redaction is executed. The original file is always preserved separately. Redaction is server-side (requires structural PDF manipulation beyond client-side capability for guaranteed content removal).

**Permissions:** Pro tier only (government/enterprise use case; the most restrictive tier gate in the PDF Engine).

**Errors:**
| Error Case | Handling |
|---|---|
| Search-and-redact finds no matches | Inform the user: "No matches found for the search term"; do not proceed to application |
| Redaction applied to an already-redacted area | No error; re-redacting a black fill region is a no-op |

**Limitations:** Search-and-redact requires a text layer (OCR-generated or native). Image-only PDFs must be processed through OCR Integration (Section 4.12) first to enable text-based redaction.

**Acceptance Tests:** Verify that a redacted PDF, when inspected with a hex editor or PDF structure tool, contains no text strings for the redacted terms; verify metadata removal strips author and creation date fields; verify search-and-redact marks all instances of a test keyword across a 10-page PDF.

**Future Enhancements:** Pattern-based redaction (regex for email, phone, Aadhaar, PAN formats); redaction report (a summary document listing all redacted regions and the original content for internal audit); visual redaction style options (colour, label, e.g., "REDACTED").

**Traces to:** BRD-02, BRD-05, BRD-07.

---

## 4.12 Feature: OCR Integration (Scanned-PDF-to-Searchable-PDF)

**Purpose:** Convert an image-only scanned PDF (no text layer) into a searchable, text-selectable PDF by running Optical Character Recognition on each page and embedding the resulting text layer into the PDF structure — with language selection, OCR confidence reporting, and background processing for large documents.

**Business Value:** OCR is the bridge between the Scanner domain (Chapter 3) and the PDF Engine's full feature set. Without OCR, a scanned PDF cannot be searched, annotated on text, redacted by keyword, or exported to editable formats. This makes OCR Integration the single highest-leverage PDF Engine feature for the student persona (study notes that can be searched) and the government/enterprise persona (scanned legacy documents that become processable). Full OCR Engine specification is in Chapter 5; this section documents only the PDF Engine's integration surface.

**User Story:**
> **US-PDF-12:** As a **student who scanned a 30-page textbook chapter**, I want to run OCR on the PDF so that I can search for specific terms when revising, and highlight specific passages by selecting text instead of drawing boxes.
>
> Acceptance Criteria:
> - Given I open OCR Integration for an image-only PDF, when I select the document language and confirm, then the OCR job is submitted and I receive a progress indicator.
> - Given the OCR job completes, when I open the output in the viewer, then I can select text with my finger and the text cursor tracks the correct words.
> - Given OCR encounters a page it cannot read confidently, when the job completes, then the output includes a per-page confidence score and flags low-confidence pages.

**Functional Requirements:**
- **FR-PDF-57:** The system shall accept a PDF (image-only or mixed) and submit it to the OCR Engine (Chapter 5) as a background processing job, given the user selects OCR Integration and configures options, resulting in a job ID and progress tracking visible in the Processing Queue.
- **FR-PDF-58:** The system shall support language selection from at minimum the following: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi (covering BRD-01's Indian market priority) plus global common languages (French, Spanish, German, Arabic, Chinese Simplified, Japanese), given the language selector is presented before job submission, resulting in the OCR engine optimised for the selected language's character set.
- **FR-PDF-59:** The system shall produce an output PDF with an invisible text layer overlaid on the original page images (the standard searchable-PDF format: images remain visible, text layer is selectable but not visible), given the OCR job completes successfully, resulting in a PDF that is visually identical to the source but supports text selection, search, copy, and annotation.
- **FR-PDF-60:** The system shall surface a per-page OCR confidence report alongside the output PDF, given the job completes, resulting in the user being able to identify pages where OCR accuracy may be low (below a configurable threshold, default: 70%) and decide whether to re-scan those pages at higher resolution.

**Flow:** User opens OCR Integration -> selects document language -> optionally selects page range (all pages or a range, for partial OCR) -> submits job -> progress visible in Processing Queue (Chapter 9) -> push notification on completion -> user opens output PDF and verifies via text selection -> confidence report available from the document's detail screen.

**Inputs:** Source PDF (image-only or mixed); language selection; page range selection.

**Outputs:** Searchable PDF with embedded text layer; per-page confidence report; OCR job metadata.

**Business Logic:** OCR is server-side (AWS Lambda + OCR service, Volume 8 Engine decision). The original image-only PDF is preserved; the OCR output is a new file. Auto-language detection is applied if the user selects "Auto-detect" — the engine analyses the first page and selects the most likely language before processing the full document. For multi-language documents (e.g., a bilingual form), the user can select "Multi-language" mode where the engine processes each text block independently.

**Permissions:** Student / Pro tier only. Free-tier users see an upgrade prompt.

**Errors:**
| Error Case | Handling |
|---|---|
| Source PDF already has a text layer | Warn the user ("this PDF already contains a text layer — OCR will add a new layer on top, which may cause duplicate text in readers"); offer to proceed or cancel |
| OCR job fails for a specific page | That page's text layer is empty in the output; the confidence report marks it as "failed — page could not be processed" |

**Limitations:** OCR accuracy varies by scan quality, font type, and handwriting. OneConvert does not guarantee accuracy above a specific threshold; accuracy is a function of the OCR engine and the scan quality. Users are advised to verify critical OCR outputs before relying on them for legal or official purposes.

**Acceptance Tests:** Verify a standard printed-text scan produces searchable text with greater than 90% character accuracy; verify the per-page confidence report correctly flags a deliberately low-quality test page; verify the output PDF is visually identical to the source when rendered; verify language selection routes the job to the correct OCR language model.

**Future Enhancements:** Handwriting OCR (requires a separate model, currently lower accuracy than print OCR); in-app OCR result correction editor; automatic re-scan suggestion for low-confidence pages; real-time OCR (OCR applied during scan capture, before PDF assembly).

**Traces to:** BRD-01, BRD-02, BRD-05.

---

## 4.13 Feature: Export (PDF to Other Formats)

**Priority:** Should (Fast-follow)

**Purpose:** Convert a PDF document into one of the following editable or publishable formats: DOCX (Word), PPTX (PowerPoint), XLSX (Excel), TXT (plain text), Markdown, HTML, Images (JPEG/PNG per page). Each conversion is handled by the appropriate engine (Office Engine for DOCX/PPTX/XLSX, PDF Engine for TXT/Markdown/HTML/Images).

**Business Value:** PDF Export is the primary "escape valve" from the PDF format (BRD-02): users frequently need to extract content from PDFs into editable forms. The student needs a scanned PDF as a Word document to copy text into their essay; the freelancer needs a PDF proposal as a PPTX to present to a client. Export is also the key feature that justifies the Pro tier for users whose primary use case is content extraction rather than PDF creation.

**User Story:**
> **US-PDF-13:** As a **student who received a professor's lecture PDF**, I want to convert it to a Word document so that I can edit it, add my own notes inline, and reformat it as a study guide.
>
> Acceptance Criteria:
> - Given I open PDF to DOCX export for a PDF with a text layer, when the conversion completes, then the DOCX file preserves the original layout, headings, and formatting as closely as the format allows.
> - Given I export a scanned PDF (no text layer) to DOCX, when conversion runs, then OCR is applied automatically before conversion and the output DOCX contains the recognised text.
> - Given I export a 10-page PDF to images, when conversion completes, then I receive 10 JPEG files, one per page, at the configured DPI.

**Functional Requirements:**
- **FR-PDF-61:** The system shall convert a PDF to DOCX format via the Office Engine (Chapter 6), given the user selects "PDF to DOCX," resulting in a DOCX file that preserves document structure (headings, paragraphs, tables, images) to the extent the conversion engine can infer it from the source PDF.
- **FR-PDF-62:** The system shall convert a PDF to PPTX format via the Office Engine, given the user selects "PDF to PPTX," resulting in a PPTX file where each PDF page is mapped to one PowerPoint slide.
- **FR-PDF-63:** The system shall convert a PDF to XLSX format via the Office Engine, given the user selects "PDF to XLSX" and the PDF contains tabular data, resulting in an XLSX file with tables extracted into spreadsheet cells.
- **FR-PDF-64:** The system shall convert a PDF to plain text (TXT) format, given the user selects "PDF to TXT," resulting in a UTF-8 text file containing all text extracted from the PDF's text layer (or OCR layer if no native text layer exists), with page breaks represented as configurable separators.
- **FR-PDF-65:** The system shall convert a PDF to Markdown format, given the user selects "PDF to Markdown," resulting in a Markdown file that infers basic heading structure (from font size/weight heuristics) and paragraph formatting from the PDF's text layer.
- **FR-PDF-66:** The system shall convert a PDF to HTML format, given the user selects "PDF to HTML," resulting in a self-contained HTML file (with embedded images) that approximates the PDF layout for web rendering.
- **FR-PDF-67:** The system shall convert a PDF to per-page images (JPEG or PNG), given the user selects "PDF to Images" and configures DPI (72, 96, 150, 200, 300) and format, resulting in one image file per page at the configured resolution.

**Flow:** User selects a PDF -> opens Export -> selects target format -> (if scanned PDF and text-extractable format selected: OCR offered automatically) -> configures options (DPI for images, heading detection for Markdown, etc.) -> submits conversion job (server-side) -> progress tracking -> on completion: output file(s) in library -> Share / Open actions.

**Business Logic:**
- Conversion quality for DOCX/PPTX/XLSX is heavily dependent on PDF structure quality. PDFs created from well-structured source documents convert better than image-only or untagged scanned PDFs. The product does not guarantee round-trip fidelity; conversion quality is communicated in help content.
- Image-only PDFs (no text layer) require OCR before DOCX/TXT/Markdown/HTML export. If the user selects one of these formats for an image-only PDF, the system offers to run OCR first as a prerequisite step. PDF to Images export works for all PDFs regardless of text layer.
- All conversion jobs are server-side. The Office Engine for DOCX/PPTX/XLSX is documented in Chapter 6.

**Permissions:** Student / Pro tier only. Export to TXT is available to Student; Export to DOCX/PPTX/XLSX/Markdown/HTML/Images requires Pro.

**Errors:**
| Error Case | Handling |
|---|---|
| PDF has no text layer and user requests DOCX without running OCR | Prompt: "This PDF has no text layer. Run OCR first? [Run OCR and Convert] [Convert Anyway (images only)]" |
| Conversion job fails on a complex page layout | Partial output is returned (successfully converted pages); failed pages are flagged in the output with a note "page N could not be converted" |

**Limitations:** No PDF export format guarantees 100% layout fidelity. Complex multi-column layouts, footnotes, and embedded special fonts may not be accurately reproduced in DOCX/HTML. This is an industry-wide limitation of PDF-to-editable-format conversion.

**Acceptance Tests:** Verify DOCX output from a well-structured PDF opens in Microsoft Word with recognisable heading structure; verify Images export produces the correct number of files at the configured DPI; verify TXT export extracts all text from a text-layer PDF; verify the OCR prerequisite prompt fires for image-only PDFs before editable format export.

**Future Enhancements:** PDF to ePub (e-reader format); selective page range export; preserve hyperlinks in DOCX export; export multiple PDFs to the same format in a batch.

**Traces to:** BRD-02, BRD-05.

---
## 4.14 Feature: AI PDF Assistant

**Priority:** Won't-yet (Future)

**Purpose:** Provide an AI-powered conversational interface within the PDF viewer that can summarize document content, explain complex passages, translate selected text, answer natural language questions about the document, extract tables and images as structured data, generate quiz questions from content, and find citations or references — transforming OneConvert from a PDF tool into an intelligent document understanding platform.

**Business Value:** AI PDF Assistant is the highest-differentiation future feature in the PDF Engine domain and a primary long-term competitive moat (against Adobe AI Assistant, ChatPDF, and similar tools). It is marked Won't-yet because it requires: (a) a production-ready LLM integration layer (Volume 5/8 decision), (b) robust document chunking and vector embedding pipeline for context window management on large PDFs, (c) reliable pricing model for LLM API costs at scale, and (d) privacy/data handling policy decisions for document content sent to LLM services. The feature is fully specified here so the architecture anticipates it; implementation is not scheduled for MVP or Fast-follow.

**User Story:**
> **US-PDF-14:** As a **student reading a dense 50-page research paper**, I want to ask the AI "What is the main finding of this paper?" and get a one-paragraph summary, and then ask "Explain this equation on page 12" and get a plain-English explanation, so that I can understand the paper in half the time.
>
> Acceptance Criteria:
> - Given the AI Assistant is open with a PDF context, when I type a natural language question, then the AI responds within 5 seconds with an answer that references the relevant section of the document.
> - Given I request a summary, when the response is generated, then the summary is factually grounded in the document content (no hallucination of facts not in the document).
> - Given I am offline, when I open the AI Assistant, then a graceful degradation message explains that AI features require internet connectivity, and all other PDF features remain fully functional.

**Functional Requirements:**
- **FR-PDF-68:** The system shall provide a chat interface within the PDF viewer that accepts natural language questions and returns AI-generated answers grounded in the current document's content (Retrieval-Augmented Generation pattern), given the AI Assistant is active and the document has a text layer.
- **FR-PDF-69:** The system shall generate a document summary at configurable lengths (one paragraph, one page, bullet points) on demand, given the user requests summarization.
- **FR-PDF-70:** The system shall translate selected text or entire pages into a user-selected target language, given the user selects text and invokes translate, resulting in the translation displayed in an overlay without modifying the source document.
- **FR-PDF-71:** The system shall extract all tables from the document and export them as structured data (CSV or XLSX), given the user requests table extraction.
- **FR-PDF-72:** The system shall extract all embedded images from the document and present them as a downloadable image gallery, given the user requests image extraction.
- **FR-PDF-73:** The system shall generate a set of quiz questions (multiple choice and short answer) based on the document content, given the user requests quiz generation, resulting in a formatted quiz that can be exported as a PDF or text file.
- **FR-PDF-74:** The system shall identify and list bibliographic references, citations, and footnotes from the document, given the user requests reference extraction, resulting in a structured reference list that can be exported or shared.
- **FR-PDF-75:** The system shall degrade gracefully when offline or when the AI service is unavailable, given connectivity or service issues, resulting in a specific "AI features unavailable — check your connection" notification with all non-AI PDF features remaining fully functional.

**Business Logic:** Document content is chunked, embedded (vector representation), and sent to the LLM service per query. No full document content is cached on the AI service's side beyond the request session (specific data handling depends on the LLM provider contract). Users must explicitly consent to AI processing of their document content (a one-time consent prompt on first use of the AI Assistant). AI features consume API credits that are quota-limited per tier (e.g., Pro: 100 AI queries/month; specific quotas are a pricing decision, not fixed here).

**Permissions:** Pro tier only. AI usage is quota-limited per billing period. Offline: graceful degradation with clear messaging — no other PDF features are affected.

**Limitations:** AI answers are grounded in the document via RAG but are not guaranteed to be 100% accurate. Users are advised not to use AI-generated summaries as a substitute for reading legally or medically critical documents. A disclaimer is displayed with every AI response. Image-only PDFs without a text layer cannot be processed by the AI Assistant until OCR has been run.

**Traces to:** BRD-02, BRD-05.

---

## 4.15 Performance Requirements (Domain NFR Addendum)

**Purpose:** Define measurable performance standards specific to the PDF Engine domain, supplementing the global NFR baseline from Chapter 1, Section 1.5. These requirements are testable and must be included in the acceptance test suite for the PDF Engine.

**Functional Requirements:**
- **FR-PDF-76:** The system shall open and render the first page of a 1000-page PDF within 3 seconds on a mid-range reference device (equivalent to a 3 GB RAM Android device at the time of release), given the PDF is stored locally, resulting in the user seeing page 1 rendered at full resolution within 3 seconds of tapping the document.
- **FR-PDF-77:** The system shall implement lazy loading (incremental page rendering) such that only pages within a configurable window (default: 5 pages centred on the current viewport) are held in full-resolution memory at any time, given a multi-page PDF is open in the viewer, resulting in memory consumption remaining below a configurable threshold (default: 200 MB) regardless of total document page count.
- **FR-PDF-78:** The system shall perform background rendering of adjacent pages (pre-rendering the next 2 and previous 2 pages from the current viewport position) without blocking the main UI thread, given the viewer is in an idle scroll state, resulting in smooth page transitions with no visible rendering delay when scrolling to an adjacent page.
- **FR-PDF-79:** The system shall implement incremental save for annotation and fill-and-sign operations, given changes are committed to a PDF, resulting in only the changed annotation objects being written to the file (PDF incremental update specification) rather than rewriting the entire file, with save operations completing in under 2 seconds for documents up to 100 MB.
- **FR-PDF-80:** The system shall provide an undo/redo stack of at least 20 operations for annotation, fill-and-sign, and organize-pages sessions, given editing is active, resulting in the user being able to reverse up to 20 individual actions without reloading the document.

**Acceptance Tests:** Verify first-page render time on the reference device is within the 3-second target for a 1000-page test PDF; verify memory profiler shows heap usage below 200 MB during scrolling of a 500-page PDF; verify incremental save completes in under 2 seconds for a 50 MB annotated PDF; verify 20-step undo correctly reverses operations in the annotation session.

**Traces to:** BRD-04, BRD-06 (offline performance must match online performance for local file operations).

---

## 4.16 Offline Support (Domain NFR Addendum)

**Purpose:** Define the offline behaviour policy for all PDF Engine features, specifying which features function fully offline, which degrade gracefully, and which require connectivity — ensuring the BRD-06 (offline-first) mandate is implemented consistently across the PDF Engine domain.

**Functional Requirements:**
- **FR-PDF-81:** The system shall make all core PDF Engine operations on locally stored files — PDF Viewer (4.1), Organize Pages (4.5), Annotation (4.9), Fill and Sign (4.10), Password Protection (4.7), Unlock PDF (4.8), and Images export (4.13, locally rendered) — fully functional without any network connectivity, given the source files are in local storage, resulting in zero dependency on network access for these operations.
- **FR-PDF-82:** The system shall implement local autosave for annotation and fill-and-sign sessions, given editing is active, resulting in all in-progress changes being written to a local autosave file every 60 seconds and on app backgrounding, with no data loss on unexpected app termination.
- **FR-PDF-83:** The system shall display a specific, feature-named offline indicator (e.g., "Merge requires an internet connection for files above 50 MB" or "OCR requires internet connectivity") for each feature that requires server-side processing, given the device has no network connection and the user attempts to use that feature, resulting in the user understanding exactly why the feature is unavailable and what they can do (e.g., work offline with files below the on-device processing threshold, queue the job for when connectivity returns).
- **FR-PDF-84:** The system shall implement conflict resolution for annotation and fill-and-sign changes made offline when cloud sync reconnects, given the user has made local changes to a document while offline and the same document has been modified in the cloud during that period, resulting in a conflict resolution prompt that shows both versions and allows the user to choose which to keep or to merge manually.

**Offline Feature Matrix:**

| Feature | Fully Offline | Requires Connectivity | Notes |
|---|---|---|---|
| PDF Viewer | Yes | No | All viewing, search, bookmarks work offline |
| Merge PDF | Partially | For files > 50 MB | Small merges (< 50 MB total) are on-device |
| Split PDF | Partially | For files > 50 MB | Small splits are on-device |
| Compress PDF | No | Always | Server-side only; queue for retry when online |
| Organize Pages | Yes | No | All on-device |
| Watermark | No | Always | Server-side only; queue for retry when online |
| Password Protection | Yes | No | On-device encryption |
| Unlock PDF | Yes | No | On-device decryption |
| Annotation | Yes | No | Local annotation layer |
| Fill and Sign | Yes | No | Local PDF write |
| Redaction | No | Always | Server-side only |
| OCR Integration | No | Always | Server-side AI model |
| Export (PDF to Images) | Yes | No | On-device rasterisation |
| Export (DOCX/PPTX/XLSX) | No | Always | Server-side conversion |
| Export (TXT/Markdown) | Yes | No | Text extraction from local text layer |
| AI PDF Assistant | No | Always | LLM service required; graceful degradation |

**Acceptance Tests:** Verify all "Fully Offline" features in the matrix operate correctly with airplane mode enabled; verify server-side features show the correct offline-specific message (not a generic network error) when offline; verify autosave preserves all annotations from a simulated crash during offline editing; verify conflict resolution prompt appears correctly on sync reconnection after offline edits.

**Traces to:** BRD-06.

---

## 4.17 Chapter Summary and Traceability Check

All 16 features/NFR addenda in this chapter trace to at least one BRD row:

| Feature | Priority | FRs | BRD Trace |
|---|---|---|---|
| PDF Viewer | Must (MVP) | FR-PDF-01 to 07 | BRD-01, BRD-02, BRD-04, BRD-06 |
| Merge PDF | Must (MVP) | FR-PDF-08 to 12 | BRD-01, BRD-02, BRD-05 |
| Split PDF | Must (MVP) | FR-PDF-13 to 16 | BRD-02, BRD-05 |
| Compress PDF | Must (MVP) | FR-PDF-17 to 21 | BRD-01, BRD-02, BRD-05 |
| Organize Pages | Must (MVP) | FR-PDF-22 to 27 | BRD-02, BRD-05 |
| Watermark | Should (Fast-follow) | FR-PDF-28 to 32 | BRD-02, BRD-05 |
| Password Protection | Should (Fast-follow) | FR-PDF-33 to 36 | BRD-02, BRD-05, BRD-07 |
| Unlock PDF | Should (Fast-follow) | FR-PDF-37 to 39 | BRD-02, BRD-06 |
| Annotation | Should (Fast-follow) | FR-PDF-40 to 46 | BRD-02, BRD-04, BRD-07 |
| Fill and Sign | Should (Fast-follow) | FR-PDF-47 to 52 | BRD-02, BRD-05, BRD-07 |
| Redaction | Could (Backlog) | FR-PDF-53 to 56 | BRD-02, BRD-05, BRD-07 |
| OCR Integration | Must (MVP) | FR-PDF-57 to 60 | BRD-01, BRD-02, BRD-05 |
| Export | Should (Fast-follow) | FR-PDF-61 to 67 | BRD-02, BRD-05 |
| AI PDF Assistant | Won't-yet | FR-PDF-68 to 75 | BRD-02, BRD-05 |
| Performance Requirements (NFR) | Must (MVP) | FR-PDF-76 to 80 | BRD-04, BRD-06 |
| Offline Support (NFR) | Must (MVP) | FR-PDF-81 to 84 | BRD-06 |

No untraced requirements were introduced in this chapter.

**Notable cross-chapter dependencies surfaced here:**
- FR-PDF-57 to 60 (OCR Integration) depend on the **OCR Engine** (Chapter 5) for the actual recognition model and processing pipeline. Chapter 4 defines the intake interface; Chapter 5 owns the engine.
- FR-PDF-61 to 63 (Export to DOCX/PPTX/XLSX) depend on the **Office Engine** (Chapter 6) for format conversion. Chapter 4 defines the trigger and output specification; Chapter 6 owns the conversion.
- FR-PDF-68 to 75 (AI PDF Assistant) depend on the **AI/LLM integration layer** (Volume 5 Backend Architecture and Volume 8 Processing Engines) for the RAG pipeline and LLM API integration.
- The Processing Queue mentioned in FR-PDF-57 (OCR job submission) and other async jobs is a **cross-cutting feature** to be fully specified in Chapter 9 (Notifications, Admin, and Cross-cutting Features).
- The Entitlement Enforcement gate referenced throughout this chapter is owned by **Section 2.9** (Chapter 2). Chapter 4 only references the gate; Chapter 2 defines how it is enforced.

**BRD-04 cross-platform notes for this chapter (carry forward to Volume 4):**
- PDF Viewer on Flutter Web has memory constraints for large files (> 200 MB); Web-specific lazy-loading window must be narrower than mobile.
- Annotation drag-to-draw events on Flutter Web require mouse event handlers tested separately from touch events.
- Fill and Sign signature canvas on Web requires mouse-based drawing (stylus not assumed).

Running feature count: **36 / 92** specified (10 from Chapter 2 + 10 from Chapter 3 + 16 from Chapter 4).

---
*End of Volume 2, Chapter 4. Next: Volume 2, Chapter 5 — OCR Engine Features.*
