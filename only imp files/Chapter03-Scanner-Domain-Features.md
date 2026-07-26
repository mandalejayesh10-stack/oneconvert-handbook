# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 3 — Scanner Domain Features

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 1 (Framework, BRD/PRD structure, NFR baseline, prioritization rules), Chapter 2 (Account & Identity, Subscription & Billing)

---

## 3.0 Chapter Scope

This chapter documents the features in the **Scanner** PRD domain (Chapter 1, Section 1.3). Scanner is the product's primary acquisition surface: it is the only engine available in full on the Free tier (BRD-01), the first action a new user takes on launch, and the one feature that must function fully offline on a mobile device (BRD-06). Every other engine — PDF, OCR, Office, Image — operates on documents that were either scanned via this domain or imported; the Scanner is therefore the entry point into OneConvert's entire processing pipeline.

This chapter also marks the first domain where **BRD-04** (single Flutter codebase across Android, iOS, Web) and **BRD-06** (offline-first) become primary constraints, rather than background assumptions. Both impose specific requirements on how capture, edge detection, and local storage are designed, and those implications are called out explicitly in the features below.

Ten features are specified. Every feature carries a priority tag per Section 1.8 and traces to at least one BRD row.

| # | Feature | Domain | Priority |
|---|---|---|---|
| 1 | Camera Capture (Single and Multi-Page) | Scanner | Must (MVP) |
| 2 | Automatic Edge Detection and Perspective Correction | Scanner | Must (MVP) |
| 3 | Multi-Page Document Assembly and Reordering | Scanner | Must (MVP) |
| 4 | Image Filters and Enhancement | Scanner | Must (MVP) |
| 5 | Manual Crop and Perspective Adjustment | Scanner | Must (MVP) |
| 6 | Document Import (Files, Gallery, Cloud) | Scanner | Must (MVP) |
| 7 | Local Document Save and Export (PDF / JPEG) | Scanner | Must (MVP) |
| 8 | Auto-Capture (Smart Shutter) | Scanner | Should (Fast-follow) |
| 9 | Batch Scan Mode | Scanner | Should (Fast-follow) |
| 10 | QR / Barcode Detection at Scan Time | Scanner | Could (Backlog) |

---

## 3.1 Feature: Camera Capture (Single and Multi-Page)

**Purpose:** Provide the core document-capture experience — taking one or many photographs of physical documents via the device camera — that forms the entry point of the OneConvert product. This is the free-tier hook (BRD-01): it must be frictionless, fast, and reliable on any mid-range Android or iOS device, without requiring sign-in.

**Business Value:** Directly delivers BRD-01 (free-tier acquisition via scanning). The entire product funnel begins here. Capture quality determines whether users trust the app enough to consider a paid upgrade; a poor capture experience is the single largest churn risk at the top of the funnel. BRD-06 (offline-first): camera capture must function entirely without network connectivity.

**User Story:**
> **US-SCAN-01:** As a **student**, I want to open the app and immediately start scanning my assignment or lecture notes using my phone camera, so that I can digitise multiple pages in one continuous session without any setup or sign-in friction.
>
> Acceptance Criteria:
> - Given the app is opened for the first time (guest mode), when I tap the scan button, then the camera view opens immediately with no sign-in prompt and no tutorial gate.
> - Given the camera view is open, when I capture a page, then the app shows a preview of that captured page and presents a "capture next page" option without leaving the camera view.
> - Given I have captured one or more pages and tap "Done," then all captured pages are assembled in the order they were taken and I am taken to the document review screen.
> - Given the device has no network connection, when I capture pages, then capture, preview, and local save all function normally with no connectivity-related error.

**Functional Requirements:**
- **FR-SCAN-01:** The system shall open the device camera and present a live viewfinder with document-capture controls, given camera permission has been granted and the scan action is triggered, resulting in an active capture session regardless of authentication or connectivity state.
- **FR-SCAN-02:** The system shall support sequential multi-page capture within a single session, given the camera view is active, resulting in each captured frame being added to a local in-session document buffer with the user remaining in the camera view after each capture until they explicitly end the session.
- **FR-SCAN-03:** The system shall request camera permission using the platform-appropriate permission flow (Android runtime permission, iOS NSCameraUsageDescription prompt), given the camera is first accessed, resulting in a graceful fallback to the import flow (Section 3.6) if permission is denied, never a crash or silent failure.

**Flow:** User taps Scan -> camera permission check -> (if not granted: prompt -> on deny, surface Import alternative) -> live viewfinder opens -> edge-detection overlay renders on the live feed -> user frames document -> captures -> page added to session buffer -> "Add more pages" / "Done" choice -> on "Done," session closes and document review screen opens.

**Inputs:** Live camera frames (hardware); capture trigger (user tap or auto-shutter trigger from Section 3.8); session context (anonymous UUID or authenticated user ID).

**Outputs:** One or more captured image frames stored as high-resolution JPEG assets in a local session staging directory (not yet committed to the permanent document store until the user confirms/saves in Section 3.7). Session metadata record: page count, capture timestamps, applied orientation.

**Business Logic:**
- Capture stores images at the device's native camera resolution, subject to a configurable maximum dimension (e.g., 4096 x 4096 px) to prevent excessive storage consumption on very high-resolution sensors without sacrificing document legibility.
- All session assets are written to the app's private sandboxed local storage immediately on capture, not held in memory, to survive app backgrounding or low-memory events during a long multi-page session.
- Captured frames are stored in a staging area. The permanent document record is only created when the user explicitly saves (Section 3.7); abandoning a session before saving discards the staging assets.
- BRD-04 note: On Flutter Web, the camera API differs from mobile (WebRTC getUserMedia vs. native camera plugin). The implementation must abstract this behind a platform interface (see Volume 4, Flutter Architecture) so scanning logic is platform-agnostic. Web capture is scoped to single-page or gallery-import only in MVP — this is an explicit MVP scope decision, not an oversight.

**Permissions:** Guest (anonymous) users have full access to camera capture. Signed-in users have the same access. No tier restriction on basic capture.

**Errors:**
| Error Case | Handling |
|---|---|
| Camera permission denied by user | Camera view does not open; a non-blocking in-app message explains what was blocked and offers a shortcut to app settings and an alternative path to Import from Gallery |
| Camera hardware unavailable (in-use by another app) | Display a specific "camera busy" error with instructions to close other camera apps; do not crash |
| Device runs out of local storage mid-session | Warn the user before the next capture attempt (detect free storage below threshold); offer to end the session early and save pages captured so far |
| Capture frame is too blurry (below minimum sharpness score) | Show a visual warning indicator on the viewfinder ("Hold steady") but do not block capture; user decides whether to retake |

