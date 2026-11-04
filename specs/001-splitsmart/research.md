# Phase 0 Research and Decision Record

Date: 2026-11-04. Inputs: spec.md, constitution, and project-owner approval PLAN-001. Technical choices below elaborate the selected modular monolith; dependency version selection and policy confirmation remain implementation/review work. PLAN-001, ADR-001 and the existing DEC-001–DEC-008 are confirmed project/product decisions. [ADR-001](architecture-decision.md) records the project owner's selection of the modular monolith; the architecture choice is approved, while D1–D5 remain provisional product-policy defaults. No new customer requirement is introduced.

## R1 — Shared authority and module boundaries

**Decision:** Java 21 modular monolith service, Maven build, Swing HTTP client. Separate domain, application, transport contracts, server adapters and desktop modules. Use Spring Boot MVC/Security/JDBC for adapters; pin compatible release/plugin versions when creating the build. Explicitly pin JUnit 5 rather than inheriting a different test major. Use JDK HttpClient in desktop.

**Rationale:** Independently signed-in users need one source of truth and transactional concurrency control. A shared service also serves later web/mobile clients. Module boundaries preserve UI-independent domain rules. This architecture is an inference from collaboration requirements, not a vendor requirement from the customer. [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html) document Java/Maven compatibility; implementation must verify the chosen version against Java 21.

**Alternatives considered:** Embedded database per desktop cannot reliably coordinate separate users; direct shared DB credentials in clients bypass the application boundary; microservices introduce distributed transactions without a current need. A standalone desktop demo is not evidence for collaboration acceptance.

## R2 — Persistence and concurrency

**Decision:** PostgreSQL, JDBC repositories, Flyway migrations. Exact NUMERIC columns; immutable ledger entries plus a pair balance projection updated in the same transaction. Acquire canonical pair/currency locks before checking and changing debt; lock expenses before reviewing. Unique posting source keys enforce exactly-once effects. Submission and notification inserts share a transaction. No message broker needed.

