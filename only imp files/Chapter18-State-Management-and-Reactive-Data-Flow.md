# OneConvert — Engineering & Business Handbook
## Volume 4: Flutter Architecture
## Chapter 18 — State Management & Reactive Data Flow (Riverpod 2.x)

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 17 (Clean Architecture Layers)

---

## 18.0 Scope & State Management Paradigm

OneConvert uses **Flutter Riverpod 2.x** with @riverpod code generation as its official, app-wide state management solution.

Riverpod provides compile-safe dependency injection, reactive state propagation, seamless asynchronous handling via AsyncValue, and zero BuildContext dependency for business logic.

---

## 18.1 Provider Types & Usage Matrix

| Provider Type | Annotation | Purpose | Example |
|---|---|---|---|
| **Provider** | @riverpod | Immutable dependency / service injection | pdfEngineClientProvider |
| **Notifier** | @riverpod | Synchronous state controller | scannerFilterControllerProvider |
| **AsyncNotifier** | @riverpod | Asynchronous state controller with loading/error handling | documentLibraryNotifierProvider |
| **StreamNotifier** | @riverpod | Real-time event stream controller | syncStatusStreamNotifierProvider |

---

## 18.2 Scanner State Management Example

Example implementation pattern for Scanner Session state management:

`dart
// domain/entities/scan_page.dart
@freezed
class ScanPage with _ {
  const factory ScanPage({
    required String id,
    required String localImagePath,
    required ImageFilterMode filter,
    required int rotation,
    required PolygonCorners corners,
  }) = _ScanPage;
}

// presentation/controllers/scanner_session_controller.dart
@riverpod
class ScannerSessionController extends _ {
  @override
  ScannerSessionState build() {
    return const ScannerSessionState(pages: [], isCapturing: false);
  }

  void addPage(ScanPage page) {
    state = state.copyWith(pages: [...state.pages, page]);
  }

  void updateFilter(int index, ImageFilterMode filter) {
    final updatedPages = [...state.pages];
    updatedPages[index] = updatedPages[index].copyWith(filter: filter);
    state = state.copyWith(pages: updatedPages);
  }

  void rotatePage(int index) {
    final updatedPages = [...state.pages];
    final currentRot = updatedPages[index].rotation;
    updatedPages[index] = updatedPages[index].copyWith(rotation: (currentRot + 90) % 360);
    state = state.copyWith(pages: updatedPages);
  }
}
`

---

## 18.3 AsyncValue UI Handling Pattern

All UI screens consume asynchronous state via Riverpod .when() pattern:

`dart
Widget build(BuildContext context, WidgetRef ref) {
  final documentState = ref.watch(documentLibraryNotifierProvider);

  return documentState.when(
    data: (documents) => DocumentListView(documents: documents),
    loading: () => const Center(child: CircularProgressIndicator()),
    error: (err, stack) => ErrorDisplayView(error: err, onRetry: () => ref.invalidate(documentLibraryNotifierProvider)),
  );
}
`

---
*End of Volume 4, Chapter 18. Next: Chapter 19 — Routing & Deep Linking with GoRouter.*
