# Planned Quickstart and Acceptance Validation

**Architecture context:** [ADR-001](architecture-decision.md) selects the shared HTTP/PostgreSQL modular monolith. This remains a planned contract/validation guide, not a running implementation.

This is a future run guide. Application code, Maven modules, migrations and runnable artifacts do not exist yet. The commands below are the intended implementation interface, not commands verified during planning. Do not report these scenarios as passed until implementation evidence exists.

## Prerequisites and Setup

Java 21, Maven, PostgreSQL, a local SMTP test sink and a graphical desktop. Integration tests need a disposable PostgreSQL database; implementation may use a test container if Docker is available, or an explicitly provisioned isolated database. Never point test cleanup at a shared database.

Implementation must document pinned versions and supply a `local` profile mapping `SPLITSMART_DB_URL`, `SPLITSMART_DB_USER`, `SPLITSMART_DB_PASSWORD`, `SPLITSMART_MAIL_HOST`, `SPLITSMART_MAIL_PORT` and desktop `SPLITSMART_API_URL`. Local settings must be untracked; no credentials embedded in documents/build artifacts. Server must apply migrations and refuse incompatible schema. These configuration names are planned contracts.

From repository root, after implementation:

```sh
java -version
mvn -version
mvn clean verify
mvn -pl splitsmart-server -am package -DskipTests
java -jar splitsmart-server/target/splitsmart-server.jar --spring.profiles.active=local
```

In another terminal, after configuring the API URL:

```sh
mvn -pl splitsmart-desktop -am package -DskipTests
java -jar splitsmart-desktop/target/splitsmart-desktop.jar
```

The future build must produce these stable executable artifact names and all required dependencies. `-DskipTests` only accelerates packaging after `clean verify` succeeds. SMTP sink must capture recovery/invitation messages for local inspection; real email sending is not part of planning.

## Validation Scenarios

Create Alice, Bob and Carol with separate accounts and sessions; use stable deterministic UUIDs in automated split fixtures. Create a USD group, invite the others, accept as the intended accounts and configure Bob then Carol as sequential reviewers for an Alice submission. Start two independent desktop processes against the same server.

| ID / requirements | Action | Expected evidence |
| --- | --- | --- |
| V1 / FR-001 | Register/login each user; invalid password; recover using local mail; reuse consumed token; retry old session | Own profile only; generic failures; reset works once and revokes sessions; no password/token leakage |
| V2 / FR-002 | Member attempts invite/remove/policy change; owner removes a member after history exists | Role denial; authorized changes succeed; historical rows/debt remain; removed user cannot browse group but can see own retained debt |
| V3 / FR-003 | Submit USD 10 expense with payer Alice excluded from participants Bob/Carol; missing fields; 0, negative, 1.001 amounts | PENDING with payer separate, 5/5 shares; invalid cases reject with no partial writes |
| V4 / FR-004 | Equal 10 among 3 sorted UUIDs; 0.01 at 50/50; 33.33/33.33/33.34%; invalid 99.99% | Exact results in research.md; input order does not change shares; invalid total rejected; JPY precision separately verified |
| V5 / FR-005 | Submit without image, with valid PNG/JPEG, oversized/corrupt image; non-member fetches receipt | Optional works; valid image authorized; invalid rejected atomically; no data to non-member |
| V6 / FR-006 | Submit expense, retry same idempotency key; refresh both other users | One notification per other active member, none to submitter/non-member; survives restart; logout hides prior user's UI |
| V7 / FR-007 | Bob approves first level; Carol approves final; race final approve/reject and repeat with new key; reject separate expense | First approval leaves debt unchanged; final posts once; one race winner; rejected expense never posts; self/out-of-order decisions denied |
| V8 / FR-008 | For a separate single-review fixture Bob pays USD 10 equally Alice/Bob; inspect before/after approval and restart | Before zero, after Alice owes Bob 5; opposite views reconcile; persisted ledger agrees with projection after restart |
| V9 / FR-009 | Alice pays Bob 2 of debt 5, attempt 4, then race two payments of 2 against debt 3; reverse winner | Debt 3; overpayment fails; only one race succeeds so debt 1; reversal restores 3 exactly once, original remains visible |
| V10 / FR-010 | Inspect summaries with pending/rejected/approved expenses and payments | Clearly labeled status totals; financial summaries use approved postings and payments only; no cross-account data |
| V11 / FR-011 | Inclusive date report with prior opening debt, in-range expense/payment/reversal and outside rows; inverted range | Boundary dates included, outside rows excluded; opening/movement/closing reconcile; invalid range rejected; currencies separate |
| V12 / FR-012 | Assess release coverage | Phase 1 is desktop-only and does not satisfy FR-012; future web, Android and iOS require independent installation/access and business scenario evidence |

Repeat split/payment tests with payer included and excluded, zero participant share, opposite pair ordering and reciprocal expenses. Test first-create pair-row races, database rollback between state/posting changes, concurrent payment/reversal, membership removal during submission, current reviewer removal and explicit reassignment. Test idempotency-key payload mismatch and authorization after replay/session revocation. Verify an approved expense cannot be edited or silently resplit.

Exercise offline/unavailable-server UI: show retryable errors, preserve entered form fields safely, never optimistically present uncommitted approval/payment as accepted. Slow server/image handling must not freeze the Swing EDT. Refresh after reconnect must show committed results rather than duplicate submissions.

## Evidence and Release Gate

`mvn clean verify` must run JUnit 5 domain/application tests, HTTP/security contract tests and PostgreSQL transaction tests. Review Surefire/Failsafe reports; record benchmark environment/results against plan.md goals. Perform desktop smoke checks on the reviewed support matrix. Reconcile ledger sums and pair projections using an administrator test fixture, never a public API exposing other users' raw ledger.

Link FR IDs to passing test cases, actual implementation files and manual evidence in the subsequent delivery traceability record. Confirm research D1–D5 policy defaults with a human before release acceptance. Human review is required before merge/release; this document supplies no approval to deploy or send external messages. Web and mobile matrix/version choices must be established in their own phase plans, preserving the original customer brief.