**Limitations:**
- Flash/torch control is surfaced as a toggle but flash behaviour on very low-end devices is hardware-dependent and not guaranteed.
- Front-facing camera is accessible but not optimised for document capture; no front-camera restriction in MVP, but no special front-camera tuning either.
- On Flutter Web, simultaneous multi-page capture (sequential camera session) is deferred to post-MVP due to browser camera API limitations.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User locks screen or backgrounds the app mid-session | Session state and all staged pages are preserved in local storage; reopening the app resumes the in-progress session with a "resume session" prompt | Major |
| User captures 50+ pages in a single session | No hard page limit enforced in MVP; performance degrades gracefully via staged writes, not crash; practical limit communicated in onboarding tips | Minor |
| Device rotates mid-capture | Camera feed re-orients automatically; captured frame respects the orientation at time of shutter press, stored with correct EXIF orientation metadata | Minor |
| Second tap of capture button while first frame is still being written to disk | Debounced; second capture accepted only after first write completes, preventing corrupt or duplicate frames | Major |

**Acceptance Tests:** Verify end-to-end scan-to-preview flow completes with no network connection; verify app backgrounded mid-session resumes with all pages intact; verify permission-denied path surfaces the import alternative without crashing; verify 10-page session produces correctly ordered, individual image files in the staging directory.

**Future Enhancements:** Continuous-scan mode (automatic sequential capture on page turn, no tap required); front-camera optimisation; document-type hints (ID card, receipt, A4 document) that pre-configure capture aspect ratios.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 3.2 Feature: Automatic Edge Detection and Perspective Correction

**Purpose:** Automatically identify the boundary of a document within a camera frame and correct the perspective distortion that results from photographing a flat document at an angle — producing a clean, deskewed, rectangular document image without requiring the user to manually align or crop anything.

**Business Value:** Edge detection and perspective correction are the features that separate a "scanner app" from "just taking a photo." Without them, captured images are trapezoidal, angled, and surrounded by background clutter — unusable for professional or submission contexts. This feature directly determines whether the free-tier scanning experience (BRD-01) is good enough to convert users to paid tiers. BRD-06 requirement: edge detection must run entirely on-device with no network call.

**User Story:**
> **US-SCAN-02:** As a **student photographing a textbook page**, I want the app to automatically find the edges of the page and straighten it, so that I don't need to manually crop or correct the perspective of every photo I take.
>
> Acceptance Criteria:
> - Given the camera viewfinder is open, when a document is visible in the frame, then a polygon overlay highlights the detected edges of the document in real time on the live feed.
> - Given I capture a frame, when edge detection has identified document corners, then the output image is perspective-corrected to a flat, rectangular document, not the raw trapezoidal camera photo.
> - Given the camera cannot detect a clear document boundary, when I capture, then the raw full-frame image is stored as a fallback, with the edge handles surfaced for manual adjustment in Section 3.5.

**Functional Requirements:**
- **FR-SCAN-04:** The system shall run real-time edge detection on the live camera feed, given the camera viewfinder is active, resulting in a quadrilateral overlay rendered on the detected document boundary at a refresh rate that does not cause visible viewfinder lag (target: overlay updates at or above 15 fps on a mid-range device).
- **FR-SCAN-05:** The system shall apply perspective correction to the captured image using the detected corner coordinates, given a capture event occurs and corner coordinates have been detected, resulting in a flat, rectangular document image stored in the session buffer in place of the raw distorted frame.
- **FR-SCAN-06:** The system shall fall back to storing the full uncorrected frame with manually adjustable corner handles, given edge detection fails to identify a confident document boundary (confidence score below a defined threshold), resulting in the user being routed to Manual Crop and Perspective Adjustment (Section 3.5) rather than silently discarding the capture.

**Flow:** Camera viewfinder active -> edge detection algorithm processes each live frame -> detected quadrilateral corners rendered as an overlay -> user captures -> if confidence >= threshold: perspective warp applied immediately, corrected image stored -> if confidence below threshold: raw image stored, user routed to manual adjustment -> corrected/adjusted image added to session buffer.

**Inputs:** Live camera frame stream (for real-time overlay); captured full-resolution frame (for correction); detected corner coordinates (output of detection algorithm, fed into perspective transform).

**Outputs:** Perspective-corrected rectangular document image (JPEG); confidence score metadata stored alongside the image.

**Business Logic:**
- Edge detection runs entirely on-device. Specific library selection (OpenCV, Google ML Kit Document Scanner API, Apple VisionKit, or custom) is a Volume 8 Engine decision, not fixed here. No frame data is transmitted to a server for edge detection in MVP.
- Tuning parameters are configurable via backend-delivered config (not hardcoded) so they can be adjusted without a release.
- Perspective correction uses a four-point homography transform. Output image dimensions are normalised to a standard aspect ratio derived from the detected document type, unless the manual crop (Section 3.5) overrides them.
- BRD-04 note: on Flutter Web, real-time edge detection on the live viewfinder is deferred to post-MVP; Web MVP surfaces static edge detection on a captured photo after capture, before save.

**Permissions:** No tier restriction. Edge detection runs for all users including guests.

**Errors:**
| Error Case | Handling |
|---|---|
| Edge detection model fails to initialise on device | Fall back to full-frame capture with manual crop prompt; log the failure for diagnostic purposes; do not surface a raw technical error to the user |
| Perspective correction produces an output smaller than a minimum viable resolution | Warn the user ("document may be too small or too far away") before adding to session buffer; do not silently discard |
| Detected edges are clearly wrong (corner of the room detected instead of the document) | User can tap to manually reposition the corner handles on the viewfinder before capturing |

**Limitations:**
- Accuracy degrades on highly textured or patterned backgrounds — documented in user-facing help content, not treated as a bug.
- MVP does not support skew/rotation correction beyond what is achievable via the perspective transform (e.g., a document curled at the spine of a book is not flattened by this feature).

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| Multiple documents visible in a single frame | Algorithm detects the largest/most prominent quadrilateral; user can manually adjust via Section 3.5 | Minor |
| Document photographed at an extreme angle (above 60 degrees from perpendicular) | Perspective correction is applied but output quality is noticeably degraded; user is warned that a more direct angle yields better results | Minor |
| Auto-corrected image has a black border artifact from the transform | Post-processing step trims a configurable margin from the corrected image to eliminate border artifacts before storing | Minor |
| Device processes frames slowly (low-end hardware) | Edge detection frame rate drops gracefully; a static "last detected" overlay is held when frame processing cannot keep up, rather than blocking the UI thread | Major |

**Acceptance Tests:** Verify real-time edge overlay renders without blocking viewfinder responsiveness on a reference mid-range device; verify perspective-corrected output is measurably rectangular (within a tolerance) compared to the raw frame; verify fallback to manual crop fires correctly when confidence is below threshold; verify no network traffic is generated during edge detection or perspective correction.

**Future Enhancements:** Shadow removal / illumination correction post-perspective-correction; book-page dewarping (curved page flattening); multi-document-in-frame detection with explicit selection.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 3.3 Feature: Multi-Page Document Assembly and Reordering

