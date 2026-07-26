# OneConvert — Engineering & Business Handbook
## Volume 2: Product Requirements
## Chapter 2 — Account & Identity, Subscription & Billing Features

**Document status:** Living specification
**Version:** 1.0
**Depends on:** Chapter 1 (Framework, BRD/PRD structure, NFR baseline, prioritization rules)

---

### 2.0 Chapter Scope

This chapter documents the features in the **Account & Identity** and **Subscription & Billing** PRD domains (Chapter 1, §1.3). Together these gate every other engine: no PDF/OCR/Office/Image/Cloud feature functions until identity state (anonymous vs. signed-in) and entitlement state (Free vs. Student vs. Pro) are resolved. That gating role is why this chapter comes first among the domain chapters, even though Scanner is the more visible feature for users.

Ten features are specified below. Every feature carries a priority tag per §1.8 and traces to at least one BRD row from Chapter 1 §1.2.

| # | Feature | Domain | Priority |
|---|---|---|---|
| 1 | Anonymous / Guest Mode | Account & Identity | Must (MVP) |
| 2 | Sign-Up / Sign-In (Email + Social) | Account & Identity | Must (MVP) |
| 3 | Profile Management | Account & Identity | Must (MVP) |
| 4 | Student Verification | Account & Identity | Must (MVP) |
| 5 | Session & Multi-Device Management | Account & Identity | Should (Fast-follow) |
| 6 | Plan Selection & Comparison | Subscription & Billing | Must (MVP) |
| 7 | Payment Processing | Subscription & Billing | Must (MVP) |
| 8 | Subscription Renewal & Cancellation | Subscription & Billing | Must (MVP) |
| 9 | Entitlement Enforcement | Subscription & Billing | Must (MVP) |
| 10 | Billing History & Invoices | Subscription & Billing | Should (Fast-follow) |

---

## 2.1 Feature: Anonymous / Guest Mode

**Purpose:** Let a first-time user reach the core scanning value prop (BRD-01) with zero signup friction, since forcing account creation before first use is a proven activation-killer for scanning-utility apps.

**Business Value:** Directly serves BRD-01 (free-tier acquisition at zero marginal cost). Guest mode is the top of the funnel; conversion to a registered/paid account happens after the user has already experienced value.

**User Story:**
> **US-ACC-01:** As a **first-time student user**, I want to scan and export a document without creating an account, so that I can solve my immediate task before deciding whether to sign up.
>
> Acceptance Criteria:
> - Given the app is opened for the first time, when I skip sign-in, then I land directly in the Scanner with full local (on-device) scanning capability.
> - Given I am in guest mode, when I attempt a cloud-dependent action (cloud sync, cross-device access), then I am prompted to sign in, with my current local work preserved.

**Functional Requirements:**
- **FR-ACC-01:** The system shall allow app usage without authentication, given the device has never completed sign-in, resulting in full access to local-only features (scan, local PDF edit) and a locally-scoped anonymous identity (device-bound UUID).
- **FR-ACC-02:** The system shall preserve all guest-created content, given a guest user later signs in on the same device, resulting in guest content being attached to the newly created/authenticated account rather than lost.

**Flow:** App launch → no valid session token found → anonymous local identity (UUID) generated and cached on-device → user routed to core app shell with cloud-gated features visibly locked → any attempt to use a cloud feature triggers a non-blocking sign-in prompt.

**Inputs:** None (no credentials); device identifier generated locally.

**Outputs:** Local anonymous session token; locally stored files tagged with the anonymous UUID.

**Business Logic:** Anonymous UUID is generated once per device install and persisted in local secure storage (not synced). On sign-in, a one-time migration job re-tags all locally-owned files from the anonymous UUID to the authenticated user ID (Cognito `sub`).

**Permissions:** Anonymous users may perform all on-device-only operations (scan, local merge/split/compress within free-tier limits). They may NOT access: cloud sync, cross-device history, subscription purchase (purchase requires an identity to attach entitlement to).

**Errors:**
| Error Case | Handling |
|---|---|
| Migration of guest files fails on sign-in | Retry migration in background; guest files remain locally accessible under old UUID until migration succeeds; user is not blocked |
| Device storage full during guest use | Standard OS low-storage prompt; app-level warning before scan capture |

