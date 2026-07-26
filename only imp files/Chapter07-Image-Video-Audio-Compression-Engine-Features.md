# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 7 — Image, Video, Audio, Compression Engine Features

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 1 (Framework, BRD/PRD structure, NFR baseline, prioritization rules), Chapter 2 (Account, Identity, Subscription — entitlement enforcement), Chapter 3 (Scanner — image intake), Chapter 4 (PDF Engine — raster PDF page export), Chapter 6 (Office Engine — embedded media asset extraction)

---

## 7.0 Chapter Scope

This chapter documents the features in the **Image, Video, Audio, and Compression Engine** PRD domains (Chapter 1, Section 1.3). While OneConvert's primary intake surface is document-centric, real-world productivity workflows frequently require media format conversions, file size reduction for strict email/portal attachment limits, audio extraction from lectures or webinars, and file archiving (ZIP/7Z/RAR).

Integrating media processing directly into OneConvert prevents users from leaving the application for third-party media utilities, creating a true "all-in-one" utility ecosystem (BRD-01, BRD-02).

Eight comprehensive features are specified in this chapter, followed by domain performance and offline NFR addenda.

| # | Feature | Domain | Priority |
|---|---|---|---|
| 1 | Multi-Format Image Converter & Resizer | Image Engine | Must (MVP) |
| 2 | Lossy & Lossless Image Compression Engine | Image Engine | Must (MVP) |
| 3 | Image Watermarking & Batch Editing Engine | Image Engine | Should (Fast-follow) |
| 4 | Audio Extraction & Multi-Format Audio Converter | Audio Engine | Should (Fast-follow) |
| 5 | Audio Compression & Bitrate Optimizer | Audio Engine | Should (Fast-follow) |
| 6 | Video Transcoder & Multi-Format Video Converter | Video Engine | Could (Backlog) |
| 7 | Video Compression & Resolution Scaler | Video Engine | Could (Backlog) |
| 8 | File Archive Manager (ZIP / 7Z / RAR Compression & Extraction) | Archive Engine | Must (MVP) |

---

## 7.1 Feature: Multi-Format Image Converter & Resizer

**Purpose:** Convert static and animated images across popular image formats (JPEG, PNG, WEBP, HEIC/HEIF, TIFF, GIF, SVG, BMP, AVIF) while providing precision resizing (pixel dimensions, percentage scale, aspect ratio locking, and DPI adjustments).

**Business Value:** Apple devices capture photos in HEIC format by default, which frequently fails upload validation on non-Apple web portals, government application forms, and university assignment portals (BRD-01, BRD-02). Providing instant HEIC-to-JPEG/PNG conversion alongside vector/raster resizing solves an immediate high-friction pain point for mobile users.

**User Story:**
> **US-MED-01:** As an **iPhone user applying for an online government ID**, I want to convert my HEIC photo to JPEG and resize it to exact 600x600 pixel dimensions, so that my upload passes the portal's strict file requirements.
>
> Acceptance Criteria:
> - Given an Apple .heic photo, when selected for conversion, then the image converts seamlessly to JPEG or PNG without requiring third-party plugins.
> - Given target pixel dimensions (e.g., 600x600 px) with aspect ratio locked, when values are adjusted, then dimensions scale proportionally without image distortion.
> - Given a vector SVG file, when converted to PNG/JPEG, then the image rasterizes smoothly at user-specified DPI (72 to 600 DPI).

**Functional Requirements:**
- **FR-MED-01:** The system shall convert between JPEG, PNG, WEBP, HEIC, HEIF, TIFF, GIF, SVG, BMP, and AVIF formats, given user selection, resulting in standard-compliant output image files.
- **FR-MED-02:** The system shall support image dimension resizing via exact pixel width/height input, percentage scale slider (10% to 500%), and predefined social/passport aspect ratio presets (1:1 Square, 4:3, 16:9, 2x2 Passport ID).
- **FR-MED-03:** The system shall preserve or strip EXIF metadata (camera model, GPS coordinates, capture date, orientation) during image conversion, given user privacy settings.
- **FR-MED-04:** The system shall rasterize vector SVG files to raster formats (PNG, JPEG, WEBP) at configurable resolutions (72, 150, 300, 600 DPI), resulting in anti-aliased output images.

