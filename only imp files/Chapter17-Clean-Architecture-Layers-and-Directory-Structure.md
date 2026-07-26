# OneConvert — Engineering & Business Handbook
## Volume 4: Flutter Architecture
## Chapter 17 — Clean Architecture Layers & Feature-First Directory Structure

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Volume 1 (Strategy), Volume 2 (Product Requirements — 92 Features), Volume 3 (UI & Design Tokens)

---

## 17.0 Scope & Architectural Philosophy

This volume defines the **Flutter Application Architecture** for OneConvert across Android, iOS, and Flutter Web from a single codebase (**BRD-04**).

The architecture adheres strictly to **Feature-First Clean Architecture** principles, enforcing separation of concerns into four isolated layers:
1. **Presentation Layer:** Widgets, Screens, Riverpod Controllers/Notifiers, UI Design Tokens (Volume 3).
2. **Domain Layer:** Business Entities, Value Objects, Use Cases (Interactors), and Repository Interfaces.
3. **Data Layer:** Repository Implementations, Data Sources (Remote AWS APIs & Local Isar/SQLite DBs), DTO Mappers.
4. **Engine Abstraction Layer (Platform Abstraction Layer - PAL):** Platform-agnostic interfaces delegating to native mobile plugins (C++/MethodChannels) or Web APIs (WebAssembly/WebRTC).

---

## 17.1 Feature-First Codebase Layout

The project root lib/ follows a feature-first structure where each domain (Scanner, PDF, OCR, Office, Media, Sync, Account) owns its presentation, domain, and data layers:

`
lib/
├── app/
│   ├── app.dart                   # Root MaterialApp / GoRouter config
│   ├── theme/                     # Design Tokens & Theme Engine (Vol 3)
│   └── router/                    # GoRouter route definitions & guards
├── core/
│   ├── constants/                 # App-wide constants & API routes
│   ├── errors/                    # Failure & Exception taxonomy
│   ├── platform/                  # Platform Abstraction Layer (PAL) interfaces
│   ├── utils/                     # Formatters, Logger, Device info
│   └── widgets/                   # Shared UI Component Library (Vol 3)
└── features/
    ├── account_identity/          # Feature 2.1 - 2.10
    │   ├── data/                  # Auth Data Sources, Cognito DTOs
    │   ├── domain/                # User Entity, Auth UseCases
    │   └── presentation/          # Login, Profile, Subscription Screens
    ├── scanner/                   # Feature 3.1 - 3.10
    │   ├── data/                  # Camera Data Source, Native Edge Detection Channel
    │   ├── domain/                # ScanSession Entity, EdgeDetect UseCase
    │   └── presentation/          # CameraViewfinder, ReviewScreen, FilterDrawer
    ├── pdf_engine/                # Feature 4.1 - 4.16
    ├── ocr_engine/                # Feature 5.1 - 5.10
    ├── office_engine/             # Feature 6.1 - 6.10
    ├── media_engine/              # Feature 7.1 - 7.10
    └── cloud_sync/                # Feature 8.1 - 8.10
`

---

## 17.2 Layer Dependency Rules

Dependencies strictly flow **inward** toward the Domain layer:

`
[ Presentation Layer ] ───> [ Domain Layer ] <─── [ Data Layer ]
         │                        ▲                     │
         └────────────────────────┼─────────────────────┘
                       (Dependency Injection)
`

- **Domain Layer** has **ZERO** dependencies on Flutter UI, Data Sources, or external packages. It contains pure Dart entities and abstract repository contracts.
- **Data Layer** implements Domain repository contracts and handles raw JSON serialization, HTTP requests, and local DB operations.
- **Presentation Layer** listens to Riverpod AsyncNotifier providers and renders Volume 3 UI components.

---
*End of Volume 4, Chapter 17. Next: Chapter 18 — State Management with Riverpod 2.x.*