**Rationale:** Money needs exact values and isolation, not binary floating point or eventual overpayment checks. Use documented [exact numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html) and [transaction isolation/locking behavior](https://www.postgresql.org/docs/16/transaction-iso.html). Tests must use real PostgreSQL, including first-write pair creation races and retry behavior.

**Alternatives considered:** An H2-only test database can hide database behavior; recomputing every balance on each request increases query cost; a projection without ledger loses traceability. Optimistic retries alone are possible but harder to reason about for multiple pair updates.

## R3 — Money and split implementation policy

**Decision (provisional policy D1):** Group has one immutable currency after first financial activity; configure supported ISO currency codes with explicit minor-unit scales. Initial validation fixtures use USD (2) and JPY (0); these fixtures do not restrict the final supported currency list. No cross-currency conversion/netting. Validate positive amounts at currency precision using BigDecimal from decimal strings; reject excess scale rather than silently round user amounts. Percentage values are exact decimals totaling exactly 100.

For computed shares, express the amount in integer minor units, calculate equal or percentage quotas using exact decimal/rational arithmetic, floor with `RoundingMode.DOWN`, then allocate remaining units to descending fractional remainder, ties by ascending UUID canonical string. For equal splits, use quotient/remainder to avoid repeating-decimal division. For percentages, finite decimal percentages permit exact quota arithmetic. Save final shares and policy version; never recalculate historical shares under new policies.

**Rationale:** Reconciliation, precision and deterministic results satisfy DEC-003/004/005. [BigDecimal Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html) defines exact decimal operations and explicit rounding.

**Examples:** USD 10.00 equally among sorted A/B/C → 3.34, 3.33, 3.33. USD 0.01 at 50/50 → 0.01 to lower UUID, 0.00 to the other. Zero shares are valid, zero expense/payment amounts are not. USD 10.00 at 33.33/33.33/33.34 → 3.33, 3.33, 3.34.

**Alternatives considered:** Binary floating point loses exactness; independent HALF_UP rounding can fail reconciliation; UUID-first assignment of all residual units is deterministic but less faithful to percentage quotas.

## R4 — Identity, recovery and receipt storage

**Decision:** Email/password accounts with server-side adaptive one-way password encoding (Spring Security delegating encoder, bcrypt initially). Opaque random session tokens stored hashed server-side, expiring/revocable; keep desktop tokens in memory, never preferences/logs. HTTPS outside local development. Recovery uses a random single-use expiring token hash and SMTP port; return the same recovery-request response for known/unknown addresses. Revoke sessions after reset. Validate identity and object authorization server-side on every call.

**Rationale:** [Spring Security password storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html) supports adaptive one-way hashing and algorithm identification. Session and recovery lifetimes are engineering defaults, not confirmed product rules.

**Decision (provisional D2):** JPEG/PNG receipts up to 5 MiB, decoded dimensions bounded to 20 megapixels; verify actual image content, not only extensions. Private receipt bytes stored transactionally with expense metadata; no public storage access. Retain for the expense history lifetime pending an explicit retention policy. Download only through an authorized endpoint; removed members receive no new group receipt access by default. No receipt required.

**Alternatives considered:** Public URLs leak access; local client file paths fail across users; object storage becomes useful at higher volume but adds deployment complexity. Durable retention and account deletion require a later explicit policy; no deletion is assumed.

## R5 — Approval and reversal policies

**Decision (provisional D3):** Managers configure an ordered nonempty list of reviewer users; Phase 1 UI supports one or multiple sequential levels. Each level has one assigned reviewer. Snapshot reviewer IDs/order when submitting; disallow self-review and invalid/inactive reviewers at submission. A submitter who is also owner needs another reviewer. Owner may appoint reviewers; changing policy affects future submissions. Reject ends that submission; a correction is a new expense referencing its predecessor, with a new approval chain and notification. Approved records cannot be edited/deleted. If a reviewer is removed, their pending submissions remain pending until a manager explicitly reassigns the step to an eligible member with an audit record; no automatic approval.

**Decision (provisional D4):** Payment sender records settlement against debt in a group/currency, including retained debt after removal. Sender may reverse their own payment once; append a full reversal, never delete the payment. Reversal restores the original debt even if later activity changed the net direction; record the result transparently. Reconciliation with an external payment provider is not modeled or claimed.

**Rationale:** Preserves financial history, explicit authorization and multilevel capability without inventing implicit approval. These choices resolve the draft architecture's policy branches; human confirmation is required before treating them as accepted product policy.

**Alternatives considered:** Self-review weakens review independence; dynamic policy evaluation can change already-submitted obligations; destructive payment edits lose history; partial reversals add unnecessary initial complexity.

## R6 — Reports, notification and presentation

**Decision (provisional D5):** On-screen date-filtered reports support group, record type and expense status. Business dates are LocalDate, inclusive start/end; timestamps are UTC instants. Report opening balance uses postings with business date before start; closing balance includes postings through end. Backdated activity changes historical reports; no immutable period-close accounting is implied. Currency totals stay separate. Reports expose authorized records only, and distinguish pending/rejected totals from approved financial totals. Export formats are not assumed.

**Decision:** Persist one notification per other active group member at submission, unique on recipient/expense/type. Swing polls paginated notifications every 15 seconds while signed in with refresh/backoff; no guaranteed alert latency is a customer commitment. Network/image work runs off EDT; update components on EDT and discard stale responses after logout/navigation. [SwingWorker](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/SwingWorker.html) documents the worker/EDT separation.

**Alternatives considered:** WebSockets and push delivery can be added later; screen-only transient notifications lose offline recipients. Export engines are unnecessary without format requirements.

## R7 — Verification and future platform boundaries

**Decision:** JUnit 5 unit/application tests, PostgreSQL-backed integration tests, transport contract tests, and limited Swing presenter/manual validation. Benchmark goals and support targets in plan.md are provisional engineering baselines. Future browser/mobile support matrices are decisions for those release phases, not missing dependencies of the desktop architecture. [JUnit 5 guide](https://docs.junit.org/5.13.4/user-guide/) supports the selected testing approach.

**Rationale:** Financial correctness and concurrent writes must be demonstrated without GUI construction. Future platform acceptance requires real delivered clients, not presumed portability of Java or Swing.

**Alternatives considered:** GUI-only verification is brittle and misses concurrent transactions; claiming a responsive web page as both mobile apps would not establish the requested app acceptance.

## Resolution and Review

All Phase 1 technical unknowns are resolved by the decisions above. D1–D5 and proposed support/performance targets remain explicitly reviewable design defaults. They do not silently change the specification's provisional acceptance criteria. Before release obtain human confirmation of currency configuration, reviewer/self-review/reassignment rules, reversal authority, receipt retention/access, report parameters and supported desktop environments. Detailed future-platform technology/OS choices remain future-phase planning work. No requirements are waived and no engineering research can substitute for customer policy approval.