**Flow:** Select image(s) -> Pick target output format (e.g., PNG -> WEBP) -> Set resize dimensions / DPI -> Choose EXIF metadata policy (Keep/Strip) -> Local WebAssembly / native OS image engine processes file -> Save to library or share.

**Inputs:** Source image file; output format selection; dimension parameters; EXIF policy.

**Outputs:** Converted image file; dimension and filesize reduction metadata.

**Business Logic:**
- **On-Device Execution:** All basic image conversions execute locally on mobile (iOS native ImageIO, Android Skia) and Flutter Web (WASM Canvas) without uploading bytes to cloud servers (BRD-06).
- **Entitlement Enforcer:** Free tier users can convert up to 10 images per batch; Student & Pro tiers support up to 100 images per batch.

**Permissions:** Available across all tiers.

**Errors:**
| Error Case | Handling |
|---|---|
| Unsupported corrupt image payload | Reject with specific message: "Corrupted image file. Format cannot be decoded." |
| Out-of-memory on ultra-high-resolution image (e.g., 100MP panorama) | Tiled memory processing degrades resolution gracefully with user notification |

**Acceptance Tests:** Verify HEIC to JPEG conversion preserves color profiles; verify 50% scaling halves pixel dimensions accurately; verify SVG to PNG rasterization at 300 DPI produces crisp text.

**Traces to:** BRD-01, BRD-02, BRD-04, BRD-06.

---
## 7.2 Feature: Lossy & Lossless Image Compression Engine

**Purpose:** Compress image file sizes (JPEG, PNG, WEBP) using intelligent lossy quantization (reducing visual artifacts while lowering byte size) or lossless structural compression (stripping unneeded metadata and optimizing Huffman tables), with target file size matching and live visual quality comparison.

**Business Value:** Website uploads, job application portals, and email services enforce strict image filesize caps (e.g., "Upload passport photo under 50 KB" or "Attach signature under 20 KB"). Users frequently struggle to hit exact KB targets manually. Automated target-size compression directly solves this daily problem for millions of users (BRD-01, BRD-02).

**User Story:**
> **US-MED-02:** As a **job applicant uploading a photo to a portal with a 50 KB limit**, I want to specify "Compress to 45 KB", so that OneConvert automatically optimizes the image quality to fit just under the cap.
>
> Acceptance Criteria:
> - Given an image file, when the user inputs a target size (e.g., "50 KB"), then the compression engine performs iterative binary-search quantization to produce an output file between 40 KB and 49 KB.
> - Given preset selections (Low / Medium / High compression), when selected, then estimated file size reduction is shown prior to execution.
> - Given a side-by-side split screen view, when dragging the comparison slider, then the original vs. compressed image preview renders in real time.

**Functional Requirements:**
- **FR-MED-05:** The system shall compress JPEG, PNG, and WEBP images using lossy quantization (mozjpeg / pngquant / cwebp algorithms) with user-selected quality percentages (1% to 100%).
- **FR-MED-06:** The system shall provide an Target File Size Mode (e.g., user inputs target size in KB or MB), given compression configuration, resulting in automatic parameter search that delivers an output within 5% below the specified target size.
- **FR-MED-07:** The system shall provide a Lossless Compression mode that strips EXIF, ICC profiles, and optimizes color palettes without losing a single pixel of visual information.
- **FR-MED-08:** The system shall display a real-time side-by-side slider comparison UI comparing original and compressed images at up to 400% zoom.

**Flow:** Select image -> Choose Compression Mode (Preset / Quality % / Target KB size) -> Live preview updates with estimated size -> User confirms -> Engine compresses image locally -> Output saved.

**Inputs:** Source image file; compression mode & parameters; target file size in KB/MB.