**Limitations:** Anonymous identity is device-bound; guest content does not sync across devices and is lost if the app is uninstalled before sign-in/migration.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User has guest content on two different devices, then signs into the same account on both | Both devices' guest content migrates independently; no automatic merge/dedupe of identical scans is performed in MVP | Minor |
| Guest attempts in-app purchase | Blocked; forced into sign-up/sign-in flow first, guest content preserved and carried into the new session | Major |
| App reinstalled before ever signing in | All guest content is lost (no recovery path in MVP, since it was never synced) | Minor |

**Acceptance Tests:** Verify full scan-to-export flow completes with zero authentication prompts; verify guest files reattach correctly to a newly created account; verify cloud-gated UI elements are visibly (not silently) locked for guests.

**Future Enhancements:** Optional lightweight "claim this device" flow via SMS/email without full account creation, as a middle step between guest and full sign-up.

**Traces to:** BRD-01.

---

## 2.2 Feature: Sign-Up / Sign-In (Email + Social)

**Purpose:** Provide the identity backbone required for entitlements, cloud sync, and cross-device access.

**Business Value:** Required foundation for BRD-02 (paid tiers) and BRD-05 (Cognito-based auth per NFR security baseline, Ch.1 §1.5).

**User Story:**
> **US-ACC-02:** As a **user ready to unlock cloud features or a paid plan**, I want to sign up with the method most convenient to me (email or social), so that account creation doesn't become a second point of friction after guest mode already got me this far.
>
> Acceptance Criteria:
> - Given I choose email sign-up, when I submit a valid email and password, then I receive a verification prompt and can use the app in an unverified-but-limited state pending verification.
> - Given I choose "Continue with Google/Apple," when the OAuth flow succeeds, then my account is created/matched without requiring a separate password.

**Functional Requirements:**
- **FR-ACC-03:** The system shall support account creation via email/password or OAuth (Google, Apple), given valid credentials or a successful OAuth handshake, resulting in a Cognito-backed user identity with a JWT session issued to the client.
- **FR-ACC-04:** The system shall enforce password complexity (min. 8 chars, at least 1 number) at signup, given email/password registration, resulting in rejection with a specific validation message for non-compliant passwords.
- **FR-ACC-05:** The system shall match an OAuth sign-in to an existing email/password account sharing the same verified email, given the user previously registered by email, resulting in a single unified account rather than duplicate accounts.

**Flow:** User selects sign-up method → (email path: enter email/password → verification email sent → account in "unverified" state until confirmed) OR (social path: OAuth redirect → provider consent → token exchange with Cognito) → JWT issued → client stores token securely → onboarding/profile-completion screen.

**Inputs:** Email, password (email path); OAuth provider token (social path); device metadata for session record.

**Outputs:** Cognito user record; JWT access + refresh token pair; user profile stub.

**Business Logic:** Cognito is system of record for identity (per BRD-05/NFR Security). Account linking by verified email prevents duplicate-account fragmentation across sign-in methods. Unverified email accounts retain guest-tier feature access only until verified.

**Permissions:** N/A at this stage — this feature establishes identity, not entitlement; entitlement is resolved separately (see 2.9, Entitlement Enforcement).

**Errors:**
| Error Case | Handling |
|---|---|
| Email already registered (email path) | Reject with "account exists" message; offer password-reset path |
| OAuth provider denies consent | Return to sign-in screen with neutral "sign-in was cancelled" message |
| Network failure mid-OAuth-handshake | Local retry; no partial account created (transaction is atomic at Cognito) |
| Password reused from a known breach list | Reject at signup with guidance, per OWASP baseline (Ch.1 NFR Security) |

**Limitations:** MVP supports Google and Apple as the only OAuth providers (no Facebook/Microsoft at launch, per Volume 1 platform scope).

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User signs up with email, never verifies, tries to purchase Student/Pro | Blocked; purchase requires verified email | Major |
| Same user signs up via Google on one device and Apple on another, different email addresses exposed by each provider | Treated as two distinct accounts (no cross-provider identity resolution without a shared verified email) — flagged as a known MVP gap | Major |
| User deletes app mid-verification | Verification link remains valid for standard TTL (24h); reinstalling and confirming resumes the same account | Minor |

**Acceptance Tests:** Verify duplicate-account prevention across email/social with shared verified email; verify JWT refresh flow across app restarts; verify unverified accounts are functionally restricted, not just visually nudged.

**Future Enhancements:** Passwordless (magic-link/OTP) sign-in; additional OAuth providers; cross-provider identity linking by verified phone number as a fallback to email matching.

