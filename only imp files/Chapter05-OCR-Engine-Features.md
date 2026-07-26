# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 5 — OCR Engine Features

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 1 (Framework, BRD/PRD structure, NFR baseline, prioritization rules), Chapter 2 (Account, Identity, Subscription — tier entitlement enforcement), Chapter 3 (Scanner — image acquisition and preprocessing surface), Chapter 4 (PDF Engine — PDF text-layer embedding and export integrations)

---

## 5.0 Chapter Scope

This chapter documents the features in the **OCR Engine** PRD domain (Chapter 1, Section 1.3). The OCR (Optical Character Recognition) Engine transforms raw pixel data from scanned documents, camera captures, and imported images into machine-readable, searchable, and structured textual data.

The OCR Engine operates at the core of OneConvert's intelligent document processing value proposition (BRD-01, BRD-02). While basic scanning and viewing are available on the Free tier, advanced OCR features — including multi-language recognition (supporting 10+ Indian regional languages alongside major global scripts), document layout/table structure extraction, handwriting recognition (ICR), and confidence reporting — drive conversion to Student and Pro tiers.

Eight comprehensive features are specified in this chapter, followed by domain performance and offline addenda.

| # | Feature | Domain | Priority |
|---|---|---|---|
| 1 | Multi-Language On-Device & Cloud OCR | OCR Engine | Must (MVP) |
| 2 | Document Layout & Structure Analysis | OCR Engine | Must (MVP) |
| 3 | Table Extraction & Structuring | OCR Engine | Must (MVP) |
| 4 | Image Pre-Processing for OCR Optimization | OCR Engine | Must (MVP) |
| 5 | Handwriting Recognition (ICR) | OCR Engine | Should (Fast-follow) |
| 6 | OCR Confidence Scoring & Error Highlighting | OCR Engine | Must (MVP) |
| 7 | Batch OCR Processing | OCR Engine | Should (Fast-follow) |
| 8 | Multi-Format OCR Output Generator (JSON/hOCR/ALTO/Text) | OCR Engine | Must (MVP) |

---

## 5.1 Feature: Multi-Language On-Device & Cloud OCR

**Purpose:** Provide multi-language text recognition across printed and digital documents, seamlessly balancing fast on-device recognition for standard scripts with high-accuracy cloud AI models for complex Indian regional scripts (Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi) and global languages.

**Business Value:** Multi-language support — specifically deep optimization for Indian regional languages alongside English — directly addresses BRD-01's primary demographic targets (students and professionals in India and emerging markets). Fast on-device OCR ensures BRD-06 (offline-first capability) for basic English/Latin documents, while cloud OCR unlocks server-side AI precision for multi-script, low-contrast, or degraded documents.

**User Story:**
> **US-OCR-01:** As a **student studying bilingual notes in English and Hindi**, I want the app to accurately recognize both scripts on the same page, so that I can search and copy text regardless of which language it was written in.
>
> Acceptance Criteria:
> - Given I select a document containing English and Hindi text, when I trigger OCR with multi-language mode enabled, then text in both scripts is recognized accurately in the output text layer.
> - Given I am offline, when I run OCR on an English document, then the on-device OCR model processes the file locally without network dependency.
> - Given I am online and select a complex multi-script document, when processed via cloud OCR, then recognition accuracy exceeds 95% for standard printed text across all supported regional languages.

**Functional Requirements:**
- **FR-OCR-01:** The system shall provide an on-device OCR engine for offline text recognition of Latin-based scripts (English, Spanish, French, German), given a local image asset and no network connection, resulting in a text layer generated within 3 seconds per page.
- **FR-OCR-02:** The system shall integrate with a cloud-based multi-language OCR pipeline (AWS Textract / Google Cloud Vision / custom model service), given a network connection is active and multi-script or non-Latin script mode is selected, resulting in high-accuracy text extraction for 10 Indian languages (English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi) and major global languages.
- **FR-OCR-03:** The system shall support automatic script and language detection on a per-block or per-page basis, given "Auto-detect Language" mode is selected, resulting in appropriate language models being applied dynamically without requiring manual language selection per document.
- **FR-OCR-04:** The system shall allow users to manually specify up to 3 target languages for a single document, given a multi-lingual document is processed, resulting in constrained language dictionary scoring that reduces false-positive character substitutions across dissimilar scripts.