**Purpose:** Allow a user who has captured multiple pages in a single session to view all pages as a unified document, reorder them if captured out of sequence, delete unwanted pages, and confirm the assembled document before saving. This is the feature that makes OneConvert a document scanner rather than a photo app.

**Business Value:** Multi-page assembly is a core part of BRD-01's scanning value proposition (a single-page scanner is insufficient for assignments, contracts, or any multi-page use case). BRD-06: all assembly and reordering is local, no network required. BRD-04: the reorder UI must work across Android, iOS, and Web.

**User Story:**
> **US-SCAN-03:** As a **student who has scanned a 5-page handout**, I want to see all five pages in the order I captured them, reorder them if I got them wrong, and remove any blurry or unwanted page, so that the final document I save is clean and correctly ordered.
>
> Acceptance Criteria:
> - Given I have captured multiple pages and tapped "Done," when the document review screen opens, then I see all captured pages as thumbnails in capture order.
> - Given I drag a page thumbnail to a new position, when I release it, then the page order updates immediately with no save step required (reorder is applied in-memory until the document is saved).
> - Given I delete a page from the review screen, when confirmed, then that page is removed from the session buffer and its local staging asset is deleted.

**Functional Requirements:**
- **FR-SCAN-07:** The system shall present all pages in the current session as a scrollable, thumbnail-grid or strip review screen, given the user ends a capture session with two or more pages, resulting in a page-ordered view that reflects capture sequence and any subsequent reordering.
- **FR-SCAN-08:** The system shall support drag-to-reorder of pages on the review screen, given the document review screen is active, resulting in an updated page sequence that persists into the final saved document.
- **FR-SCAN-09:** The system shall allow deletion of individual pages from the review screen, given a page is selected for deletion and the user confirms, resulting in that page's staged asset being removed and the remaining pages renumbered correctly.
- **FR-SCAN-10:** The system shall allow the user to add more pages to an in-progress session from the review screen (re-opening the camera or triggering an import), given the review screen is active, resulting in new pages being appended to the end of the current session buffer.

**Flow:** Capture session ends -> review screen opens with page strip/grid -> user can: drag to reorder, tap to preview full-size, delete individual pages, add more pages (re-enters camera or import), or apply filters (Section 3.4) -> user taps "Save" -> assembled document committed to local document store (Section 3.7).

**Inputs:** Staged page image files (from Sections 3.1 / 3.6); user-driven reorder gestures and delete actions.

**Outputs:** Ordered list of page image references forming the document; deleted assets purged from staging storage; assembled document metadata (page count, page order array) passed to the save flow (Section 3.7).

**Business Logic:**
- Page order is maintained as an ordered array of references (not by renaming/moving files), so a reorder operation is an in-memory array mutation, not a file operation — this makes reordering instantaneous.
- Deletion of a page from the review screen triggers immediate deletion of the staged image asset from local storage (not deferred to save), to free storage promptly during long sessions.
- A session with only one page still passes through a simplified version of the review screen (showing the single page with filter/crop access), not bypassing it.
- If the user exits the review screen without saving (e.g., taps back), the system prompts to discard or keep the in-progress session. If kept, the session is preserved in staging storage and a "resume" prompt appears on next app open.

**Permissions:** All users including guests. No tier restriction on multi-page assembly.

**Errors:**
| Error Case | Handling |
|---|---|
| Staged image file is missing or corrupted when loading the review screen | Display a placeholder with a warning on that page's thumbnail; allow the user to delete the corrupt page and continue with the remaining pages |
| User attempts to add more pages but local storage is full | Block the camera/import action with a specific "storage full" message before entering the capture flow; do not lose pages already in the session |

**Limitations:**
- Drag-to-reorder on Flutter Web uses mouse drag interaction (not touch-native drag); functional equivalence must be verified on the Web platform — documented as a known cross-platform delta to be resolved in Volume 4 (Flutter Architecture).
- MVP does not support merging two previously saved documents into one from the review screen; merge of existing documents is a PDF Engine feature (Chapter 4).

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User deletes all pages from the review screen | Empty-state UI displayed with options to re-enter camera or import; the now-empty session is discarded cleanly, no empty document saved | Minor |
| User reorders pages, then adds a new page via camera | New page is appended at the end of the reordered sequence, not inserted at the original capture position | Minor |
| App crashes on the review screen before saving | On relaunch, the staged session assets are still present (written to disk on capture); the resume session prompt allows the user to recover all captured pages, though any unsaved reorder/delete changes are lost | Major |
| Session contains a mix of camera-captured and imported pages | No distinction is made between origin after capture; all pages are treated identically in the review screen | Minor |

**Acceptance Tests:** Verify page order in the saved document matches the reordered sequence from the review screen; verify deleted page assets are removed from disk; verify session resume works correctly after a simulated crash between capture and save; verify add-more-pages appends correctly to a reordered sequence.

**Future Enhancements:** Drag-to-reorder with animation on Web parity; automatic page-number detection to suggest correct order for out-of-sequence captures; cross-session page merge directly from the Scanner domain.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 3.4 Feature: Image Filters and Enhancement

**Purpose:** Allow users to apply post-capture image processing to each page — converting to black-and-white (for text-heavy documents), greyscale, colour-accurate, or auto-enhanced modes — to improve legibility, reduce file size, and produce output appropriate for the document's use case (submission, archiving, printing, OCR input).

**Business Value:** Filter quality is a direct driver of retention for the free tier (BRD-01): a user who gets a clean, high-contrast B&W document the first time is more likely to return than one who gets a dull grey photograph. Filters also directly impact OCR quality (Chapter 5). Filters must work offline (BRD-06).

**User Story:**
> **US-SCAN-04:** As a **student submitting scanned notes**, I want to apply a black-and-white filter to make the text crisp and reduce the file size, and preview the result before saving, so that my submission looks clean and doesn't fail due to a file size limit.
>
> Acceptance Criteria:
> - Given I am on the document review screen, when I select a filter mode, then a real-time preview of that filter is shown on the selected page thumbnail without committing the change.
> - Given I apply a filter and tap "Done," when the document is saved, then the saved page uses the filtered version, not the original.
> - Given I want different filters on different pages (e.g., colour for a photo, B&W for text), when I apply per-page filters, then each page retains its individual filter choice through to save.

**Functional Requirements:**
- **FR-SCAN-11:** The system shall provide a set of image filter modes — at minimum: Magic (auto-enhance), Black and White, Greyscale, Colour (original) — applicable per page, given the document review screen is active, resulting in a preview of the filtered image rendered before the user commits the choice.
- **FR-SCAN-12:** The system shall support per-page independent filter assignment, given a multi-page document is being reviewed, resulting in each page retaining its own filter setting through to save, not a single global filter applied to all pages.
- **FR-SCAN-13:** The system shall apply the selected filter to the final page image at save time, given a filter mode other than "Colour (original)" is active, resulting in the processed image being written to the document's permanent storage with the original staging asset retained until save is confirmed (to allow filter changes up to the point of save).