**Outputs:** Compressed image asset; byte reduction report (% saved).

**Permissions:** Available across all tiers.

**Acceptance Tests:** Verify 5MB JPEG compresses to < 500KB in High preset; verify Target KB mode (target 50 KB) outputs file between 45 KB and 49.9 KB; verify Lossless mode retains bit-for-bit pixel equality.

**Traces to:** BRD-01, BRD-02, BRD-06.

---

## 7.3 Feature: Image Watermarking & Batch Editing Engine

**Priority:** Should (Fast-follow)

**Purpose:** Apply batch edits to multiple images simultaneously — including text/logo watermarking, crop/rotate operations, color filters (Greyscale, Vintage, High Contrast), and EXIF metadata stripping — in a single continuous pipeline.

**Business Value:** Photographers, real estate agents, and e-commerce sellers need to watermark and resize entire photo shoots before uploading to listing sites (BRD-02, BRD-07). Batch image editing turns OneConvert into a valuable professional workflows asset.

**User Story:**
> **US-MED-03:** As an **e-commerce seller uploading 30 product photos**, I want to batch add my store logo watermark to the bottom-right corner of all photos and resize them to 1000x1000 px, so that I don't have to edit 30 photos individually.
>
> Acceptance Criteria:
> - Given a batch selection of 30 images, when a text/image watermark is configured, then the watermark is applied to all 30 images at identical relative scale and opacity.
> - Given batch crop/resize parameters, when executed, then all images are transformed and exported to a designated folder or ZIP file.

**Functional Requirements:**
- **FR-MED-09:** The system shall support batch application of text and image/logo watermarks with configurable position (9-point anchor grid), scale, rotation, and opacity (0% to 100%).
- **FR-MED-10:** The system shall support batch transformation actions: Batch Crop, Batch Rotate (90/180/270 deg), Batch Color Filter application, and Batch EXIF stripping across up to 100 images per session.

**Permissions:** Student & Pro tier feature.

**Acceptance Tests:** Verify 20 images receive watermark in exact bottom-right position; verify batch metadata removal strips GPS coordinates from all output photos.

**Traces to:** BRD-02, BRD-05.

---

## 7.4 Feature: Audio Extraction & Multi-Format Audio Converter

**Priority:** Should (Fast-follow)

**Purpose:** Extract audio tracks from video files (MP4, MOV, AVI) and convert standalone audio files across formats (MP3, WAV, AAC, M4A, FLAC, OGG), with metadata tag editing (Artist, Album, Title, Cover Art).

**Business Value:** Students recording video lectures or webinars frequently want to extract just the audio track as an MP3 to listen on the go, saving device storage space (BRD-01, BRD-02). Audio format conversion also serves podcasters and content creators.

**User Story:**
> **US-MED-04:** As a **student who recorded a 1-hour video lecture on my phone**, I want to extract the audio as a compact MP3 file, so that I can listen to the lecture while commuting without keeping the heavy video file on my phone.
>
> Acceptance Criteria:
> - Given a video file (.mp4, .mov), when "Extract Audio" is selected, then a standalone .mp3 or .m4a file is generated containing the complete audio stream.
> - Given an uncompressed .wav audio recording, when converted to .mp3, then the user can choose the target audio bitrate (64 kbps, 128 kbps, 192 kbps, 320 kbps).
> - Given ID3 audio metadata tags, when edited, then Title, Artist, Album, and Cover Art are embedded into the output audio file.

**Functional Requirements:**
- **FR-MED-11:** The system shall extract audio streams from MP4, MOV, AVI, MKV, and WEBM video files without re-encoding when demuxing is possible, or re-encoding to target audio formats (MP3, AAC, M4A, WAV, FLAC, OGG).
- **FR-MED-12:** The system shall convert between audio formats (MP3, WAV, AAC, M4A, FLAC, OGG, WMA) with configurable sample rates (22.05 kHz, 44.1 kHz, 48 kHz) and bitrates (64 kbps to 320 kbps VBR/CBR).
- **FR-MED-13:** The system shall provide an ID3 Tag & Cover Art Editor for audio files, allowing modification of track title, artist, album, track number, genre, and embedded album cover image.