**Flow:** User triggers OCR -> System checks language settings and network connectivity -> If offline & Latin script: route to local ML Kit / Tesseract on-device engine -> If online or regional script required: submit async job to AWS/Cloud OCR pipeline -> Image pre-processed -> Text blocks, lines, and words extracted -> Bounding boxes and confidence scores generated -> Searchable PDF / text output produced.

**Inputs:** Pre-processed image frames / PDF pages; language selection mode (Auto-detect / Manual selection up to 3 languages); execution mode (On-device priority / Cloud high-accuracy priority).

**Outputs:** Extracted text structure (blocks, paragraphs, lines, words, character bounding boxes); per-word confidence scores; detected language metadata.

**Business Logic:**
- **On-Device vs Cloud Routing:** Standard English single-page OCR defaults to on-device processing for zero latency and zero server cost. Multi-lingual regional scripts or batch documents automatically route to cloud serverless workers (AWS Lambda / ECS) if online.
- **Script Mixed Parsing:** When English and a Devanagari script (e.g., Hindi/Marathi) co-exist on a page, character segmentation evaluates font family features before dictionary lookup.
- **Free Tier Entitlement:** Free users receive 5 cloud OCR pages per month and unlimited basic on-device English OCR. Student & Pro tiers receive high cloud OCR allowances (Student: 200 pages/mo, Pro: 2000 pages/mo) per Section 2.9.

**Permissions:** Basic on-device OCR available to all tiers including guests. Cloud multi-language OCR requires Student or Pro tier entitlement.

**Errors:**
| Error Case | Handling |
|---|---|
| User attempts cloud regional OCR while offline | Display specific error: "Regional script OCR requires an active internet connection. Switched to offline basic mode." |
| Script auto-detection fails (blurry/unclear text) | Fall back to user's primary app language setting and surface a prompt suggesting manual language selection |
| Cloud OCR API rate limit or service interruption | Automatically failover to secondary cloud OCR provider or queue job in local retry buffer |

**Limitations:**
- On-device OCR on low-end mobile devices is limited to English and Latin scripts in MVP due to binary size constraints (regional language models add ~40MB per language pack).
- Extremely low resolution images (< 100 DPI) produce degraded OCR accuracy regardless of cloud model strength.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| Document contains vertical text (e.g., Traditional Chinese / Japanese) | Engine detects reading order direction (vertical top-to-bottom) and structures bounding boxes accordingly | Major |
| Mixed orientation (some paragraphs upside down on same page) | Per-block rotation analysis detects block orientation and normalizes text before recognition | Major |

**Acceptance Tests:** Verify 95%+ word accuracy on standard printed English/Hindi test dataset; verify offline fall-back functions without network errors; verify multi-language selection accurately extracts mixed English-Tamil content.

**Traces to:** BRD-01, BRD-02, BRD-04, BRD-06.

---
## 5.2 Feature: Document Layout & Structure Analysis

**Purpose:** Analyze and reconstruct the structural hierarchy of a scanned document — identifying title headers, multi-column text flows, paragraphs, footers, page numbers, sidebars, and embedded visual elements — to ensure exported text retains logical reading order and document formatting.

**Business Value:** Raw OCR without layout analysis outputs jumbled, out-of-order text (e.g., reading across two columns line-by-line). Structural layout analysis turns raw character recognition into usable, formatted documents (DOCX, Markdown, HTML), directly supporting BRD-02's requirement for high-fidelity export and professional editing workflows.