**Flow:** Review screen -> user taps a page -> filter strip appears (Magic / B&W / Greyscale / Colour) -> user selects a filter -> preview updates in real time or near-real-time on lower-end devices -> user can switch filters before confirming -> filter choice stored as per-page metadata -> on save (Section 3.7), each page's filter is applied to produce the final stored image.

**Inputs:** Captured/corrected page image; selected filter mode (per page).

**Outputs:** Filter-processed page image at save time; per-page filter metadata stored in the document record.

**Business Logic:**
- Magic (Auto-Enhance): Applies adaptive contrast stretching and background noise reduction. Specific algorithm is a Volume 8 Engine decision; the product requirement is that it visibly improves legibility on a typical handwritten notes or printed-document scan.
- Black and White: Converts to a binary (two-tone) image using an adaptive thresholding algorithm. Must preserve thin strokes (e.g., fine pencil lines) at the applied threshold, not obliterate them.
- Greyscale: Converts to single-channel grey; retains tonal variation (unlike B&W). Appropriate for pencil drawings or when full binarisation would lose detail.
- Colour: No processing applied; original perspective-corrected image is used as-is.
- Filter processing is on-device, not server-side.
- Original captured asset is retained in staging until the user commits save, enabling filter switching without re-capture.

**Permissions:** All users including guests. Filter application is a free-tier feature.

**Errors:**
| Error Case | Handling |
|---|---|
| Filter processing fails for a page (e.g., image too large for on-device processing) | Fall back to Colour (unprocessed) for that page; surface a non-blocking warning; do not block save |
| Preview render is too slow on a low-end device | Degrade preview resolution (show a lower-resolution preview thumbnail) rather than making the user wait; full-resolution filter is applied at save time |

**Limitations:**
- MVP ships with four named filter modes. Advanced controls (manual brightness/contrast sliders, custom thresholding) are a fast-follow enhancement.
- Filter preview accuracy on the thumbnail may differ slightly from the full-resolution saved output due to thumbnail scaling; the review screen includes a full-page preview tap to see a full-resolution preview.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User applies Magic filter to a photo (not a document) | Magic filter still processes; results may not be ideal but no error is shown | Minor |
| User changes filter multiple times before saving | Only the last selected filter is applied at save; no intermediate processing occurs | Minor |
| Document has 30 pages and the user applies B&W to all | Batch filter application queues all pages and processes sequentially; a progress indicator is shown; user can cancel mid-batch | Minor |

**Acceptance Tests:** Verify B&W filter produces a visibly binarised output with no greyscale residue in the saved image; verify per-page filter independence (Page 1 B&W, Page 2 Colour saves as expected); verify filter changes up to the moment of save are honoured; verify no network call is made during filter processing.

**Future Enhancements:** Manual brightness, contrast, and sharpness sliders; custom threshold control for B&W; batch "apply this filter to all pages" shortcut; filter presets saved as user preferences.

**Traces to:** BRD-01, BRD-06.

---

## 3.5 Feature: Manual Crop and Perspective Adjustment

**Purpose:** Allow a user to manually correct or override the automatic edge detection result (Section 3.2) by dragging the four corner handles of the document boundary to their correct positions, and to perform a free-form rectangular crop on any page. This is the fallback and override mechanism for all cases where automatic detection produces an incorrect or low-confidence result.

**Business Value:** Without a reliable manual correction path, automatic edge detection failures result in permanently distorted or uncropped documents, causing user frustration that directly damages the free-tier funnel (BRD-01). Manual crop is the standard capability baseline for any scanner app competitor. BRD-06 requires this to work fully offline.

**User Story:**
> **US-SCAN-05:** As a **user whose document edge detection missed the corner of a page**, I want to drag the corner handles to the correct positions and re-apply the perspective correction, so that the straightened output is correct even though the automatic detection failed.
>
> Acceptance Criteria:
> - Given edge detection was applied automatically, when I open the manual crop view for a page, then I see the current quadrilateral overlaid on the image with four draggable corner handles at the detected (or full-frame-default) positions.
> - Given I drag a corner handle to a new position, when I release it, then the perspective correction preview updates to reflect the new corners.
> - Given I tap "Apply," when the operation completes, then the perspective-corrected image using my adjusted corners replaces the previously stored version for that page.

**Functional Requirements:**
- **FR-SCAN-14:** The system shall present a full-screen manual crop editor with a four-point draggable quadrilateral overlaid on the page image, given a page is opened for manual adjustment (either via automatic fallback from Section 3.2 or user-initiated override), resulting in a visible, touch-responsive interface for adjusting all four corner handles independently.
- **FR-SCAN-15:** The system shall re-apply perspective correction using the user-adjusted corner coordinates, given the user confirms the corner positions, resulting in a new perspective-corrected image that replaces the previous version for that page in the session buffer.
- **FR-SCAN-16:** The system shall also support a standard rectangular crop (removing margins without perspective correction), given the user selects the rectangular crop tool within the editor, resulting in a cropped image with no perspective transform applied.

**Flow:** User taps a page -> selects "Adjust" / "Crop" -> manual crop editor opens showing the image with the current quadrilateral -> user drags corner handles -> live perspective-corrected preview shown -> user confirms -> corrected image written back to session buffer -> return to review screen.

**Inputs:** Page image (from session buffer); current corner coordinates (from auto-detection or full-frame default); user touch/drag interactions on corner handles.

**Outputs:** Updated perspective-corrected page image stored back into the session buffer; updated corner coordinates stored as metadata.

**Business Logic:**
- Corner handles must be constrained to the bounds of the image (cannot be dragged outside the image frame).
- If the user drags corners into a concave (non-convex) quadrilateral shape, the system must detect and prevent this (a concave quadrilateral produces an invalid perspective transform), showing a visual indicator that the corners are invalid.
- The editor must support pinch-to-zoom so users can precisely position handles on high-resolution images where corner positions are close together.
- On the Web platform (BRD-04), handle dragging uses mouse events; touch events apply on mobile. Both must be tested.
- A "Reset" control restores corners to the auto-detection result (or full-frame corners if detection was not confident), providing an undo path.

**Permissions:** All users including guests. Manual crop is a free-tier feature.

**Errors:**
| Error Case | Handling |
|---|---|
| User places corners in an invalid configuration (concave or self-intersecting quadrilateral) | Highlight the invalid handle(s) visually; disable the "Apply" button; show a brief inline tooltip explaining the constraint |
| Perspective correction with the given corners produces a degenerate output (e.g., extremely thin sliver) | Warn the user ("resulting image may be too narrow") but allow confirmation if they choose |

**Limitations:**
- MVP manual crop editor does not include a rotation tool separate from perspective correction. Free rotation is a fast-follow enhancement.
- Undo/redo within the crop editor is limited to a single "Reset to detection result" action; step-by-step undo of individual handle moves is not in MVP scope.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User opens manual crop on a page that already had manual crop applied | The editor opens with the previously applied corner positions, not the original auto-detection corners | Minor |
| User adjusts crop on a page, returns to review, then adds a filter | Filter is applied to the cropped image, not to the pre-crop original | Minor |
| Two corner handles are dragged to the same point | Both handles become coincident; perspective transform is degenerate; system blocks confirmation with an error indicator | Minor |

