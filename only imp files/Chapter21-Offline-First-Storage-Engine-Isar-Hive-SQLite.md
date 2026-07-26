# OneConvert — Engineering & Business Handbook
## Volume 4: Flutter Architecture
## Chapter 21 — Offline-First Storage Engine (Isar / Hive / SQLite)

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 8 (Cloud & Organization), BRD-06 (Offline-First)

---

## 21.0 Scope & Local Persistence Strategy

In compliance with **BRD-06**, OneConvert operates fully offline for local document capture, PDF viewing, editing, annotation, and file management.

The local storage engine uses a 3-tier persistence model:
1. **Document Metadata & Hierarchy Store (Isar / SQLite):** High-speed indexed local database storing folders, document records, tags, OCR text indices, and sync queues.
2. **Encrypted Key-Value Store (Flutter Secure Storage):** Hardware-backed (iOS Keychain / Android Keystore) encrypted vault for OAuth tokens, user session keys, and encryption certificates.
3. **Local Asset File Cache (Application Documents Directory):** Sandboxed disk storage for scanned images, working PDF files, and rendering vector tiles.

---

## 21.1 Local Database Schema (Isar Spec)

`dart
@collection
class DocumentCollection {
  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String uuid;

  late String title;
  late String originalFormat;
  late int pageCount;
  late int fileSizeBytes;
  late DateTime createdAt;
  late DateTime updatedAt;

  late String localFilePath;
  String? cloudS3Key;
  
  bool isSynced = false;
  bool isDeleted = false; // Soft delete for Trash (Feature 8.6)
  
  List<String> tags = [];
  String? parentFolderUuid;
}
`

---
*End of Volume 4, Chapter 21. Next: Chapter 22 — Platform Abstraction Layer (PAL).*