**Flow:** Select Video/Audio file -> Pick target format (e.g., MP4 -> MP3) -> Set Bitrate / Quality -> Edit ID3 Tags -> Audio Engine (FFmpeg / WebCodecs) processes stream -> Output saved.

**Inputs:** Source video or audio file; target audio format & bitrate; ID3 metadata.

**Outputs:** Converted audio asset with embedded ID3 tags.

**Permissions:** Student & Pro tier feature.

**Acceptance Tests:** Verify 10-minute MP4 extracts to playable MP3; verify WAV to MP3 conversion at 128 kbps reduces filesize by > 80%; verify ID3 tag edits persist when opened in media players.

**Traces to:** BRD-01, BRD-02, BRD-05.

---

## 7.5 Feature: Audio Compression & Bitrate Optimizer

**Priority:** Should (Fast-follow)

**Purpose:** Reduce the file size of voice recordings, podcasts, and audio files by optimizing bitrate, sample rate, and channels (stereo to mono conversion for voice), tailored for voice notes and lecture recordings.

**Business Value:** Voice notes and lecture audio files recorded at high sample rates waste gigabytes of storage. Optimizing speech audio to 64 kbps mono shrinks files by up to 90% with zero loss in speech intelligibility (BRD-01).

**User Story:**
> **US-MED-05:** As a **user with a 500 MB WAV voice recording**, I want to compress it to a speech-optimized MP3 file, so that it takes up under 30 MB while keeping the spoken words completely clear.
>
> Acceptance Criteria:
> - Given a speech/voice recording, when "Voice Optimize" mode is selected, then stereo audio is downmixed to mono and sample rate set to 32 kHz / 64 kbps, achieving maximum compression for voice.
> - Given an audio file, when compressed, then estimated file size and duration are displayed accurately.

**Functional Requirements:**
- **FR-MED-14:** The system shall provide specialized Audio Compression Presets: Voice/Speech Optimized (64 kbps Mono), Balanced Music (192 kbps Stereo), High Quality Archival (256 kbps Stereo), and Custom Bitrate Slider.
- **FR-MED-15:** The system shall support stereo-to-mono downmixing and sample rate conversion (8 kHz to 48 kHz).

**Permissions:** Student & Pro tier feature.

**Acceptance Tests:** Verify 100 MB WAV voice recording compresses to < 10 MB MP3 in Voice mode with clear speech audio.

**Traces to:** BRD-01, BRD-02.

---
## 7.6 Feature: Video Transcoder & Multi-Format Video Converter

**Priority:** Could (Backlog)

**Purpose:** Convert video files across container formats (MP4, MOV, AVI, MKV, WEBM, 3GP) and video codecs (H.264/AVC, H.265/HEVC, VP9, AV1) to ensure playback compatibility across hardware devices and web browsers.

**Business Value:** Mobile devices capture video in proprietary or high-efficiency codecs (e.g., iPhone H.265 MOV files) that fail to play on older Windows PCs, web browsers, or media presentation tools (BRD-02, BRD-07). Video transcoding ensures universal playback compatibility.

**User Story:**
> **US-MED-06:** As a **user with an iPhone MOV video**, I want to convert it to a standard H.264 MP4 file, so that it plays on any Windows PC or web presentation without codec errors.
>
> Acceptance Criteria:
> - Given an .mov or .mkv file, when converted to MP4 (H.264), then the output video plays universally across web browsers and media players.
> - Given a video conversion job, when processing, then GPU hardware acceleration (NVENC, VideoToolbox, MediaCodec) is utilized when available.

