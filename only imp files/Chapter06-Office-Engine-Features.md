# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 6 — Office Engine Features

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 1 (Framework, BRD/PRD structure, NFR baseline, prioritization rules), Chapter 2 (Account, Identity, Subscription — entitlement enforcement), Chapter 3 (Scanner — document acquisition), Chapter 4 (PDF Engine — PDF rendering & export interchange), Chapter 5 (OCR Engine — text extraction from image-based Office embeds)

---

## 6.0 Chapter Scope

This chapter documents the features in the **Office Engine** PRD domain (Chapter 1, Section 1.3). The Office Engine handles ingestion, conversion, generation, formatting preservation, rendering, and batch processing of Microsoft Office and open-standard office document formats (.docx, .doc, .xlsx, .xls, .pptx, .ppt, .odt, .ods, .odp, .csv).

Office documents represent the dominant format for business, academic, and administrative work across all target personas (BRD-01, BRD-02, BRD-07). The Office Engine operates in close coordination with the PDF Engine (Chapter 4) and OCR Engine (Chapter 5) to enable multi-directional document conversion pipelines while maintaining font, layout, and table fidelity.

Eight comprehensive features are specified in this chapter, followed by domain performance and offline NFR addenda.

| # | Feature | Domain | Priority |
|---|---|---|---|
| 1 | DOCX / DOC to PDF Conversion | Office Engine | Must (MVP) |
| 2 | XLSX / XLS to PDF & CSV Conversion | Office Engine | Must (MVP) |
| 3 | PPTX / PPT to PDF Conversion | Office Engine | Must (MVP) |
| 4 | In-App Office Document Rendering & Preview | Office Engine | Must (MVP) |
| 5 | Office Template Engine & Automated Document Generation | Office Engine | Should (Fast-follow) |
| 6 | Font Embedding & Typography Preservation Pipeline | Office Engine | Must (MVP) |
| 7 | Batch Office Conversion Queue | Office Engine | Should (Fast-follow) |
| 8 | Office Document Metadata & Security Property Management | Office Engine | Should (Fast-follow) |

---

## 6.1 Feature: DOCX / DOC to PDF Conversion

**Purpose:** Convert Microsoft Word documents (.docx, .doc) and OpenDocument text (.odt) into pixel-perfect PDF files, preserving page geometry, custom fonts, embedded images, tables, headers/footers, and hyperlinked table of contents.

**Business Value:** Word-to-PDF conversion is one of the top 3 most executed operations in productivity applications globally. Students converting assignments for portal submission and freelancers converting invoices/proposals for clients rely heavily on this capability (BRD-01, BRD-02). Reliable, high-fidelity conversion without layout drift is a major retention and subscription conversion driver.

**User Story:**
> **US-OFF-01:** As a **student submitting a term paper written in Microsoft Word**, I want to convert my .docx file into a clean PDF, so that the formatting, fonts, and page numbers stay identical across all devices when my professor opens it.
>
> Acceptance Criteria:
> - Given a multi-page .docx file with custom headings, tables, and images, when converted to PDF, then layout alignment, line breaks, and page breaks match the original Word document exactly.
> - Given a legacy .doc (Word 97-2003) file, when selected for conversion, then the file is ingested and converted without requiring the user to save it as .docx first.
> - Given hyperlink references within the document (e.g., Table of Contents or web URLs), when converted, then interactive links remain clickable in the output PDF.

**Functional Requirements:**
- **FR-OFF-01:** The system shall convert .docx, .doc, and .odt files into standards-compliant PDF/A or PDF 1.7 documents, given a local or cloud source file, resulting in an output PDF matching the original layout geometry.
- **FR-OFF-02:** The system shall preserve embedded document elements — including inline and floating images, shapes, smart-art, headers, footers, page numbering, footnotes, and tables — during conversion, resulting in zero element omission in the converted PDF.
- **FR-OFF-03:** The system shall map non-standard fonts to metrically equivalent web/system fonts or embed missing TrueType/OpenType font glyphs during serverless conversion, given custom font usage in the source file, resulting in layout stability without character overlap or text reflow.
- **FR-OFF-04:** The system shall convert internal document hyperlinks (bookmarks, Table of Contents) and external web links into interactive PDF annotations, given hyperlinked text in the source document, resulting in clickable PDF links.