**Acceptance Tests:** Verify dragging handles to known correct positions produces a measurably less-distorted output than the auto-detection result; verify the Reset action restores original detection corners; verify concave quadrilateral is blocked; verify the edited page replaces the original in the session buffer.

**Future Enhancements:** Free rotation control (separate from perspective); step undo/redo for handle movements; assistive guides (rule-of-thirds, edge-snap) for precise alignment.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 3.6 Feature: Document Import (Files, Gallery, Cloud)

**Purpose:** Allow users to bring existing documents and images into OneConvert from their device's file system, photo gallery, or (for signed-in users) connected cloud storage — so that the Scanner domain serves as the universal intake point for any file the user wants to process, not just camera-captured documents.

**Business Value:** Import broadens the acquisition funnel (BRD-01) to users who already have digital files but need OneConvert's processing capabilities. It is also necessary for the Web platform (BRD-04) where camera capture is limited, making import the primary intake method for Web.

**User Story:**
> **US-SCAN-06:** As a **freelancer who received a scanned PDF by email**, I want to import it into OneConvert from my Files app so I can run OCR on it and edit the text, without re-scanning it from scratch.
>
> Acceptance Criteria:
> - Given I tap the Import action, when I select a file from the Files app or Gallery, then the file is ingested into OneConvert and appears in the document review screen ready for processing.
> - Given I select a multi-page PDF for import, when import completes, then all pages of the PDF are individually accessible in the review screen, matching the original page order.
> - Given I am a guest user, when I attempt to import from a connected cloud storage provider, then I am prompted to sign in first, with my import intent preserved.

**Functional Requirements:**
- **FR-SCAN-17:** The system shall allow import of supported file types (JPEG, PNG, HEIC, PDF, TIFF) from the device's native file picker and photo gallery, given the user triggers the import action, resulting in the selected file(s) being ingested into the local document intake pipeline.
- **FR-SCAN-18:** The system shall decompose an imported multi-page PDF into its constituent page images for display in the review screen, given a PDF is selected for import, resulting in per-page access consistent with camera-captured pages.
- **FR-SCAN-19:** The system shall support import from connected cloud storage providers (Google Drive, Dropbox — minimum for MVP), given the user is signed in and has authorised the respective cloud provider, resulting in the remote file being downloaded and ingested into the local pipeline.
- **FR-SCAN-20:** The system shall validate that imported files do not exceed a defined maximum file size and are of a supported format, given any import attempt, resulting in a specific rejection message (size exceeded, unsupported format) rather than a silent failure or crash.

**Flow:** User selects Import -> chooses source (Files / Gallery / Cloud) -> (if Cloud and not signed in: sign-in prompt) -> native picker or cloud file browser -> user selects file(s) -> validation (format, size) -> ingestion: copy to local staging, decompose PDF pages if applicable -> review screen opens with ingested content.

**Inputs:** File reference(s) from picker; file content (bytes) read from device storage or downloaded from cloud.

**Outputs:** Ingested file(s) stored in local staging; per-page image assets (for PDFs); document intake record ready for the review screen (Section 3.3) or direct processing.

**Business Logic:**
- Imported files are copied into the app's private staging directory, not referenced in place — the app controls the lifecycle of its working copies regardless of changes to the source file.
- HEIC is converted to JPEG on Android/Web during ingest. On iOS, HEIC is natively readable; conversion is applied if the downstream PDF Engine requires JPEG input.
- PDF import decomposes pages into images at a configurable target DPI (default 200 DPI, sufficient for legibility and OCR). Original PDF may also be preserved alongside the images for engines that work better with the native PDF (Volume 8 Engine decision).
- Cloud import is an authenticated, per-file download — no bulk cloud sync at this stage (cloud sync is Chapter 8). This feature is import-on-demand only.
- File size limit is configurable via backend-delivered config; default 100 MB per file in MVP.

**Permissions:** File/gallery import is available to all users including guests. Cloud import requires sign-in. Cloud provider authorisation (OAuth) is managed via the Account domain (Chapter 2).

**Errors:**
| Error Case | Handling |
|---|---|
| Unsupported file format selected | Reject with a clear list of supported formats; do not crash or silently ingest a file that will fail downstream |
| File exceeds maximum size limit | Reject before ingestion begins with the specific size limit stated |
| Cloud provider authorisation token expired at time of import | Re-prompt for provider sign-in; preserve the file selection intent so the user does not have to re-navigate to the file after re-authorising |
| Import of a large PDF is interrupted (app backgrounded, network lost) | Partial ingestion state is cleaned up; the user is returned to the Import screen with a clear "Import was interrupted" message, not a partially-ingested corrupt document |

**Limitations:**
- MVP cloud import supports Google Drive and Dropbox. Additional providers (OneDrive, Box) are fast-follow and listed in the Cloud and Sync chapter (Chapter 8).
- Batch import (selecting multiple files at once from the file picker) is supported for images; multi-file PDF import is deferred to a fast-follow release.
- On Flutter Web, HEIC import is not supported (browser limitation); a specific format rejection message instructs Web users to convert HEIC to JPEG before importing.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User imports a password-protected PDF | Prompt for the PDF password; if entered correctly, decompose as normal; if wrong or cancelled, reject with a specific "PDF is password protected" message | Major |
| Imported PDF has 200 pages | Decomposition is queued and paged; a progress indicator is shown; the review screen populates incrementally as pages are decomposed | Minor |
| User imports a corrupted or malformed PDF | Reject after ingestion attempt with a specific "file appears to be corrupted" message; staging assets are cleaned up | Major |
| User selects the same file twice in one import session | Deduplicate silently (second selection is ignored) and ingest only once | Minor |

**Acceptance Tests:** Verify a 10-page PDF import produces exactly 10 pages in the review screen in correct order; verify unsupported format rejection fires before any file bytes are read; verify password-protected PDF prompts for password and succeeds on correct entry; verify cloud provider token expiry triggers re-auth, not a silent failure.

**Future Enhancements:** Batch multi-file PDF import with page-order management; additional cloud provider support (OneDrive, Box, iCloud Drive); drag-and-drop import on Web; URL import (paste a URL to a publicly accessible document).

**Traces to:** BRD-01, BRD-02, BRD-04, BRD-06.

---

## 3.7 Feature: Local Document Save and Export (PDF / JPEG)

**Purpose:** Commit a reviewed, filtered, and assembled document (from Section 3.3) to the app's permanent local document store and allow the user to export it as either a single-file PDF or individual JPEG images — covering the full "scan to file" journey that constitutes the core free-tier value delivery.