**Functional Requirements:**
- **FR-MED-16:** The system shall convert video container formats between MP4, MOV, AVI, MKV, WEBM, and 3GP, given user selection.
- **FR-MED-17:** The system shall support video codec transcode targets: H.264 (AVC), H.265 (HEVC), VP9, and AV1, with configurable CRF (Constant Rate Factor) quality parameters (CRF 18 to 28).
- **FR-MED-18:** The system shall utilize platform hardware acceleration APIs (Apple VideoToolbox, Android MediaCodec, WebCodecs) for local device video transcoding.

**Flow:** Select Video file -> Select Output Container (MP4/WEBM/MKV) & Codec (H.264/HEVC) -> Set Quality Preset -> Submit Transcode Job (Local hardware acceleration or Cloud Serverless worker) -> Progress bar -> Output video ready.

**Inputs:** Source video file; target container format & video codec parameters.

**Outputs:** Transcoded video file.

**Permissions:** Pro tier feature.

**Acceptance Tests:** Verify iPhone MOV H.265 converts to MP4 H.264; verify output video plays cleanly in HTML5 video player.

**Traces to:** BRD-02, BRD-05.

---

## 7.7 Feature: Video Compression & Resolution Scaler

**Priority:** Could (Backlog)

**Purpose:** Compress large video files and adjust video resolutions (4K, 1080p, 720p, 480p, 360p) to shrink byte size for email attachments, messaging app limits (WhatsApp 64MB limit), and storage optimization.

**Business Value:** Video files are the single largest consumer of user storage and bandwidth. Providing simple "Compress for Email" or "Compress for WhatsApp" presets eliminates file transfer rejections (BRD-01, BRD-02).

**User Story:**
> **US-MED-07:** As a **user trying to email a 200 MB video clip**, I want to compress it to under 20 MB while keeping 720p resolution, so that I can send it as an email attachment.
>
> Acceptance Criteria:
> - Given a 200 MB video file, when "Email Preset (under 25 MB)" is selected, then video resolution and bitrate are scaled dynamically to output a file under 25 MB.
> - Given a 4K video file, when downscaled to 1080p or 720p, then frame resolution is reduced while preserving original aspect ratio.

**Functional Requirements:**
- **FR-MED-19:** The system shall provide Video Compression Presets: Email Attachment (< 25 MB), Messaging App (< 64 MB), 720p Web Optimized, 1080p High Quality, and Custom Bitrate/Resolution target.
- **FR-MED-20:** The system shall scale video frame resolutions (3840x2160 4K, 1920x1080 1080p, 1280x720 720p, 854x480 480p) while enforcing aspect ratio retention and letterboxing handling.

**Permissions:** Pro tier feature.

**Acceptance Tests:** Verify 200 MB video compresses to < 25 MB under Email preset; verify 4K downscales to 1080p accurately.

**Traces to:** BRD-02, BRD-05.

---

## 7.8 Feature: File Archive Manager (ZIP / 7Z / RAR Compression & Extraction)

**Purpose:** Create, extract, inspect, and password-encrypt multi-file archive packages (ZIP, 7Z, TAR, GZ) and extract compressed archives including proprietary RAR format, with multi-volume split support.

**Business Value:** Multiple documents, converted files, or image sets must be bundled into a single ZIP archive for email attachments or bulk downloading. Archive management is a core utility component that directly supports all other document export workflows (BRD-01, BRD-02, BRD-06).

**User Story:**
> **US-MED-08:** As a **student receiving a .rar file containing assignment materials**, I want to extract the files inside directly in OneConvert without installing a separate unzipper app, so that I can open and convert the documents inside.
>
> Acceptance Criteria:
> - Given a .zip, .7z, or .rar archive, when tapped, then the user can inspect the file list inside without extracting everything.
> - Given a selection of multiple files in OneConvert, when "Compress to ZIP" is selected, then a password-protected .zip file is created.
> - Given an encrypted ZIP/7Z archive, when extracted, then the user is prompted for the password and contents are unpacked cleanly.