**Traces to:** BRD-02, BRD-05 (NFR Security).

---

## 2.3 Feature: Profile Management

**Purpose:** Let a signed-in user view/edit basic identity attributes and see their current plan at a glance.

**Business Value:** Low-glamour but necessary support feature for BRD-02/BRD-03 — students need to see their verification status, all users need to see their active plan.

**User Story:**
> **US-ACC-03:** As a **signed-in user**, I want to view and edit my name, email, and profile photo, and see my current plan, so that I have one place to confirm who I am and what I'm paying for.
>
> Acceptance Criteria:
> - Given I am signed in, when I open Profile, then I see my name, email, plan tier, and (if applicable) student verification status.
> - Given I change my email, when I confirm via the new email's verification link, then my sign-in email updates only after confirmation, never before.

**Functional Requirements:**
- **FR-ACC-06:** The system shall allow editing of display name and profile photo, given a signed-in session, resulting in an updated profile record visible across the user's devices after sync.
- **FR-ACC-07:** The system shall require re-verification of a new email before it replaces the sign-in email, given an email-change request, resulting in the old email remaining active as the sign-in credential until the new one is confirmed.

**Flow:** Profile screen loads current record from Account service → user edits field → client validates format locally → PATCH request to Account API → on success, local cache and cloud record updated → cross-device sync propagates change.

**Inputs:** Display name (text), profile photo (image upload), new email (if changing).

**Outputs:** Updated user profile record; sync event pushed to other signed-in devices.

**Business Logic:** Email changes are two-phase (request + confirm) to prevent account lockout from typos. Plan tier and student-verification status shown here are read-only reflections of the Subscription/Billing and Student Verification features, not editable directly.

**Permissions:** Any signed-in user (anonymous users have no profile to manage).

**Errors:**
| Error Case | Handling |
|---|---|
| Photo upload exceeds size limit | Reject client-side before upload, with size guidance |
| New email already in use by another account | Reject with clear message; no account enumeration detail beyond "in use" |

**Limitations:** No username/handle system in MVP — display name is not unique or public-facing beyond the user's own devices.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User initiates email change, then goes offline before confirming | Old email remains valid indefinitely until confirmation or explicit cancellation; no forced timeout in MVP | Minor |
| User edits profile on two devices offline simultaneously | Last-write-wins on reconnect, based on server-received timestamp | Minor |

**Acceptance Tests:** Verify email doesn't change until new-address confirmation; verify profile edits propagate to a second signed-in device within a defined sync window.

**Future Enhancements:** Public-facing profile/handle (only relevant if sharing/collaboration features are added); avatar cropping tools.

**Traces to:** BRD-02, BRD-03 (surfacing verification status).

---

## 2.4 Feature: Student Verification

**Purpose:** Gate the ₹19 Student tier behind a real verification mechanism so the discount isn't trivially abused by non-students, protecting margin on the lowest-priced paid tier.

**Business Value:** Directly implements BRD-03. Without this, BRD-01's low-friction funnel and the ₹19 price point would be exploited broadly, undermining the ₹49 Pro tier's value proposition.

**User Story:**
> **US-ACC-04:** As a **student**, I want to prove my student status quickly, so that I can access the discounted Student plan without a lengthy manual process.
>
> Acceptance Criteria:
> - Given I select the Student plan, when I submit a valid `.edu`-equivalent institutional email (or regional student-ID document, market-dependent) then my verification is either auto-approved (email domain match) or queued for review (document upload).
> - Given my verification expires (e.g., annual re-check), when the expiry date passes, then I am notified before automatic downgrade to Free, not surprised by it.

**Functional Requirements:**
- **FR-ACC-08:** The system shall verify student status via institutional email domain match against a maintained allow-list, given the user submits such an email, resulting in automatic Student-tier eligibility without manual review.
- **FR-ACC-09:** The system shall support manual document upload (student ID) as a fallback verification path, given the user's institution is not on the domain allow-list, resulting in a queued review state with a target SLA communicated to the user.
- **FR-ACC-10:** The system shall re-verify student status on a recurring basis (annual, aligned to typical academic year), given an active Student-tier subscription, resulting in a renewal reminder before any downgrade, never a silent downgrade.

**Flow:** User selects Student plan → chooses verification method → (domain-match path: instant allow/deny) OR (document path: upload → manual/automated review queue → approve/reject notification) → on approval, Student-tier entitlement activated → recurring re-verification scheduled.