**User Story:**
> **US-OCR-02:** As a **freelancer converting a multi-column magazine article PDF**, I want the extracted text to follow the natural reading flow of column 1 then column 2, so that the converted Word document does not mix text across columns.
>
> Acceptance Criteria:
> - Given a two-column scanned page, when layout analysis is executed, then text is grouped into distinct column bounding regions and sequenced column-by-column in logical reading order.
> - Given a document with headers, footers, and page numbers, when structured export (Markdown/DOCX) is generated, then headers/footers are categorized correctly and separated from main body text.
> - Given a page containing inline figures or diagrams, when analyzed, then text regions and image regions are segmented into non-overlapping semantic blocks.

**Functional Requirements:**
- **FR-OCR-05:** The system shall segment a page image into semantic layout regions (Header, Footer, Paragraph, Heading level 1-3, Column, Table, Figure, Caption, Page Number), given an OCR processing job, resulting in a structured layout tree representation of the page.
- **FR-OCR-06:** The system shall determine the correct reading order for complex layouts (multi-column text, sidebars, text wrapping around images), given layout region segmentation is complete, resulting in ordered text extraction that follows human reading order.
- **FR-OCR-07:** The system shall detect typography attributes (font size, bold, italic, line spacing, text alignment), given text block recognition, resulting in attributed text nodes embedded in the output hOCR / JSON schema.

**Flow:** Page image input -> Binarization & edge map -> Connected component analysis & deep learning layout parser (YOLO/LayoutLM based) -> Segment bounding boxes into structural categories -> Compute reading order graph -> Generate structured Document Object Model (DOM).

**Inputs:** Pre-processed page image; raw OCR character bounding boxes.

**Outputs:** Hierarchical Document Tree (JSON schema containing Region Types, Bounding Coordinates, Reading Order Index, Typography attributes).

**Business Logic:**
- **Reading Order Heuristics:** Top-to-bottom, left-to-right (for LTR scripts) reading order is modified when distinct vertical column gaps are detected. Column width thresholds prevent narrow indentations from being misclassified as columns.
- **Header/Footer Suppression Option:** Users can toggle "Exclude headers and footers from main text export" during conversion to prevent repetitive page headers from polluting extracted book chapters or reports.

**Permissions:** Student & Pro tier feature.

**Errors:**
| Error Case | Handling |
|---|---|
| Highly irregular layout (e.g., promotional flyer with curved text) | Fall back to geometric spatial ordering (top-to-bottom bounding box sequence) and notify user of complex layout detection |
| Image regions misclassified as text blocks | Noise filtering checks character density; regions with < 5% text confidence are reclassified as Figure blocks |

**Limitations:**
- Historical manuscripts or decorative calligraphy with non-standard text flow may require manual reading order adjustment in post-processing.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| Footnote references embedded mid-paragraph | Engine links footnote marker to page-bottom footnote block without interrupting paragraph reading order | Major |
| Mixed LTR (English) and RTL (Arabic/Hebrew) text in same block | Bi-directional (BiDi) layout algorithm applies appropriate reading direction per segment | Major |

**Acceptance Tests:** Verify 2-column and 3-column test documents extract text in column sequence; verify headings H1-H3 are categorized with correct tags in Markdown export; verify figures are separated from text blocks.

**Traces to:** BRD-01, BRD-02, BRD-05.

---

## 5.3 Feature: Table Extraction & Structuring

**Purpose:** Detect, parse, and reconstruct tabular data from scanned documents, financial reports, invoices, and forms into fully structured spreadsheet formats (XLSX, CSV) and interactive HTML/Markdown tables, preserving cell relationships, merged cells, and numerical formatting.

**Business Value:** Manual re-keying of tables from scanned financial statements or receipts is one of the most time-consuming tasks for business and accounting users (BRD-02, BRD-07). Table extraction provides massive time savings, serving as a key monetization driver for Pro and Enterprise subscriptions.