**Flow:** User selects Word file -> Format & size validation -> If file <= 10MB: local LibreOffice/WASM converter (or serverless microservice) -> If file > 10MB or contains legacy .doc: submit async job to AWS Lambda conversion worker -> Font matching pipeline -> PDF generation -> PDF preview & local save.

**Inputs:** Source Office document file (.docx/.doc/.odt); target PDF quality preset (Standard / PDF/A Archival / Print High-Res).

**Outputs:** Converted PDF file in local library; conversion manifest (page count, embedded font log, conversion duration).

**Business Logic:**
- **Conversion Engine Architecture:** Uses headless LibreOffice / PDFTron containerized cluster on AWS Lambda / Fargate for serverless conversions (Volume 5/8).
- **Entitlement Enforcer:** Free tier users receive 10 Word-to-PDF conversions per month; Student & Pro tiers receive unlimited conversions per Section 2.9.

**Permissions:** Available to all tiers; volume limits enforced per tier.

**Errors:**
| Error Case | Handling |
|---|---|
| Corrupt or password-protected Word file | Detect protection before processing; prompt user for document password or notify of file corruption |
| Source file uses rare font not installed on converter node | Apply metric font substitution (e.g., Liberation Serif for Times New Roman) and record warning in log |

**Limitations:**
- Word macros (.docm) are stripped during conversion for security; macro execution is not supported.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| Document contains tracked changes / comments | System prompts user: "Include tracked changes in output PDF or convert clean document?" | Major |
| Right-to-left (RTL) Arabic/Hebrew text mixed with LTR English | Bi-directional layout engine formats text direction accurately per paragraph | Major |

**Acceptance Tests:** Verify layout parity on 20-page Word document with tables & images; verify legacy .doc converts cleanly; verify hyperlinked TOC functions in output PDF.

**Traces to:** BRD-01, BRD-02, BRD-05.

---
## 6.2 Feature: XLSX / XLS to PDF & CSV Conversion

**Purpose:** Convert Microsoft Excel workbooks (.xlsx, .xls) and OpenDocument spreadsheets (.ods) into clean, multi-page PDFs or flat CSV data files — with intelligent page-break management, print-area fitting, gridline toggles, and formula calculation pre-rendering.

**Business Value:** Financial reports, budgets, inventory sheets, and invoices created in Excel need to be converted to fixed PDF documents for distribution or flat CSV files for database ingestion (BRD-02, BRD-07). Without intelligent auto-fitting, Excel-to-PDF conversions frequently clip columns horizontally across separate pages, ruining readability. Auto-fit solving is a major user delighter.

**User Story:**
> **US-OFF-02:** As an **accountant converting a wide financial spreadsheet to PDF**, I want all columns to fit on a single page width automatically, so that my balance sheet is not split across multiple horizontal pages.
>
> Acceptance Criteria:
> - Given a multi-column Excel spreadsheet, when converted to PDF with "Fit to Page Width" enabled, then all columns scale dynamically to fit within portrait/landscape page margins.
> - Given an Excel workbook with multiple worksheet tabs, when converted, then the user can choose to convert the active sheet, selected sheets, or the entire workbook.
> - Given an .xlsx file, when "Export to CSV" is selected, then active sheet data is exported as clean UTF-8 comma-separated text.

**Functional Requirements:**
- **FR-OFF-05:** The system shall convert .xlsx, .xls, .ods, and .csv files into formatted PDF documents, given user conversion initiation, resulting in crisp vector table rendering.
- **FR-OFF-06:** The system shall provide print-layout scaling options — Fit All Columns on One Page, Fit Sheet on One Page, Actual Size, or Custom Scale % — given spreadsheet conversion, resulting in zero unintended horizontal page splitting.
- **FR-OFF-07:** The system shall evaluate dynamic formula values (SUM, VLOOKUP, IF, etc.) and pre-render cell calculation results into static PDF text, given active formulas in the source workbook.
- **FR-OFF-08:** The system shall allow users to export individual worksheet tabs to CSV or TSV format with custom encoding (UTF-8 / ASCII) and delimiter options (comma, semicolon, tab).

**Flow:** User selects Excel file -> Pre-conversion settings preview (Select sheets, Orientation, Scaling mode) -> System evaluates formulas -> Layout engine calculates page splits -> Conversion to PDF/CSV -> File saved in document library.

**Inputs:** Source Excel file (.xlsx/.xls/.ods); target sheet selection (Active sheet / All sheets); scaling mode; orientation (Portrait/Landscape).