**Inputs:** Institutional email address, OR uploaded student ID image/document.

**Outputs:** Verification status (`unverified` / `pending` / `verified` / `expired`); entitlement flag enabling Student pricing at checkout.

**Business Logic:** Domain allow-list is maintained as configuration data, not hardcoded, so it can grow without a release. Document-upload path assumes human or third-party verification review (specific vendor/process is a Volume 5/8 backend decision, not fixed here). Re-verification cadence defaults to 12 months but is configurable.

**Permissions:** Only signed-in, email-verified users (per 2.2) may submit student verification.

**Errors:**
| Error Case | Handling |
|---|---|
| Document upload unreadable/blurry | Reject with re-upload prompt before it enters the review queue, to avoid wasting reviewer time |
| Domain match found but email itself unverified | Verification blocked pending email confirmation (chains from FR-ACC-03/2.2) |
| Review queue exceeds target SLA | User is notified of delay; Free-tier access continues uninterrupted while pending (no punitive lockout) |

**Limitations:** MVP ships with domain-match as the primary path; document-review capacity/tooling is a fast-follow concern documented further in Volume 5 (Backend) and Volume 8 (relevant engine), not duplicated here.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| Student graduates/changes institutional email mid-subscription | Re-verification at renewal fails; user is downgraded to Free with advance notice, retaining all their files/data | Major |
| User submits a fraudulent document | Rejected at review; repeated fraudulent attempts should be flag-able for abuse review (exact throttling policy deferred to Volume 10, Security) | Major |
| Institution's domain is shared with staff (not student-exclusive) | Flagged as an allow-list quality issue, not a per-user product bug — allow-list curation is an ops process, not an app feature | Minor |

**Acceptance Tests:** Verify domain-match grants instant eligibility; verify document path enters a reviewable queue state; verify expiry triggers advance notice, not silent downgrade; verify downgraded users retain their content.

**Future Enhancements:** Integration with third-party identity/education-verification providers (e.g., SheerID-style services) to replace manual document review entirely.

**Traces to:** BRD-03.

---

## 2.5 Feature: Session & Multi-Device Management

**Purpose:** Let a user see and control where their account is signed in, and keep sessions consistent across Android/iOS/Web.

**Business Value:** Supports trust/security expectations for a paid product and reduces support burden from "someone else is on my account" concerns.

**User Story:**
> **US-ACC-05:** As a **Pro subscriber using the app on both my phone and a laptop browser**, I want to see all active sessions and revoke any I don't recognize, so that I stay in control of my account.
>
> Acceptance Criteria:
> - Given I am signed in, when I open "Active Sessions," then I see a list of devices/platforms with last-active timestamps.
> - Given I revoke a session, when that action completes, then the target device's JWT is invalidated on its next API call, forcing re-authentication there.

**Functional Requirements:**
- **FR-ACC-11:** The system shall list all active sessions with device type, platform, and last-active time, given a signed-in request to the session-list endpoint, resulting in an accurate, near-real-time view (not cached beyond a short TTL).
- **FR-ACC-12:** The system shall allow remote revocation of any session other than the current one, given an authenticated revoke request, resulting in invalidation of that session's refresh token.

**Flow:** User opens Session Management screen → client fetches active sessions from Account API → user selects "Revoke" on a session → API invalidates that refresh token server-side → target device's next token-refresh attempt fails, forcing re-authentication there.

**Inputs:** Session ID to revoke (from the displayed list).

**Outputs:** Updated session list; invalidated refresh token record.

**Business Logic:** Access tokens are short-lived; refresh tokens are the actual revocation lever, consistent with standard JWT session patterns and the Cognito-backed auth model (BRD-05, §2.2).

**Permissions:** Any signed-in user, for their own sessions only. No cross-user session visibility (obviously).

**Errors:**
| Error Case | Handling |
|---|---|
| Attempt to revoke the current session from itself | Disallowed via this screen; routed to a distinct "sign out" action instead, to avoid confusing self-lockout mid-review |
| Revoke request during network loss | Queued/retried; UI shows pending state rather than a false success |