**Functional Requirements:**
- **FR-MED-21:** The system shall extract .zip, .7z, .rar, .tar, .gz, .bz2, and .xz archives on mobile and web platforms, given archive selection.
- **FR-MED-22:** The system shall create .zip and .7z archives from selected files/folders with configurable compression levels (Store, Fast, Normal, Maximum, Ultra).
- **FR-MED-23:** The system shall support AES-256 password encryption for generated .zip and .7z archives, given user password configuration.
- **FR-MED-24:** The system shall provide an Archive Contents Inspector UI displaying file list, individual uncompressed sizes, compression ratios, and selective single-file extraction.

**Flow:** Select files/folder -> Click "Compress" -> Select archive format (ZIP / 7Z) -> Set compression level & optional AES-256 password -> Archive created locally -> Saved/Shared.

**Inputs:** Array of files/folders; archive type; compression level; optional password.

**Outputs:** Compressed archive file (.zip / .7z); extraction file tree.

**Permissions:** Available across all tiers (core storage & export infrastructure).

**Acceptance Tests:** Verify .rar file extracts all contents cleanly; verify AES-256 encrypted ZIP requires password to open in third-party tools; verify selective file extraction works from archive inspector.

**Traces to:** BRD-01, BRD-02, BRD-04, BRD-06.

---

## 7.9 Performance Requirements (Domain NFR Addendum)

**Functional Requirements:**
- **FR-MED-25:** The system shall compress a 5 MB JPEG image to < 500 KB within 1.0 second on local mobile devices.
- **FR-MED-26:** The system shall extract a 50-file 100 MB ZIP archive within 2.0 seconds locally.
- **FR-MED-27:** Audio demuxing/extraction from a 100 MB MP4 video shall complete within 3.0 seconds when stream copy is possible.

**Traces to:** BRD-01, BRD-04, BRD-06.

---

## 7.10 Offline Support (Domain NFR Addendum)

**Functional Requirements:**
- **FR-MED-28:** The system shall perform all Image Conversion (7.1), Image Compression (7.2), Image Watermarking (7.3), Audio Extraction (7.4), and File Archiving (7.8) operations locally on device while completely offline.
- **FR-MED-29:** Video transcoding and heavy video compression jobs initiated offline shall utilize local hardware acceleration where available, or queue for cloud worker processing upon reconnection.

**Traces to:** BRD-06.

---

## 7.11 Chapter Summary and Traceability Check

| Feature | Priority | FRs | BRD Trace |
|---|---|---|---|
| Multi-Format Image Converter & Resizer | Must (MVP) | FR-MED-01 to 04 | BRD-01, BRD-02, BRD-04, BRD-06 |
| Lossy & Lossless Image Compression | Must (MVP) | FR-MED-05 to 08 | BRD-01, BRD-02, BRD-06 |
| Image Watermarking & Batch Editing | Should (Fast-follow) | FR-MED-09 to 10 | BRD-02, BRD-05 |
| Audio Extraction & Audio Converter | Should (Fast-follow) | FR-MED-11 to 13 | BRD-01, BRD-02, BRD-05 |
| Audio Compression & Bitrate Optimizer | Should (Fast-follow) | FR-MED-14 to 15 | BRD-01, BRD-02 |
| Video Transcoder & Video Converter | Could (Backlog) | FR-MED-16 to 18 | BRD-02, BRD-05 |
| Video Compression & Resolution Scaler | Could (Backlog) | FR-MED-19 to 20 | BRD-02, BRD-05 |
| File Archive Manager (ZIP/7Z/RAR) | Must (MVP) | FR-MED-21 to 24 | BRD-01, BRD-02, BRD-04, BRD-06 |
| Performance Requirements (NFR) | Must (MVP) | FR-MED-25 to 27 | BRD-01, BRD-04, BRD-06 |
| Offline Support (NFR) | Must (MVP) | FR-MED-28 to 29 | BRD-06 |

Running feature count: **60 / 92** specified (10 Ch 2 + 10 Ch 3 + 16 Ch 4 + 8 Ch 5 + 8 Ch 6 + 8 Ch 7).

---
*End of Volume 2, Chapter 7. Next: Volume 2, Chapter 8 — Cloud, Sync, Search & Organization Features.*