**Outputs:** Formatted PDF file or CSV file; sheet conversion log.

**Permissions:** Student & Pro tier feature.

**Errors:**
| Error Case | Handling |
|---|---|
| Formula error (#REF!, #DIV/0!) present in source sheet | Render error string as displayed in Excel; highlight in pre-conversion warning dialog |
| Extremely wide spreadsheet (100+ columns) | Warn user: "High column count detected. Auto-fit may reduce text size. Consider Landscape orientation or splitting columns." |

**Acceptance Tests:** Verify 15-column Excel sheet scales to fit 1 page width in Landscape mode; verify multi-tab workbook converts to continuous PDF; verify formula evaluation output matches Excel rendered values.

**Traces to:** BRD-01, BRD-02, BRD-05.

---

## 6.3 Feature: PPTX / PPT to PDF Conversion

**Purpose:** Convert Microsoft PowerPoint presentations (.pptx, .ppt) and OpenDocument presentations (.odp) into high-resolution PDF slides or handout handouts (1, 2, 4, or 6 slides per page with speaker notes), maintaining visual presentation fidelity.

**Business Value:** Students and professionals constantly share lecture slides, pitch decks, and training materials as PDFs (BRD-01, BRD-02). Providing handout conversion modes (multiple slides per page with note space) directly targets the student persona's printing and note-taking habits.

**User Story:**
> **US-OFF-03:** As a **student studying for exams**, I want to convert a 60-slide PowerPoint presentation into a PDF handout with 4 slides per page and lines for notes, so that I can print it efficiently and write notes beside each slide.
>
> Acceptance Criteria:
> - Given a .pptx presentation, when converted in Slide mode, then each slide converts to a full PDF page at native aspect ratio (16:9 or 4:3).
> - Given Handout mode selection (2, 4, or 6 slides per page), when converted, then slides are arranged cleanly in grid layout with optional rule lines for handwritten notes.
> - Given speaker notes attached to slides, when "Include Speaker Notes" is checked, then each slide is rendered alongside its corresponding speaker notes.

**Functional Requirements:**
- **FR-OFF-09:** The system shall convert .pptx, .ppt, and .odp files into presentation PDFs, given slide conversion initiation, preserving vector shapes, slide backgrounds, custom typography, and embedded images.
- **FR-OFF-10:** The system shall support Handout Layout Modes (1 slide/page, 2 slides/page, 3 slides/page with notes, 4 slides grid, 6 slides grid, 9 slides grid), resulting in optimized page layouts for printing and digital study.
- **FR-OFF-11:** The system shall extract and include slide speaker notes beneath or beside slide thumbnails, given speaker notes export selection.

**Flow:** Select PowerPoint file -> Choose Output Mode (Full Slides / Handout Grid / Notes Page) -> Select slide range (e.g., Slides 1-15) -> Serverless presentation renderer processes slides -> PDF generated -> Saved to library.

**Inputs:** Source presentation file (.pptx/.ppt/.odp); layout selection; slide range.

**Outputs:** High-resolution PDF document.

**Permissions:** Student & Pro tier feature.

**Acceptance Tests:** Verify 16:9 slides convert without black letterbox borders; verify 4-up handout mode formats 4 slides per page cleanly; verify speaker notes are included when option selected.

**Traces to:** BRD-01, BRD-02.

---

## 6.4 Feature: In-App Office Document Rendering & Preview

**Purpose:** Provide a fast, native in-app previewer for Word, Excel, and PowerPoint files without requiring external software installation (Microsoft Office, Google Docs), enabling instant viewing, text selection, and pre-conversion inspection.

**Business Value:** Forcing users to download files or open third-party apps just to view an Office document breaks the user experience loop (BRD-01). Seamless in-app preview keeps users engaged within OneConvert, increasing feature discovery and trial-to-paid conversion.

**User Story:**
> **US-OFF-04:** As a **user opening an attached Word file**, I want to view its contents directly inside OneConvert without installing Microsoft Word or leaving the app, so that I can read it instantly and decide whether to convert or sign it.
>
> Acceptance Criteria:
> - Given an .docx or .xlsx file tap in the document list, when selected, then an interactive document viewer opens within 2 seconds.
> - Given an open Office document in the viewer, when the user uses pinch-to-zoom or text selection, then interaction is responsive and smooth.
> - Given Flutter Web execution (BRD-04), when an Office file is selected, then an HTML5/Canvas rendered preview displays accurately in the browser.

**Functional Requirements:**
- **FR-OFF-12:** The system shall render .docx, .xlsx, and .pptx documents in an interactive in-app viewer on Android, iOS, and Flutter Web, given document selection, resulting in zero external app dependencies.
- **FR-OFF-13:** The system shall support page navigation, zoom (fit-to-width / fit-to-page / custom scale up to 400%), text searching, and text selection/copying within the Office viewer.
- **FR-OFF-14:** The system shall generate lightweight web/mobile vector cache representations (SVG/Canvas tiles) for multi-page Office documents, resulting in fast lazy-loaded page rendering.

**Flow:** Tap Office file -> Background worker generates vector tile cache for page 1-3 -> Interactive viewer renders page 1 instantly -> Remaining pages lazy-loaded on scroll.

**Inputs:** Office file path; view parameters (zoom, dark mode).

**Outputs:** Rendered vector view tiles; text layer metadata.

**Permissions:** Available to all tiers including guests (core viewing acquisition hook).

**Acceptance Tests:** Verify DOCX opens in < 2 seconds; verify pinch-zoom works up to 400%; verify text selection & copy operates cleanly.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 6.5 Feature: Office Template Engine & Automated Document Generation

**Priority:** Should (Fast-follow)

**Purpose:** Populate pre-designed Word (.docx) or Excel (.xlsx) templates with dynamic user data (JSON / Form inputs / CSV records) to automatically generate personalized invoices, certificates, contracts, receipts, and reports in batch.

**Business Value:** Freelancers, small businesses, and educational institutions spend hours creating repetitive documents (invoices, student certificates, offer letters). Automated template generation is a high-value Pro/Enterprise feature that unlocks business automation workflows (BRD-02, BRD-07).

**User Story:**
> **US-OFF-05:** As a **freelancer generating monthly client invoices**, I want to select my custom Invoice Word template and input client details via a simple form, so that OneConvert automatically generates a professional PDF invoice for me in seconds.
>
> Acceptance Criteria:
> - Given a .docx template containing placeholder tags (e.g., {{client_name}}, {{invoice_amount}}, {{date}}), when form data or JSON is provided, then placeholders are replaced with actual data values preserving original font styles.
> - Given a CSV file with 50 rows of student names, when mapped to a Certificate template, then 50 individualized PDF certificates are generated automatically in batch.
> - Given repeating table rows (e.g., invoice line items), when array data is provided, then template table rows expand dynamically.

**Functional Requirements:**
- **FR-OFF-15:** The system shall parse .docx and .xlsx template files containing Mustache/Jinja-style tags ({{variable}}, {#loop}...{/loop}), resulting in a schema of required input variables.
- **FR-OFF-16:** The system shall merge input data (JSON payload, Form field input, or CSV record array) into document template tags, resulting in generated .docx / .pdf documents with exact formatting preservation.
- **FR-OFF-17:** The system shall support dynamic table row expansion for array data (e.g., multi-item invoice lists), given array data structures.

**Flow:** Select Template -> Form UI auto-generated from template tags (or CSV uploaded) -> Input values entered -> Merge engine generates output .docx -> Converted to final PDF -> Shared/Downloaded.

**Inputs:** .docx / .xlsx template file; JSON data payload or CSV file.

**Outputs:** Individual or batch generated PDF / DOCX documents.

**Permissions:** Pro & Enterprise tier feature.

**Acceptance Tests:** Verify placeholder tags are replaced without altering font or color; verify dynamic table expansion works for 10 line items; verify batch generation of 50 records creates 50 correct PDFs.

**Traces to:** BRD-02, BRD-05, BRD-07.

---
## 6.6 Feature: Font Embedding & Typography Preservation Pipeline

**Purpose:** Manage, substitute, and embed font metrics and glyph definitions during Office-to-PDF conversions, ensuring custom fonts, regional script typography, and mathematical symbols render without character distortion, missing glyphs (box characters □), or text wrapping reflow.

**Business Value:** Typography corruption (missing fonts replaced by default fonts that alter line lengths and break page counts) is the #1 complaint in document conversion software. Guaranteeing typography fidelity protects document integrity for academic papers, legal filings, and corporate brand presentations (BRD-01, BRD-02).

**User Story:**
> **US-OFF-06:** As a **designer using a custom brand font in a PowerPoint presentation**, I want the converted PDF to embed my custom font metrics, so that text does not overflow slide boundaries when viewed on another device.
>
> Acceptance Criteria:
> - Given an Office file using embedded TrueType/OpenType fonts, when converted, then the conversion pipeline extracts and embeds subsetted font glyphs into the output PDF.
> - Given a file using a common proprietary font (e.g., Arial, Calibri, Times New Roman), when processed on Linux/Serverless containers, then metrically identical open-source font packages (e.g., Carlito, Caladea, Liberation) prevent layout reflow.
> - Given missing character glyphs in a regional script, when detected, then a fallback font chain ensures no missing glyph boxes (□) appear in output.

**Functional Requirements:**
- **FR-OFF-18:** The system shall maintain an open-source metric font substitution catalog (Carlito -> Calibri, Caladea -> Cambria, Liberation Sans -> Arial, Liberation Serif -> Times New Roman, Noto Sans -> Regional scripts), resulting in zero text reflow when proprietary Microsoft fonts are un-embedded.
- **FR-OFF-19:** The system shall extract, subset, and embed custom TrueType (.ttf) and OpenType (.otf) fonts embedded inside .docx and .pptx archives into the generated PDF file.
- **FR-OFF-20:** The system shall implement a multi-tiered fallback font resolution chain for Devanagari, Tamil, Telugu, Arabic, and CJK character sets, given unmapped glyphs, resulting in complete character rendering without missing glyph boxes.

**Flow:** Ingest Office Document -> Font Scanner inspects required fonts -> Check embedded font tables -> If embedded: extract & subset glyphs -> If un-embedded: match against Metric Substitution Catalog -> If unmapped regional script: apply Noto Fallback Chain -> Render PDF with embedded font subset.

**Inputs:** Office document XML font tables; font repository asset bundle.

**Outputs:** PDF with embedded subset fonts (PDF Type 1 / TrueType font dictionaries).

**Permissions:** Available across all conversion features (Core Engine Infrastructure).

**Acceptance Tests:** Verify Calibri-based document converts using Carlito metric replacement with 0% line-reflow delta; verify embedded custom font renders in PDF output.

**Traces to:** BRD-01, BRD-04, BRD-05.

---

## 6.7 Feature: Batch Office Conversion Queue

**Priority:** Should (Fast-follow)

**Purpose:** Allow users to select multiple Office documents across different formats (.docx, .xlsx, .pptx) and process them concurrently into PDFs in the background, with progress tracking, ZIP archive export, and cloud sync integration.

**Business Value:** Business and administrative users often need to convert entire folders of project files (specs, financial models, presentations) at once. Batch Office conversion saves massive manual effort and supports enterprise automation (BRD-02, BRD-07).

**User Story:**
> **US-OFF-07:** As an **administrative assistant with 25 Word and Excel files**, I want to select the entire folder and convert all of them to PDF in one click, so that I can package the project documentation quickly.
>
> Acceptance Criteria:
> - Given a selection of mixed Office files (e.g., 10 .docx, 10 .xlsx, 5 .pptx), when submitted to Batch Conversion, then all files are queued and processed asynchronously.
> - Given batch completion, when finished, then the user can download all converted PDFs individually or as a single compressed .zip file.

**Functional Requirements:**
- **FR-OFF-21:** The system shall accept batch conversion jobs containing up to 50 Office documents per batch, given user selection.
- **FR-OFF-22:** The system shall execute batch processing via parallel serverless container instances (AWS Lambda / ECS Task cluster), resulting in rapid total batch processing time.
- **FR-OFF-23:** The system shall provide an option to automatically package all converted batch PDFs into a single downloadable .zip archive.

**Permissions:** Student & Pro tier feature.

**Acceptance Tests:** Verify batch of 15 mixed Office files converts successfully; verify ZIP archive creation contains all output PDFs.

**Traces to:** BRD-02, BRD-05.

---

## 6.8 Feature: Office Document Metadata & Security Property Management

**Priority:** Should (Fast-follow)

**Purpose:** View, edit, or strip document metadata properties (Author, Title, Subject, Keywords, Company, Manager, Revision History, Creation Date) and inspect/apply password protection settings on Microsoft Office files.

**Business Value:** Sharing Office files externally often accidentally leaks sensitive metadata (author name, internal server paths, previous revision notes, company name). Sanitizing metadata before sharing protects user privacy and corporate security (BRD-02, BRD-07).

**User Story:**
> **US-OFF-08:** As a **freelancer sending a proposal to a prospective client**, I want to strip internal author names, revision logs, and company comments from my Word document before sending, so that private internal notes are not exposed.
>
> Acceptance Criteria:
> - Given an Office file, when Metadata Inspector is opened, then all document properties (Author, Organization, Last Modified By, Revision Count, Comments) are displayed clearly.
> - Given "Sanitize Metadata" selection, when executed, then all personal identifying information (PII) and revision history are permanently stripped from the Office XML structure.
> - Given a password-protected Office document, when opened, then the user is prompted for the decryption password before viewing or editing metadata.

**Functional Requirements:**
- **FR-OFF-24:** The system shall parse and display OpenXML metadata properties (docProps/core.xml, docProps/app.xml, docProps/custom.xml) for all supported Office formats.
- **FR-OFF-25:** The system shall sanitize and strip personal metadata fields (Author, Last Modified By, Company, Manager, Category, Tracked Changes History, Embedded Comments) upon user command, resulting in a clean, sanitized Office file.
- **FR-OFF-26:** The system shall support editing custom document property keys and values (e.g., adding Document_ID, Classification: Confidential).

**Permissions:** Pro tier feature.

**Acceptance Tests:** Verify "Sanitize Metadata" removes Author and Company fields from .docx XML; verify sanitized document retains original visual content.

**Traces to:** BRD-02, BRD-05, BRD-07.

---

## 6.9 Performance Requirements (Domain NFR Addendum)

**Functional Requirements:**
- **FR-OFF-27:** The system shall complete single-page .docx to PDF conversion within 2.0 seconds on local device / serverless container worker.
- **FR-OFF-28:** The system shall open and render the first page of any Office document in the in-app viewer within 1.8 seconds.
- **FR-OFF-29:** The system shall maintain font substitution layout drift below 1% line length variance for standard Microsoft font substitutes (Carlito, Caladea, Liberation).

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 6.10 Offline Support (Domain NFR Addendum)

**Functional Requirements:**
- **FR-OFF-30:** The system shall support local in-app viewing and basic single-page .docx to PDF conversion on mobile devices while completely offline using bundled light engines.
- **FR-OFF-31:** The system shall queue complex or large batch Office conversions locally when offline, automatically syncing and executing via cloud workers upon network restoration.

**Traces to:** BRD-06.

---

## 6.11 Chapter Summary and Traceability Check

| Feature | Priority | FRs | BRD Trace |
|---|---|---|---|
| DOCX / DOC to PDF Conversion | Must (MVP) | FR-OFF-01 to 04 | BRD-01, BRD-02, BRD-05 |
| XLSX / XLS to PDF & CSV Conversion | Must (MVP) | FR-OFF-05 to 08 | BRD-01, BRD-02, BRD-05 |
| PPTX / PPT to PDF Conversion | Must (MVP) | FR-OFF-09 to 11 | BRD-01, BRD-02 |
| In-App Office Document Rendering & Preview | Must (MVP) | FR-OFF-12 to 14 | BRD-01, BRD-04, BRD-06 |
| Office Template Engine & Auto Document Generation | Should (Fast-follow) | FR-OFF-15 to 17 | BRD-02, BRD-05, BRD-07 |
| Font Embedding & Typography Preservation Pipeline | Must (MVP) | FR-OFF-18 to 20 | BRD-01, BRD-04, BRD-05 |
| Batch Office Conversion Queue | Should (Fast-follow) | FR-OFF-21 to 23 | BRD-02, BRD-05 |
| Office Metadata & Property Management | Should (Fast-follow) | FR-OFF-24 to 26 | BRD-02, BRD-05, BRD-07 |
| Performance Requirements (NFR) | Must (MVP) | FR-OFF-27 to 29 | BRD-01, BRD-04, BRD-06 |
| Offline Support (NFR) | Must (MVP) | FR-OFF-30 to 31 | BRD-06 |

Running feature count: **52 / 92** specified (10 Ch 2 + 10 Ch 3 + 16 Ch 4 + 8 Ch 5 + 8 Ch 6).

---
*End of Volume 2, Chapter 6. Next: Volume 2, Chapter 7 — Image, Video, Audio, Compression Engine Features.*