**Business Value:** Save and export is the completion step of BRD-01's scanning funnel. A user who cannot get a clean, shareable file out of the app has received no value regardless of how good the capture and processing were. BRD-06 requires this to work fully offline — the user must be able to get a file out of the app with no connectivity.

**User Story:**
> **US-SCAN-07:** As a **student who has scanned and filtered a 4-page assignment**, I want to save it as a single PDF on my device and then share it directly to my college's submission portal, so that I can complete my task without leaving the app.
>
> Acceptance Criteria:
> - Given I tap "Save as PDF" from the review screen, when the save completes, then a single PDF containing all pages in the reviewed order is written to the app's local document library.
> - Given the PDF has been saved, when I tap "Share," then the system share sheet opens with the PDF available for sharing to any app or service on the device.
> - Given I have no network connection, when I save and export, then the file is produced locally and available immediately with no connectivity required.

**Functional Requirements:**
- **FR-SCAN-21:** The system shall assemble all reviewed pages into a single PDF document, given the user selects "Save as PDF" from the review screen, resulting in a standards-compliant PDF file written to the app's local document library with page dimensions preserved from the corrected/filtered images.
- **FR-SCAN-22:** The system shall allow export of a saved document as individual JPEG files (one per page), given the user selects "Export as Images," resulting in a set of JPEG files accessible via the system share sheet or the device's files/gallery.
- **FR-SCAN-23:** The system shall present the system-native share sheet, given the user taps Share on a saved document, resulting in the document being shareable to any registered app or service on the device without requiring the user to navigate out of OneConvert.
- **FR-SCAN-24:** The system shall allow the user to assign a document name before saving, given the save flow is initiated, resulting in the file stored under the chosen name (defaulting to a date-time-based name if none is provided).

**Flow:** Review screen -> user taps "Save" -> name prompt (pre-filled with date-time default) -> format selection (PDF / JPEG images) -> document assembled and written to local document library -> confirmation screen with Share and Open options -> on Share: system share sheet opens with the file.

**Inputs:** Reviewed page sequence (ordered image references with applied filter metadata); document name; output format selection (PDF / JPEG).

**Outputs:** PDF file or set of JPEG files in the app's local document library; a document metadata record in the local database (document name, page count, creation date, file path, file size, format, associated user ID or anonymous UUID).

**Business Logic:**
- PDF assembly uses a standards-compliant PDF writer (specific library is a Volume 8 Engine decision). Output PDF must be a valid, renderable PDF/1.4 or later.
- PDF page size defaults to the corrected image dimensions (not forced to A4/Letter), preserving actual document proportions. A "fit to A4" option is a fast-follow enhancement.
- JPEG export quality is configurable (default: 85% quality). Quality preset options are a fast-follow enhancement.
- All write operations are fully local — no file data is uploaded during save unless the user explicitly has cloud sync enabled (Chapter 8). This is the BRD-06 guarantee.
- A document metadata record is written to the local database atomically with the file write; if the file write fails, the metadata record is not committed (no orphan records).
- Saved documents appear in the app's document library (Chapter 8) immediately after save, without requiring a manual refresh.

**Permissions:** Save to local library is available to all users including guests. Cloud sync of saved documents requires sign-in (Chapter 8). Export to PDF is a free-tier feature.

**Errors:**
| Error Case | Handling |
|---|---|
| Local storage full at time of save | Abort save before writing; notify the user of insufficient storage and suggest clearing space; staging assets are preserved so the save can be retried |
| PDF assembly fails (invalid image data) | Surface a specific "could not create PDF — one or more pages may be corrupt" error; offer the user the option to remove the problematic page and retry |
| User provides a document name containing characters invalid for the local filesystem | Sanitise the name client-side (remove or replace invalid characters) and confirm the sanitised name with the user before saving |

**Limitations:**
- MVP PDF output is image-based (each page is a rendered image within the PDF), not a text-layer PDF. Searchable PDF (text-layer embedded via OCR) is a separate, paid OCR Engine feature (Chapter 5), not produced at this save step.
- "Save to device Photos/Gallery" is not a separate export target in MVP; JPEG export via the share sheet achieves the equivalent outcome via the system save-to-photos action.
- PDF compression at save time uses standard lossless image-in-PDF packaging. Explicit PDF compression is a PDF Engine feature (Chapter 4).

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User saves a document while the device battery drops to critical and the OS kills the app | If the file write was not yet atomic, the partial file is detected on next open and cleaned up; the staging assets should still be present if not yet committed, allowing a retry | Major |
| User saves a document with an empty name (clears the default) | A date-time-based name is silently substituted; the save is not blocked | Minor |
| Two documents are saved within the same second (same default name would be generated) | A suffix (e.g., _2, _3) is appended to ensure unique file names; no overwrite of a same-named document occurs without explicit user confirmation | Minor |

**Acceptance Tests:** Verify the output PDF opens in a standard PDF viewer with all pages in the correct order; verify file write is atomic (a simulated write interruption does not leave a partial file that the app considers successfully saved); verify JPEG export produces one file per page; verify the share sheet surfaces the file correctly; verify the save flow completes with no network activity.

**Future Enhancements:** Save-to-A4 / page-size normalization option; JPEG quality presets at export; direct save to a specific folder in the document library; "save and immediately OCR" shortcut from the save confirmation screen.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 3.8 Feature: Auto-Capture (Smart Shutter)

**Priority:** Should (Fast-follow)

**Purpose:** Automatically trigger the camera shutter when the device detects that a document is well-framed, steady, and in focus — removing the need for the user to manually tap a button for each page, and enabling faster scanning of long multi-page documents (textbooks, reports, contracts).

**Business Value:** Auto-capture directly accelerates the high-frequency scanning use case that drives habitual retention post-acquisition. It is a Fast-follow rather than MVP feature because the core capture flow (Section 3.1) is functional without it; auto-capture is a quality-of-life enhancement that deepens retention rather than enabling the core funnel.

**User Story:**
> **US-SCAN-08:** As a **student scanning a 20-page textbook chapter**, I want the app to automatically capture each page when I hold the phone steadily over it, so that I can scan all 20 pages quickly without tapping the button each time.
>
> Acceptance Criteria:
> - Given auto-capture is enabled, when the viewfinder detects a stable, in-focus document with high-confidence edge detection, then a capture is triggered automatically after a brief countdown animation (giving the user a moment to react and cancel if needed).
> - Given auto-capture triggers, when the capture fires, then the same quality of edge detection and perspective correction (Section 3.2) is applied as for a manual capture.
> - Given I do not want auto-capture for a session, when I toggle it off, then the camera reverts to manual-trigger mode for the remainder of that session.

