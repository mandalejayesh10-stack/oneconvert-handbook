# OneConvert — Engineering & Business Handbook
## Volume 4: Flutter Architecture
## Chapter 19 — Routing, Deep Linking & Screen Navigation (GoRouter)

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 17 (Clean Architecture), Chapter 2 (Subscription & Entitlements)

---

## 19.0 Scope & Routing Strategy

Navigation in OneConvert across Android, iOS, and Flutter Web is governed by **GoRouter**. GoRouter provides declarative, URL-driven routing, nested shell navigation (for bottom navigation bars), deep linking (oneconvert:// mobile scheme & https://oneconvert.app/ web links), and automated route guards.

---

## 19.1 Route Tree & Path Taxonomy

`dart
// Route Definitions
abstract class AppRoutes {
  static const home        = '/';
  static const scanner     = '/scanner';
  static const review      = '/scanner/review';
  static const pdfEditor   = '/pdf/:id';
  static const ocrEditor   = '/ocr/:id';
  static const cloudSync   = '/cloud';
  static const login       = '/auth/login';
  static const verifyStudent = '/auth/verify-student';
  static const settings    = '/settings';
}
`

---

## 19.2 Entitlement & Auth Route Guards

GoRouter redirect handlers evaluate user authentication status (Cognito token) and subscription entitlement (Feature 2.9) before navigating:

`dart
String? authAndEntitlementGuard(BuildContext context, GoRouterState routerState) {
  final authState = ref.read(authStateProvider);
  final isProUser = authState.user?.tier == SubscriptionTier.pro;
  final isTargetingProFeature = routerState.matchedLocation.startsWith('/pdf/redact');

  if (!authState.isAuthenticated && routerState.matchedLocation != AppRoutes.login) {
    return AppRoutes.login;
  }

  if (isTargetingProFeature && !isProUser) {
    return '/upgrade-prompt?feature=redaction';
  }

  return null; // Allow navigation
}
`

---
*End of Volume 4, Chapter 19. Next: Chapter 20 — Platform Channels & Native Interop.*
