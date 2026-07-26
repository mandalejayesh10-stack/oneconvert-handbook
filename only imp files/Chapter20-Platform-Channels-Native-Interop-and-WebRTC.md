# OneConvert — Engineering & Business Handbook
## Volume 4: Flutter Architecture
## Chapter 20 — Platform Channels, Native Interop & WebRTC

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 3 (Scanner), Chapter 17 (Clean Architecture), BRD-04 (Cross-Platform)

---

## 20.0 Scope & Native Integration Strategy

While Flutter handles UI rendering across platforms, performance-critical hardware operations — such as camera stream capture, OpenCV C++ edge detection, iOS VisionKit integration, Android CameraX API, and browser WebRTC/WebAssembly — require direct native platform interop.

This chapter specifies the **Platform Abstraction Layer (PAL)** architecture utilizing Flutter MethodChannel, EventChannel, dart:ffi (Foreign Function Interface), and conditional Web Assembly compilation.

---

## 20.1 Platform Abstraction Layer (PAL) Architecture

`
                       ┌────────────────────────────────┐
                       │  Abstract Platform Interface   │
                       │     (e.g., IScannerPlatform)   │
                       └───────────────┬────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  Android Data Source │   │    iOS Data Source   │   │   Web Data Source    │
│  (CameraX + OpenCV)  │   │ (VisionKit + Metal)  │   │  (WebRTC + WASM C++) │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
`

---

## 20.2 Platform Channel Specifications

### 20.2.1 Scanner Channel (com.oneconvert.app/scanner)

- **detectEdges(ImageBuffer)**: Passes camera frame bytes to C++ OpenCV library via FFI (mobile) or WASM (Web), returning 4 corner coordinates [[x1,y1], [x2,y2], [x3,y3], [x4,y4]] and confidence score.
- **pplyPerspectiveWarp(ImageBuffer, Corners)**: Performs four-point homography transform on full-resolution camera asset.

`dart
abstract class IScannerPlatform {
  Future<EdgeDetectionResult> detectDocumentEdges(Uint8List frameBytes, int width, int height);
  Future<Uint8List> applyPerspectiveWarp(Uint8List imageBytes, PolygonCorners corners);
  Stream<double> get cameraStabilityStream;
}
`

---
*End of Volume 4, Chapter 20. Next: Chapter 21 — Offline-First Storage Engine.*