**User Story:**
> **US-OCR-03:** As an **accountant reviewing scanned bank statements**, I want to extract all financial tables directly into an Excel spreadsheet, so that I can analyze the numbers without manually typing every row and column.
>
> Acceptance Criteria:
> - Given a scanned page containing a financial table (with or without grid lines), when Table Extraction is run, then a clean spreadsheet (XLSX/CSV) is generated with exact row and column cell alignment.
> - Given a table with merged header cells (spanning multiple columns), when extracted, then cell span attributes (colspan/owspan) are preserved accurately.
> - Given numerical data in table cells, when exported to Excel, then numbers are formatted as numeric values (not plain text) allowing immediate SUM/formula calculations.

**Functional Requirements:**
- **FR-OCR-08:** The system shall automatically detect border-lined and borderless tables within a document page, given an OCR processing job, resulting in isolated table bounding regions separated from surrounding narrative text.
- **FR-OCR-09:** The system shall parse table grid structures — identifying rows, columns, header rows, data cells, and merged cells (rowspan/colspan) — resulting in a structured 2D matrix model of the table.
- **FR-OCR-10:** The system shall export extracted tables to XLSX, CSV, HTML, and Markdown table syntax, given user export selection, resulting in ready-to-use tabular files with preserved column alignment and numeric data types.
- **FR-OCR-11:** The system shall provide an interactive Table Review Editor, given table extraction completes, resulting in a UI preview where users can adjust column separators, merge/split cells, and correct cell values before final export.

**Flow:** Page image -> Table detection model (detect bounding box) -> Cell boundary detection (grid line analysis + text alignment clusters) -> OCR character recognition per cell -> Matrix reconstruction -> Interactive validation editor -> Export to XLSX/CSV.

**Inputs:** Page image / PDF page; user table detection region (optional manual crop override).

**Outputs:** Structured Table Object (JSON matrix with row/col indices, spans, cell values, confidence scores); exported .xlsx / .csv files.

**Business Logic:**
- **Borderless Table Recognition:** For tables without printed lines, column boundaries are calculated using vertical whitespace projection profiles and character alignment centroids.
- **Data Type Inference:** Extracted cell text is parsed for currency symbols ($, ₹, €), dates, and decimals (1,234.56), casting values to native Excel numerical formats while preserving display formatting.

**Permissions:** Student tier (CSV export, up to 5 tables/mo); Pro tier (unlimited XLSX/CSV/HTML table extraction & Interactive Editor).

**Errors:**
| Error Case | Handling |
|---|---|
| Skewed or distorted table grid | Apply high-precision deskewing prior to cell segmentation; if grid lines remain non-orthogonal, surface interactive grid overlay for manual alignment |
| Multi-page table spanning 5+ pages | Engine detects matching column header signatures across consecutive pages and merges them into a single contiguous worksheet |

**Limitations:**
- Handwritten tables or tables with complex nested sub-tables may require manual correction in the interactive Table Review Editor.

**Acceptance Tests:** Verify bank statement scan exports to XLSX with correct column headers and row alignment; verify numeric cells in XLSX allow =SUM() formulas without type error; verify merged header cells export with correct colspan.

**Traces to:** BRD-02, BRD-05, BRD-07.

---

## 5.4 Feature: Image Pre-Processing for OCR Optimization

**Purpose:** Automatically clean, enhance, deskew, binarize, and de-noise scanned document images prior to feeding them into the OCR engine — maximizing character recognition accuracy on low-quality, shadowed, crumpled, or degraded physical originals.

**Business Value:** Real-world scans (especially mobile camera captures by students or field workers) suffer from uneven shadows, glare, skew, and background bleed-through. Pre-processing directly increases OCR accuracy by up to 40% on poor-quality inputs, protecting retention and reducing engine failure rates (BRD-01, BRD-06).

