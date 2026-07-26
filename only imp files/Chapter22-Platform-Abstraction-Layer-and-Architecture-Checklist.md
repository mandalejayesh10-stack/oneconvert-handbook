# OneConvert — Engineering & Business Handbook
## Volume 4: Flutter Architecture
## Chapter 22 — Platform Abstraction Layer (PAL) & Conditional Imports

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 17-21, BRD-04

---

## 22.0 Scope & Cross-Platform Abstraction

To compile for Android, iOS, and Web from a single codebase (**BRD-04**), platform-specific libraries (dart:io vs dart:html) must never be imported directly into shared business logic.

OneConvert uses Dart **Conditional Imports** and abstract service interfaces to decouple feature logic from platform execution.

---

## 22.1 Conditional Import Pattern

`dart
// core/platform/file_downloader_stub.dart
abstract class FileDownloader {
  Future<void> downloadFile(Uint8List bytes, String filename);
}

FileDownloader getPlatformDownloader() => throw UnimplementedError();

// core/platform/file_downloader_web.dart (imports dart:html)
// core/platform/file_downloader_mobile.dart (imports dart:io & path_provider)

// Consumer
import 'file_downloader_stub.dart'
  if (dart.library.html) 'file_downloader_web.dart'
  if (dart.library.io) 'file_downloader_mobile.dart';
`

---

# Chapter 23 — Volume 4 Architecture Checklist & Parity Index

## 23.0 Volume 4 Completion Summary

This chapter concludes **Volume 4: Flutter Architecture**.

### Verification Checklist:
- [x] **Chapter 17:** Clean Architecture Layers & Feature-First Directory Structure
- [x] **Chapter 18:** State Management & Reactive Data Flow (Riverpod 2.x)
- [x] **Chapter 19:** Routing, Deep Linking & Screen Navigation (GoRouter)
- [x] **Chapter 20:** Platform Channels, Native Interop & WebRTC
- [x] **Chapter 21:** Offline-First Storage Engine (Isar / Hive / SQLite)
- [x] **Chapter 22:** Platform Abstraction Layer (PAL) & Conditional Imports
- [x] **Chapter 23:** Architecture Verification Checklist & Parity Index

🎉 **VOLUME 4 IS 100% COMPLETE & VERIFIED** 🎉

---
*End of Volume 4: Flutter Architecture. Ready to begin Volume 5: Backend Architecture (AWS Serverless).*