**Functional Requirements:**
- **FR-SCAN-25:** The system shall automatically trigger a capture event when all of the following are met: (a) edge detection confidence at or above defined threshold, (b) frame motion/blur score below a defined stability threshold, (c) a configurable hold-steady timer (default: 1.5 seconds) has elapsed since conditions were first met — resulting in a capture without a user tap.
- **FR-SCAN-26:** The system shall display a visual countdown or progress indicator to the user during the hold-steady period before an auto-capture fires, given conditions for auto-capture are met, resulting in the user having a visible opportunity to move the camera away to cancel the pending capture.
- **FR-SCAN-27:** The system shall support toggling auto-capture on and off within the camera session, given the camera view is active, resulting in the setting being respected for the remainder of that session without requiring a restart.

**Flow:** Camera active -> auto-capture toggle enabled -> per-frame: evaluate edge confidence + stability score -> if both thresholds met: start hold-steady countdown (visual indicator shown) -> if conditions remain met through countdown: capture fires (same path as Section 3.1 manual capture) -> page added to session -> camera returns to viewfinder ready for next page -> if conditions drop during countdown: countdown resets, no capture.

**Inputs:** Live frame stream (for stability and edge confidence scoring); hold-steady timer; auto-capture toggle state.

**Outputs:** Automatically captured page (indistinguishable from a manually triggered capture in the session buffer); per-capture audit flag indicating it was auto-triggered (for debugging/analytics).

**Business Logic:**
- Auto-capture is opt-in per session, off by default in MVP (user must consciously enable it). This avoids unwanted captures for users who are not aware of the feature.
- The hold-steady timer default of 1.5 seconds is configurable via backend-delivered config. Too short causes false triggers; too long defeats the speed benefit — the initial default is set conservatively.
- A brief audio feedback (shutter sound) and visual flash indicate the auto-capture fired, consistent with manual capture feedback.

**Permissions:** All users. No tier restriction.

**Errors:**
| Error Case | Handling |
|---|---|
| Auto-capture fires unintentionally on a background surface (not a document) | User can delete the unwanted page from the review screen (Section 3.3); no automatic undo of an auto-capture is provided in MVP |
| Auto-capture fires too rapidly on consecutive pages | A minimum interval between auto-captures (default: 1 second after the last capture) prevents burst false-positives |

**Limitations:** Auto-capture on Flutter Web is out of scope for Fast-follow (WebRTC frame-rate constraints make real-time stability scoring impractical); Web auto-capture is deferred to a future phase.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User's hand trembles persistently (conditions never met) | Manual capture button remains fully functional as a fallback; auto-capture simply does not fire; no error state | Minor |
| Auto-capture fires while the user is flipping to the next page (motion blur) | Stability threshold prevents a blurred mid-flip frame from triggering; the steady next-page frame triggers instead | Minor |

**Acceptance Tests:** Verify auto-capture does not fire when the frame is in motion; verify the countdown animation is visible and resets on destabilisation; verify toggle state persists through the session and resets on the next session start; verify auto-captured pages are processed identically to manually captured pages.

**Future Enhancements:** User-configurable hold-steady delay; per-session memory of the last auto-capture preference; adaptive threshold learning based on the user's typical scanning environment.

**Traces to:** BRD-01, BRD-06.

---

## 3.9 Feature: Batch Scan Mode

**Priority:** Should (Fast-follow)

**Purpose:** Allow a user to initiate a scan session with an explicit intent to produce multiple separate documents (e.g., scanning 10 individual receipts into 10 separate single-page files, rather than a single 10-page document) — with the Scanner automatically segmenting captures into individual documents based on a user-defined delimiter or a fixed pages-per-document setting.

**Business Value:** The freelancer and small-business-owner personas (Volume 1, Section 1.5) regularly need to scan and organise many individual documents in one sitting (receipts, invoices, ID copies). Without batch mode, they must manually initiate a new scan session per document, creating high friction for a task that should take a few seconds per item.

**User Story:**
> **US-SCAN-09:** As a **freelancer who needs to scan 15 individual receipts**, I want to scan them in one continuous session and have the app automatically save each as a separate document, so that I end up with 15 named files instead of one 15-page document.
>
> Acceptance Criteria:
> - Given I select "Batch Scan" mode, when I capture pages, then each capture (or each N pages, per setting) is saved as an independent document, not appended to a single multi-page document.
> - Given a batch session ends, when I review, then I see a list of the N documents produced with the ability to rename each before final save.
> - Given one document in the batch produces a poor scan, when I tap that document, then I can re-scan or delete just that document without disrupting the other documents in the batch.

**Functional Requirements:**
- **FR-SCAN-28:** The system shall support a batch scan mode where each capture (or each user-defined N pages) is saved as an independent document, given the user enables batch mode before starting a capture session, resulting in N individual document records being created from a single scan session.
- **FR-SCAN-29:** The system shall provide a batch review screen showing all documents produced in the session as a list of thumbnail cards, given the batch session ends, resulting in a per-document rename, delete, re-scan, and save workflow before committing any documents to the permanent library.
- **FR-SCAN-30:** The system shall allow the user to configure the segmentation rule for a batch session (one-page-per-document as default; N-pages-per-document; manual-delimiter tap), given batch mode is active, resulting in captures being grouped into documents according to the selected rule.

**Flow:** User selects Batch Scan -> configures segmentation rule -> enters camera view -> captures pages; at each segment boundary (1 page, N pages, or user-tapped delimiter) a new document is started -> batch session ends -> batch review screen shows list of produced documents -> user renames, re-scans problem documents, deletes unwanted ones -> confirms -> all documents written to local library in a single commit operation.

**Inputs:** Capture session stream; segmentation rule configuration; user-tapped delimiter events (for manual segmentation).

**Outputs:** Multiple individual document records (each with its own PDF / JPEG files and metadata) in the local document library.

**Business Logic:**
- Batch sessions produce draft documents (in staging) throughout the session; they are only committed to the permanent library when the user confirms the batch review, preventing a crash mid-batch from writing partial documents.
- Documents within a batch are auto-named by index (e.g., "Scan_1," "Scan_2") at draft time; the batch review screen allows renaming before commit.
- The manual-delimiter tap (the user taps a "New document" button between captures) is the most flexible segmentation rule and is available in addition to the automatic N-page rules.

**Permissions:** All users. No tier restriction.

**Errors:**
| Error Case | Handling |
|---|---|
| Storage exhausted mid-batch | The in-progress batch session is paused; the user is notified and offered the option to commit the documents captured so far, then continue scanning after freeing space | Major |
| User exits batch mode without saving | All staged batch documents are discarded after a discard confirmation; no partial documents are committed | Minor |

**Limitations:** Batch scan is not available on Flutter Web in Fast-follow scope (the use case is mobile-native; Web users are not the primary batch-scanning persona).

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User produces a 50-document batch | Commit operation is queued and processes sequentially; a progress indicator is shown; the library is updated incrementally | Minor |
| One document in the batch fails to save (disk error) | That specific document write is flagged as failed; all other documents in the batch are still committed; the user is informed which document(s) failed with a retry option | Major |

**Acceptance Tests:** Verify a 5-capture batch with 1-page-per-document rule produces exactly 5 separate documents in the library; verify the manual-delimiter rule correctly segments at each tap; verify a crash mid-batch does not commit partial documents; verify renaming in batch review is reflected in the saved file names.