**User Story:**
> **US-OCR-04:** As a **user photographing a textbook page under poor indoor lighting**, I want the app to remove shadows and background darkness automatically before running OCR, so that text is recognized cleanly without missing words.
>
> Acceptance Criteria:
> - Given an image with heavy shadows or uneven lighting, when pre-processing is applied, then background illumination is normalized and text contrast is sharp.
> - Given a document captured at an angle (skewed by up to 30 degrees), when pre-processing runs, then the image is automatically straightened (deskewed) to 0 degrees alignment.
> - Given a document with severe bleed-through (ink from reverse side visible), when binarization runs, then reverse-side noise is suppressed while primary text remains crisp.

**Functional Requirements:**
- **FR-OCR-12:** The system shall calculate image skew angle and apply automatic rotation/deskew correction (up to +/- 45 degrees), given an input document image, resulting in text lines aligned horizontally parallel to the frame baseline.
- **FR-OCR-13:** The system shall apply adaptive thresholding and binarization (Sauvola / Otsu adaptive methods), given an image with non-uniform lighting or low contrast, resulting in a clean binary (black text on white background) image optimized for OCR.
- **FR-OCR-14:** The system shall perform background illumination flattening and shadow removal, given uneven lighting artifacts in camera captures, resulting in consistent background luminance across the page.
- **FR-OCR-15:** The system shall apply speckle noise reduction and hole-filling filters, given grainy or dirty scans, resulting in isolated noise pixels removed without thinning thin character strokes.

**Flow:** Raw camera frame / image file -> Skew estimation (Hough Transform / Radon Transform) -> Deskew warping -> Illumination estimation & background subtraction -> Adaptive binarization -> Despeckling -> Output enhanced image passed to OCR engine.

**Inputs:** Raw image buffer (JPEG/PNG/HEIC).

**Outputs:** Enhanced, deskewed, binarized 300 DPI equivalent image buffer; pre-processing metrics metadata (detected skew angle, contrast delta).

**Business Logic:**
- Pre-processing runs automatically as an invisible pipeline stage prior to OCR.
- Non-destructive processing: The original colored photograph is retained for visual display if requested; the enhanced binary version is fed strictly to the OCR recognition model.

**Permissions:** All tiers including guests (core system pipeline capability).

**Errors:**
| Error Case | Handling |
|---|---|
| Extremely blurry image (Laplacian variance below sharpness threshold) | Warn user: "Image is too blurry for reliable OCR. Please retake photo with steady camera." |
| Over-binarization deletes thin font lines | Dynamic threshold fall-back adjusts window size to preserve delicate strokes (e.g., light pencil or fine print) |

**Acceptance Tests:** Verify skewed image (15 deg) deskews to < 0.5 deg residual skew; verify shadow across page is removed leaving uniform white background; verify OCR accuracy on shadowed photo improves by at least 25% post pre-processing.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 5.5 Feature: Handwriting Recognition (ICR)

**Priority:** Should (Fast-follow)

**Purpose:** Recognize and transcribe handwritten text — including cursive script, block printed notes, form fill-in fields, and margin annotations — into editable digital text using specialized Intelligent Character Recognition (ICR) neural network models.

**Business Value:** Students taking handwritten lecture notes, medical professionals filling forms, and field workers taking site notes represent major user segments (Volume 1). Providing reliable ICR sets OneConvert apart from basic document scanners, driving Pro-tier upgrades (BRD-02).

**User Story:**
> **US-OCR-05:** As a **student who takes handwritten notes in class**, I want to scan my notebook pages and convert my handwriting into typed digital text, so that I can search my notes and paste them into my study guides.
>
> Acceptance Criteria:
> - Given a page of neat handwritten notes, when ICR is executed, then handwritten words are transcribed into typed text with high character accuracy.
> - Given a form containing handwritten block letters in fill-in boxes, when processed, then each box value is extracted into the corresponding structured field.
> - Given a mix of printed text and handwritten margin notes on a single page, when processed, then printed and handwritten regions are differentiated and tagged accordingly.