**Limitations:** MVP does not include geo-location or IP display for sessions (privacy/scope decision); only device/platform/time.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User revokes all other sessions while one of them mid-processes a cloud job (e.g., OCR) | In-flight job completes server-side; only the client's ability to fetch further data is cut, no data loss | Minor |
| Session list requested immediately after a new device signs in | New session appears within the defined near-real-time TTL, not instantly guaranteed | Minor |

**Acceptance Tests:** Verify revoke on Device B while signed in on Device A forces Device B to re-authenticate on its next request; verify current session cannot self-revoke via this screen.

**Future Enhancements:** Push notification to a device when it is remotely revoked, rather than only surfacing on its next failed request.

**Traces to:** BRD-05 (NFR Security).

---

## 2.6 Feature: Plan Selection & Comparison

**Purpose:** Present Free/Student/Pro tiers clearly enough that users (especially price-sensitive student personas) can self-select the right plan without support intervention.

**Business Value:** Directly implements BRD-02's tier structure and supports BRD-03 by making the student-discount path visible and low-friction at the point of decision.

**User Story:**
> **US-SUB-01:** As a **prospective subscriber**, I want to compare Free, Student (₹19), and Pro (₹49) side-by-side, so that I can pick the plan that matches my needs and budget.
>
> Acceptance Criteria:
> - Given I open the plans screen, when plans load, then I see feature-by-feature differences, not just price.
> - Given I am eligible for Student pricing but not yet verified, when I select Student, then I'm routed into the Student Verification flow (2.4) before checkout, not charged Pro price by default.

**Functional Requirements:**
- **FR-SUB-01:** The system shall display all active plan tiers with a feature comparison matrix, given the plans screen is opened, resulting in accurate, entitlement-service-sourced feature lists (not hardcoded client-side copy that can drift from reality).
- **FR-SUB-02:** The system shall route unverified users selecting the Student plan into the verification flow before payment, given Student is selected, resulting in no Student-priced charge occurring prior to verified (or pending) status.

**Flow:** User opens Plans screen → client fetches current plan/pricing/feature-matrix from Subscription API → user selects a tier → (if Student and unverified: route to 2.4 first) → proceed to Payment Processing (2.7).

**Inputs:** Selected plan tier.

**Outputs:** Selected-plan intent record, passed forward to the payment flow.

**Business Logic:** Feature matrix is served from the backend (Subscription service), not hardcoded in-app, so pricing/feature changes don't require an app store release — this ties directly to BRD-05's serverless-scalability intent applied to product agility as well as infra cost.