**Future Enhancements:** Auto-naming of batch documents via OCR (detect a date, invoice number, or name on the scanned page and use it as the document name); cloud batch upload trigger immediately after batch commit.

**Traces to:** BRD-01, BRD-06.

---

## 3.10 Feature: QR / Barcode Detection at Scan Time

**Priority:** Could (Backlog)

**Purpose:** Detect QR codes and barcodes present in a scanned document or live camera view, and surface the decoded value (URL, text, product code) to the user at scan time — enabling use cases where a scanned document contains machine-readable codes the user wants to act on (e.g., opening a URL, copying a tracking number).

**Business Value:** This is a backlog feature that does not serve the core document productivity use case of BRD-01/BRD-02, but meaningfully broadens the scanner's utility for government-document scanning (QR-encoded Aadhaar cards, GST invoices), logistics, and academic contexts. It avoids users needing a separate dedicated QR scanner app, contributing to the "one-stop" positioning (Volume 1, Section 1.4).

**User Story:**
> **US-SCAN-10:** As a **government office worker scanning an Aadhaar card**, I want the app to detect and decode the QR code on the card while I'm scanning it, so that I can copy the embedded details without separately running a QR scanner app.
>
> Acceptance Criteria:
> - Given a QR code or barcode is visible in the camera frame, when it is detected, then a non-blocking overlay appears on the viewfinder indicating detection, with a tap-to-copy or tap-to-open-URL action available.
> - Given I am not interested in the QR code, when I ignore the overlay, then it disappears after a short timeout and does not interfere with the document capture flow.

**Functional Requirements:**
- **FR-SCAN-31:** The system shall detect QR codes and common 1D barcode formats (EAN-13, Code 128) in the live camera feed and in captured images, given the scanner is active and QR/barcode detection is enabled, resulting in decoded values being surfaced as a non-blocking overlay notification.
- **FR-SCAN-32:** The system shall present action options for a decoded QR/barcode value (copy to clipboard, open URL if applicable), given a QR/barcode has been decoded, resulting in the user being able to act on the decoded value without leaving the scanner session.

**Flow:** Camera active -> background QR/barcode detection runs per frame (lower priority than edge detection to not impact viewfinder performance) -> detection fires -> non-intrusive overlay appears with decoded value and action buttons -> user taps action (copy/open) or ignores -> overlay auto-dismisses after N seconds -> camera session continues normally.

**Inputs:** Live camera frame stream; captured image (for post-capture QR detection on the saved image).

**Outputs:** Decoded QR/barcode string; action result (clipboard content / browser open).

**Business Logic:** QR/barcode detection is on-device (no network). Detection runs at a lower frame-rate sampling than edge detection to preserve viewfinder performance. Detection is enabled by default but can be toggled off by the user.

**Permissions:** All users. No tier restriction.

**Errors:**
| Error Case | Handling |
|---|---|
| Decoded URL is malformed | Copy to clipboard without attempting to open; no crash |
| Multiple QR codes in a single frame | Detect and surface the most prominent (largest/highest contrast); do not overwhelm the UI with multiple overlays simultaneously |

**Limitations:** MVP detects QR and EAN-13/Code 128 1D barcodes. PDF417, DataMatrix, Aztec, and other formats are a follow-on enhancement. The overlay is informational only — no structured data extraction from decoded content is in scope for this feature.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| Document page contains a decorative QR code (not intended to be scanned by the user) | User sees the overlay and ignores it; it auto-dismisses; the scan proceeds normally | Minor |
| User taps "Open URL" on a QR code containing a malicious link | The system passes the URL to the device's default browser; responsibility for URL safety is delegated to the browser's safe-browsing mechanism | Minor |

**Acceptance Tests:** Verify a QR code in a test image is decoded correctly; verify the overlay does not appear when no QR/barcode is present; verify "copy to clipboard" places the correct decoded string; verify the overlay auto-dismisses after the configured timeout.

**Future Enhancements:** Structured data extraction for known QR formats (Aadhaar, UPI payment QR, vCard); multi-barcode detection; barcode generation (complementary output feature).

**Traces to:** BRD-01 (breadth of scanner utility).

---

## 3.11 Chapter Summary and Traceability Check

All 10 features in this chapter trace to at least one BRD row:

| Feature | Priority | BRD Trace |
|---|---|---|
| Camera Capture (Single and Multi-Page) | Must (MVP) | BRD-01, BRD-04, BRD-06 |
| Automatic Edge Detection and Perspective Correction | Must (MVP) | BRD-01, BRD-04, BRD-06 |
| Multi-Page Document Assembly and Reordering | Must (MVP) | BRD-01, BRD-04, BRD-06 |
| Image Filters and Enhancement | Must (MVP) | BRD-01, BRD-06 |
| Manual Crop and Perspective Adjustment | Must (MVP) | BRD-01, BRD-04, BRD-06 |
| Document Import (Files, Gallery, Cloud) | Must (MVP) | BRD-01, BRD-02, BRD-04, BRD-06 |
| Local Document Save and Export (PDF / JPEG) | Must (MVP) | BRD-01, BRD-04, BRD-06 |
| Auto-Capture (Smart Shutter) | Should (Fast-follow) | BRD-01, BRD-06 |
| Batch Scan Mode | Should (Fast-follow) | BRD-01, BRD-06 |
| QR / Barcode Detection at Scan Time | Could (Backlog) | BRD-01 |

No untraced requirements were introduced in this chapter. BRD-03 (Student Verification) and BRD-07 (Business/Enterprise anticipation) are not directly implicated by the Scanner domain and are addressed in Chapters 2 and 9 respectively.

**Notable cross-chapter dependencies surfaced here:**
- FR-SCAN-18 and FR-SCAN-21 depend on the **PDF Engine** (Chapter 4) for PDF decomposition and PDF assembly respectively. The Scanner domain calls these as services; Chapter 4 owns the implementation.
- FR-SCAN-19 (cloud import) depends on the **Cloud and Sync** domain (Chapter 8) for provider authentication state and file access.
- The offline-first guarantee (BRD-06) expressed in FR-SCAN-01 through FR-SCAN-24 is a hard constraint that Volume 4 (Flutter Architecture) must enforce architecturally — the product requirement is set here, the implementation pattern is set there.

**BRD-04 cross-platform deltas documented in this chapter (to carry forward to Volume 4):**
- Web: real-time edge detection on viewfinder deferred to post-MVP.
- Web: continuous multi-page camera session deferred to post-MVP (import is primary intake).
- Web: HEIC import not supported (browser constraint).
- Web: auto-capture and batch scan deferred (mobile-native use case).

Running feature count: **20 / 92** specified (10 from Chapter 2 + 10 from Chapter 3).

---
*End of Volume 2, Chapter 3. Next: Volume 2, Chapter 4 — PDF Engine Features.*