**Functional Requirements:**
- **FR-OCR-16:** The system shall segment page regions into printed text vs. handwritten script (ICR target), given an input document containing mixed writing styles, resulting in specialized recognition models applied to each text type.
- **FR-OCR-17:** The system shall transcribe English cursive and print handwriting into machine-encoded Unicode text, given a handwritten document page, resulting in editable text output.
- **FR-OCR-18:** The system shall recognize handwritten digits and characters within structured form fields (constrained fill boxes), given a scanned form, resulting in individual field extraction with confidence scores.

**Flow:** Image input -> Print vs. Handwriting classifier -> Handwritten stroke grouping -> Neural sequence recognition (CRNN/Transformer ICR model) -> Language dictionary beam search -> Transcribed text output with per-word confidence.

**Inputs:** Enhanced image region containing handwriting; language model selection.

**Outputs:** Transcribed text string; confidence scores per word; handwriting bounding boxes.

**Business Logic:**
- ICR is computationally intensive and operates exclusively as a cloud service (or high-end on-device model for supported devices).
- Lexicon-assisted decoding utilizes contextual dictionaries to disambiguate ambiguous handwritten letter pairs (e.g., cl vs d, 1 vs l).

**Permissions:** Pro tier feature.

**Errors:**
| Error Case | Handling |
|---|---|
| Unreadable scribbles or extreme illegibility (confidence < 45%) | Transcribe best guess, highlight word in yellow, and attach tag [Uncertain] in output |

**Acceptance Tests:** Verify 85%+ word accuracy on standard IAM handwriting dataset samples; verify form fill-in box digit extraction accuracy > 95%.

**Traces to:** BRD-02, BRD-05.

---
## 5.6 Feature: OCR Confidence Scoring & Error Highlighting

**Purpose:** Calculate and report confidence scores for every recognized word and character, visually highlighting low-confidence words in an interactive review editor so users can rapidly inspect and correct potential OCR errors without reading through the entire document.

**Business Value:** No OCR engine is 100% accurate on degraded documents. By highlighting only the 2-5% of words where confidence is low, users save up to 90% of proofreading time. This transparency builds user trust and ensures error-free document processing for critical legal or academic submissions (BRD-02).

**User Story:**
> **US-OCR-06:** As a **student reviewing an OCR-processed historical document**, I want low-confidence words highlighted in yellow in the preview, so that I can quickly click on them, check the original image crop, and fix typos without proofreading every sentence.
>
> Acceptance Criteria:
> - Given an OCR-processed document, when viewed in the OCR Verification Editor, then words with confidence scores below a threshold (default: 80%) are highlighted with a colored background.
> - Given a highlighted low-confidence word, when clicked/tapped, then a popup displays a zoomed-in crop of the original image source alongside a text edit input.
> - Given a user edits a low-confidence word, when saved, then the updated text is written to the final output file and the word's confidence is set to 100% (user confirmed).

**Functional Requirements:**
- **FR-OCR-19:** The system shall calculate normalized confidence scores (0% to 100%) for every character, word, and paragraph recognized by the OCR engine, resulting in granular accuracy metadata stored alongside the text layer.
- **FR-OCR-20:** The system shall provide an interactive OCR Verification Editor UI that highlights words below a configurable confidence threshold (default: 80%, adjustable from 50% to 95%), resulting in an visual review workflow.
- **FR-OCR-21:** The system shall display a synchronous side-by-side or overlay comparison showing the exact cropped region of the original source image when a word is selected in the Verification Editor, resulting in instant visual verification.
- **FR-OCR-22:** The system shall generate a summary document quality index (e.g., "96.4% Accuracy - High Quality"), given OCR completion, resulting in an immediate overview of document fidelity.