**Permissions:** Any user (guest or signed-in) may view plans; only signed-in users may select and proceed to purchase (guest is routed to sign-up first, per 2.1's purchase restriction).

**Errors:**
| Error Case | Handling |
|---|---|
| Plans API unreachable | Fall back to last-cached plan data with a "may be outdated" indicator, rather than blocking the screen entirely |

**Limitations:** Business/Enterprise tiers are structurally represented in the data model (per BRD-07) but not shown or selectable on this screen at launch.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User already on Pro views the Plans screen | Current plan is clearly marked as active; downgrade path is available but not the default emphasis | Minor |
| Pricing changes while user has the Plans screen open from an earlier session | Refetch on screen focus ensures current pricing is shown before any payment step | Major |

**Acceptance Tests:** Verify feature matrix matches backend-configured entitlements exactly; verify Student selection without verification never reaches a Student-priced charge.

**Future Enhancements:** Regional pricing variants; annual vs. monthly billing toggle with visible savings.

**Traces to:** BRD-02, BRD-03.

---

## 2.7 Feature: Payment Processing

**Purpose:** Securely collect payment and convert a plan selection into an active, paid subscription.

**Business Value:** The literal revenue mechanism for BRD-02.

**User Story:**
> **US-SUB-02:** As a **user who has selected a plan**, I want to pay via a familiar method (card/UPI/wallet, market-dependent) and get immediate confirmation, so that I can start using paid features right away.
>
> Acceptance Criteria:
> - Given I submit valid payment details, when the payment provider confirms success, then my entitlement activates within the same session, with no manual step required.
> - Given payment fails, when the failure is returned, then I see a specific, actionable reason (declined, insufficient funds, etc.), not a generic error.

**Functional Requirements:**
- **FR-SUB-03:** The system shall process payment via a PCI-compliant third-party payment provider, given valid payment details are submitted, resulting in no raw card data ever touching OneConvert's own backend/storage.
- **FR-SUB-04:** The system shall activate the corresponding entitlement immediately upon payment-provider confirmation, given a successful payment webhook/callback, resulting in the user's plan tier updating without requiring an app restart.

**Flow:** User confirms plan + enters payment method → client/backend hands off to payment provider's SDK/checkout → provider processes payment → provider sends confirmation (webhook to backend + client-side callback) → backend updates entitlement record → client refreshes local entitlement state.

**Inputs:** Payment method details (handled by the payment provider's SDK, not OneConvert directly).

**Outputs:** Payment confirmation record; updated entitlement; receipt.

**Business Logic:** OneConvert never stores raw payment credentials (NFR Security, Ch.1 §1.5) — this is delegated entirely to the payment provider, with OneConvert's backend only persisting provider-issued transaction references. Entitlement activation is driven by the backend webhook, not the client-side callback alone, so activation isn't spoofable by a compromised client.

**Permissions:** Signed-in, verified (email) users only. Student pricing additionally requires verified/pending student status per 2.4/2.6.

**Errors:**
| Error Case | Handling |
|---|---|
| Payment declined by provider | Specific reason surfaced (from provider's error taxonomy) with retry option |
| Webhook delayed relative to client callback | Client shows "processing" state, not false success, until backend confirms via webhook |
| Duplicate payment submission (double-tap) | Idempotency key used per attempt to prevent double-charging |

**Limitations:** MVP supports the payment methods available through the chosen payment provider's SDK at launch market scope; exact method list (UPI/cards/wallets) is a provider-configuration detail, not fixed in this chapter.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| Payment succeeds at provider but webhook delivery fails/is delayed | Backend polls/reconciles with provider on a retry schedule so entitlement still activates without manual support intervention | Blocker |
| User closes app immediately after submitting payment, before confirmation renders | Entitlement still activates via webhook; next app open reflects correct (paid) state | Major |

**Acceptance Tests:** Verify no card data appears in OneConvert's own logs/DB; verify entitlement activates purely from webhook even if client disconnects mid-flow; verify idempotency prevents double-charge on duplicate submission.

**Future Enhancements:** Support for additional regional payment methods as launch markets expand.

**Traces to:** BRD-02, BRD-05 (NFR Security).

---

## 2.8 Feature: Subscription Renewal & Cancellation

**Purpose:** Manage the ongoing lifecycle of a subscription — auto-renewal, user-initiated cancellation, and graceful downgrade — without silent surprises to the user.

**Business Value:** Directly supports BRD-02's recurring-revenue model; cancellation clarity also reduces chargeback/dispute risk, which matters given the thin margin at the ₹19 tier (BRD-01/§1.5 cost-efficiency NFR).

**User Story:**
> **US-SUB-03:** As a **subscriber**, I want to cancel my plan and clearly know when access ends, so that I'm not confused about billing or surprised by a sudden loss of features.
>
> Acceptance Criteria:
> - Given I cancel, when the cancellation is confirmed, then I retain paid access through the end of the already-paid period, then automatically revert to Free.
> - Given my renewal payment fails, when the failure occurs, then I get a grace-period notice before downgrade, not an instant cutoff.

**Functional Requirements:**
- **FR-SUB-05:** The system shall continue paid entitlement through the end of the current billing period after cancellation, given a cancellation request, resulting in no mid-cycle loss of paid features.
- **FR-SUB-06:** The system shall attempt renewal payment automatically at period end, given an active, non-cancelled subscription, resulting in continued paid access on success or a defined grace period on failure before downgrade to Free.

**Flow:** (Cancellation path) User requests cancellation → backend marks subscription `cancel_at_period_end` → paid access continues → at period end, no renewal attempted → tier reverts to Free.
(Renewal path) At period end, backend triggers renewal charge via payment provider → success: subscription continues → failure: grace period begins with user notification → grace period expires without resolution → downgrade to Free.

**Inputs:** Cancellation request (user-initiated); scheduled renewal trigger (system-initiated, time-based).

**Outputs:** Updated subscription status (`active` / `cancel_at_period_end` / `past_due` / `free`); user notifications at each relevant transition.

**Business Logic:** No instant-cutoff cancellations — this avoids "I paid for this month, why did it vanish today" support tickets. Grace period on renewal failure is a fixed window (exact number of days is a business/finance decision to be finalized in Volume 1's revenue-model detail, not invented here).

**Permissions:** Subscriber may cancel their own subscription only.

**Errors:**
| Error Case | Handling |
|---|---|
| Renewal payment fails repeatedly through grace period | Downgrade to Free proceeds automatically at grace-period end, with a final notice before it happens |
| User attempts to "cancel" a Free account | No-op / not applicable; UI should not present cancellation as an option for Free users |

**Limitations:** MVP does not support pausing a subscription (only active/cancel/downgrade), and does not support prorated mid-cycle upgrades in the initial release — both are flagged here as scope decisions, not oversights.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User cancels, then wants to re-subscribe before period end | Reactivation simply clears the `cancel_at_period_end` flag; no new charge until the original period would have renewed anyway | Minor |
| User's card expires exactly at renewal | Treated identically to a declined renewal — grace period + notice, not silent downgrade | Major |

**Acceptance Tests:** Verify cancelled users retain access until period end; verify failed renewal triggers a grace period and notice, never an instant downgrade; verify re-subscription during the cancel window doesn't double-charge.

**Future Enhancements:** Prorated upgrades/downgrades mid-cycle; subscription pause.

**Traces to:** BRD-02.

---

## 2.9 Feature: Entitlement Enforcement

**Purpose:** Be the single source of truth every other engine (PDF, OCR, Office, Image, Cloud) checks before allowing a gated action — this is the feature that actually makes "paid tiers unlock the full engine set" (BRD-02) real, rather than aspirational.

**Business Value:** Prevents revenue leakage (paid features usable by Free users) and prevents false lockouts (paid users blocked from what they paid for) — both are direct, measurable business risks.

**User Story:**
> **US-SUB-04:** As a **Free-tier user**, when I attempt a Pro-only action (e.g., password-protecting a PDF), I want a clear, immediate explanation of why it's blocked and an easy upgrade path, so that the restriction feels like an upsell, not a bug.
>
> Acceptance Criteria:
> - Given I am Free tier, when I tap a Pro-gated feature, then I see an upgrade prompt referencing that specific feature, not a generic error.
> - Given my subscription just lapsed, when I next attempt a previously-available paid action, then access is revoked consistently across all my devices, not just the one where it lapsed.

**Functional Requirements:**
- **FR-SUB-07:** The system shall check current entitlement server-side before executing any tier-gated processing job (not merely at the UI layer), given any gated action is requested, resulting in rejection of the backend job itself if entitlement doesn't cover it, regardless of what the client UI displayed.
- **FR-SUB-08:** The system shall propagate entitlement changes (upgrade, downgrade, expiry) to all of a user's signed-in devices, given any entitlement-changing event, resulting in consistent gating across devices without requiring each device to independently poll excessively.

**Flow:** Client requests a gated action → backend resolves current entitlement from the Subscription service (not from a client-supplied flag) → action proceeds or is rejected with a specific reason code → client renders the corresponding UI (execute, or upgrade prompt).

**Inputs:** Requested action + implicit user identity (from JWT); no entitlement flag trusted from the client itself.

**Outputs:** Action result, or a structured "entitlement required" response naming the specific feature/tier needed.

**Business Logic:** Entitlement is always resolved server-side at time of use, never cached-and-trusted client-side for gating a backend job — this is a security/business-integrity requirement, not just a UX one, since client-side-only gating is trivially bypassable.

**Permissions:** N/A — this feature *is* the permission system referenced across all other feature specs.

**Errors:**
| Error Case | Handling |
|---|---|
| Entitlement service temporarily unreachable | Fail closed for gated actions (deny by default) rather than fail open, to avoid revenue leakage during an outage |
| Client and server entitlement state briefly out of sync post-upgrade | Client should re-fetch entitlement immediately after any purchase/renewal confirmation to minimize the window |

**Limitations:** "Fail closed" on entitlement-service outage means a legitimate paid user could be briefly blocked during a backend incident — this is a deliberate trade-off favoring revenue integrity, to be monitored via the 99.9% uptime NFR (Ch.1 §1.5) rather than solved by weakening the gating logic.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User upgrades on Device A while mid-task on Device B | Device B's next gated action re-checks entitlement fresh and succeeds; no requirement to hot-swap mid-task | Minor |
| Downgrade occurs while a paid-tier processing job is already queued/running | In-flight job completes; entitlement check applies to the *next* job request, not one already accepted | Major |

**Acceptance Tests:** Verify a modified/spoofed client cannot bypass server-side gating; verify upgrade unlocks a gated feature on a second device without requiring reinstall; verify outage behavior fails closed, not open.

**Future Enhancements:** Granular feature-flag-level entitlements (beyond simple tier checks) to support future Business/Enterprise per-seat customization (BRD-07).

**Traces to:** BRD-02, BRD-05 (NFR Security/Scalability), BRD-07 (extensibility toward Business/Enterprise).

---

## 2.10 Feature: Billing History & Invoices

**Purpose:** Give users a record of what they've paid, for personal tracking, expense reimbursement (relevant to freelancer/business personas from Volume 1), and dispute resolution.

**Business Value:** Reduces support load for "what was I charged" queries and supports trust for personas (freelancer, accountant, business) who need documentation for their own expense tracking.

**User Story:**
> **US-SUB-05:** As a **freelancer subscriber**, I want to download an invoice for each payment, so that I can submit it for my own expense records.
>
> Acceptance Criteria:
> - Given I open Billing History, when the screen loads, then I see a chronological list of all past charges with date, amount, and plan.
> - Given I select a past charge, when I request the invoice, then I receive a downloadable document (PDF) suitable for expense submission.

**Functional Requirements:**
- **FR-SUB-09:** The system shall display a complete, chronological billing history, given a signed-in request to the billing-history endpoint, resulting in all historical charges for that account (never another account's data).
- **FR-SUB-10:** The system shall generate a downloadable invoice document per charge, given an invoice request for a specific past transaction, resulting in a PDF containing date, amount, plan, and basic billing identity details.

**Flow:** User opens Billing History → client fetches transaction list from Subscription/Billing API → user selects a transaction → invoice generation request → PDF returned/downloaded (this feature is itself a lightweight consumer of the PDF Engine domain covered in Chapter 4, illustrating the cross-domain reuse the architecture is meant to support).

**Inputs:** Selected transaction ID (for invoice request).

**Outputs:** Billing history list; generated invoice PDF.

**Business Logic:** Invoice generation reuses the core PDF Engine rather than a separate document-generation path, keeping with the single-source-of-truth architectural principle (Ch.1 §1.10).

**Permissions:** Signed-in user, own billing history only.

**Errors:**
| Error Case | Handling |
|---|---|
| Invoice generation fails transiently | Retry available; underlying transaction record itself is never lost even if the PDF generation step fails |

**Limitations:** MVP invoices are informational, not tax-compliant formal invoices for every jurisdiction — formal tax-invoice compliance (e.g., GST-compliant formatting for the initial launch market) is flagged for Volume 1/Finance input rather than assumed here.

**Edge Cases:**
| Edge Case | Expected Behavior | Severity |
|---|---|---|
| User requests invoice for a refunded transaction | Invoice reflects the refund status clearly, not just the original charge | Minor |
| Very long billing history (multi-year subscriber) | List is paginated, not loaded all at once | Minor |

**Acceptance Tests:** Verify billing history never leaks across accounts; verify invoice PDF contains accurate transaction data; verify pagination performs within the NFR performance baseline (Ch.1 §1.5).

**Future Enhancements:** Jurisdiction-specific tax-compliant invoice formatting; bulk invoice export for accounting personas.

**Traces to:** BRD-02.

---

### 2.11 Chapter Summary & Traceability Check

All 10 features in this chapter trace to at least one BRD row (per the Ch.1 §1.2 rule that untraced requirements are scope creep):

| Feature | BRD Trace |
|---|---|
| Anonymous/Guest Mode | BRD-01 |
| Sign-Up/Sign-In | BRD-02, BRD-05 |
| Profile Management | BRD-02, BRD-03 |
| Student Verification | BRD-03 |
| Session & Multi-Device Mgmt | BRD-05 |
| Plan Selection & Comparison | BRD-02, BRD-03 |
| Payment Processing | BRD-02, BRD-05 |
| Subscription Renewal & Cancellation | BRD-02 |
| Entitlement Enforcement | BRD-02, BRD-05, BRD-07 |
| Billing History & Invoices | BRD-02 |

No untraced requirements were introduced in this chapter. BRD-04 (Flutter/single-codebase) and BRD-06 (offline-first scanning) are not directly implicated by this domain and are expected to surface primarily in Chapter 3 (Scanner) and Volume 4 (Flutter Architecture).

Running feature count: **10 / 92** specified.

---
*End of Volume 2, Chapter 2. Next: Volume 2, Chapter 3 — Scanner Domain Features.*