**Flow:** OCR engine completes -> Output JSON contains word confidence array -> User opens Verification Editor -> Low-confidence words highlighted -> User steps through flagged words (Next Error shortcut) -> User approves/edits -> Clean final file exported.

**Inputs:** OCR JSON metadata with bounding boxes & confidence scores; source image.

**Outputs:** Corrected OCR JSON/Text; document accuracy score report.

**Business Logic:**
- **Confidence Threshold Categories:**
  - High (>= 85%): Clean text, no highlight.
  - Medium (70% - 84%): Yellow highlight, review recommended.
  - Low (< 70%): Orange/Red highlight, explicit correction recommended.

**Permissions:** Student & Pro tier feature.

**Errors:**
| Error Case | Handling |
|---|---|
| Image crop missing from cache | Render zoomed region directly from original high-res document page asset |

**Acceptance Tests:** Verify low confidence words (< 80%) are highlighted; verify clicking word opens correct image crop; verify user edit updates final export file.

**Traces to:** BRD-01, BRD-02.

---

## 5.7 Feature: Batch OCR Processing

**Priority:** Should (Fast-follow)

**Purpose:** Queue, manage, and execute OCR processing across large sets of multi-page documents in the background — with progress monitoring, pause/resume controls, and automated notification upon completion.

**Business Value:** Business and academic users frequently deal with folders containing 20+ scanned PDFs or 100+ images. Batch processing enables asynchronous "set-and-forget" workflows, preventing UI blocking and optimizing cloud resource consumption (BRD-02, BRD-05).

**User Story:**
> **US-OCR-07:** As a **researcher with a folder of 50 scanned PDFs**, I want to submit all of them for OCR at once and receive a notification when finished, so that I don't have to process them one by one.
>
> Acceptance Criteria:
> - Given a selection of multiple PDF files/images, when submitted to Batch OCR, then a queued job is created in the background queue.
> - Given background batch execution, when the user navigates away or closes the app, then processing continues on the cloud serverless pipeline.
> - Given batch completion, when finished, then all processed files are updated in the document library and a summary push notification is delivered.

**Functional Requirements:**
- **FR-OCR-23:** The system shall accept batch submission of up to 100 document files / 1000 pages per batch job, resulting in a managed background queue.
- **FR-OCR-24:** The system shall process batch files asynchronously via serverless queue workers (AWS SQS + Lambda / ECS), resulting in parallelized page OCR without client device battery/memory strain.
- **FR-OCR-25:** The system shall provide a Job Monitor UI displaying batch progress (% complete, pages processed, estimated time remaining), given active background batch jobs.

**Flow:** User selects files -> Configures global language/export options -> Taps "Run Batch OCR" -> Job added to queue -> Client receives background Job ID -> Serverless workers process pages concurrently -> Notification sent -> Library updated.

**Inputs:** Array of document file references; batch OCR settings (language, target format).

**Outputs:** Batch completion status; array of generated searchable PDFs / text files.

**Permissions:** Pro tier feature.

**Acceptance Tests:** Verify batch of 20 PDFs processes asynchronously; verify background progress updates correctly in Job Monitor; verify completion notification fires.

**Traces to:** BRD-02, BRD-05.

---

## 5.8 Feature: Multi-Format OCR Output Generator (JSON/hOCR/ALTO/Text)

**Purpose:** Export OCR results into industry-standard structured data formats (JSON, hOCR HTML, ALTO XML, Plain Text, Searchable PDF) to support developer integration, digital archiving, and interoperability with external academic and business software.

**Business Value:** Providing standard machine-readable formats (hOCR/ALTO/JSON) enables integration into institutional repositories, enterprise search engines, and custom workflows — establishing OneConvert as an enterprise-grade platform (BRD-07).

**User Story:**
> **US-OCR-08:** As a **software developer integrating OneConvert into a digital library**, I want OCR results exported in hOCR or JSON format with exact word coordinates, so that our search engine can index and highlight words in our custom web viewer.
>
> Acceptance Criteria:
> - Given an OCR completion result, when the user selects export format (JSON, hOCR, ALTO, TXT), then a valid, schema-compliant file is produced.
> - Given hOCR output export, when opened in a browser, then HTML contains semantic ocr_page, ocr_carea, ocr_line, and box attributes per specification.

**Functional Requirements:**
- **FR-OCR-26:** The system shall generate structured JSON output containing complete page geometry, paragraph hierarchies, word bounding boxes [x0, y0, x1, y1], character confidence scores, and language tags.
- **FR-OCR-27:** The system shall generate standard hOCR 1.2 compliant HTML output containing embedded microdata for page layout and text positioning.
- **FR-OCR-28:** The system shall generate ALTO XML (Analyzed Layout and Text Object) 4.0 compliant output for institutional archival workflows.

**Permissions:** Student tier (TXT, Searchable PDF); Pro tier (JSON, hOCR, ALTO XML).

**Acceptance Tests:** Verify JSON output validates against OneConvert OCR JSON Schema; verify hOCR output parses with standard hOCR parsers.

**Traces to:** BRD-02, BRD-05, BRD-07.

---

## 5.9 Performance Requirements (Domain NFR Addendum)

**Functional Requirements:**
- **FR-OCR-29:** The system shall complete on-device single-page English OCR within 2.5 seconds on a mid-range mobile device.
- **FR-OCR-30:** The system shall complete cloud single-page multi-language OCR within 1.5 seconds server processing time (excluding network transmission).
- **FR-OCR-31:** The system shall maintain an OCR character accuracy rate of >= 98% on clean 300 DPI printed text, and >= 90% on average mobile camera document captures.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 5.10 Offline Support (Domain NFR Addendum)

**Functional Requirements:**
- **FR-OCR-32:** The system shall support basic on-device English/Latin OCR while completely offline, given local model files are initialized.
- **FR-OCR-33:** The system shall queue cloud multi-language and batch OCR requests locally when offline, automatically resuming processing when network connectivity is restored.

**Traces to:** BRD-06.

---

## 5.11 Chapter Summary and Traceability Check

| Feature | Priority | FRs | BRD Trace |
|---|---|---|---|
| Multi-Language On-Device & Cloud OCR | Must (MVP) | FR-OCR-01 to 04 | BRD-01, BRD-02, BRD-04, BRD-06 |
| Document Layout & Structure Analysis | Must (MVP) | FR-OCR-05 to 07 | BRD-01, BRD-02, BRD-05 |
| Table Extraction & Structuring | Must (MVP) | FR-OCR-08 to 11 | BRD-02, BRD-05, BRD-07 |
| Image Pre-Processing | Must (MVP) | FR-OCR-12 to 15 | BRD-01, BRD-04, BRD-06 |
| Handwriting Recognition (ICR) | Should (Fast-follow) | FR-OCR-16 to 18 | BRD-02, BRD-05 |
| OCR Confidence Scoring & Highlighting | Must (MVP) | FR-OCR-19 to 22 | BRD-01, BRD-02 |
| Batch OCR Processing | Should (Fast-follow) | FR-OCR-23 to 25 | BRD-02, BRD-05 |
| Multi-Format Output Generator | Must (MVP) | FR-OCR-26 to 28 | BRD-02, BRD-05, BRD-07 |
| Performance Requirements (NFR) | Must (MVP) | FR-OCR-29 to 31 | BRD-01, BRD-04, BRD-06 |
| Offline Support (NFR) | Must (MVP) | FR-OCR-32 to 33 | BRD-06 |

Running feature count: **44 / 92** specified (10 Ch 2 + 10 Ch 3 + 16 Ch 4 + 8 Ch 5).

---
*End of Volume 2, Chapter 5. Next: Volume 2, Chapter 6 — Office Engine Features.*
