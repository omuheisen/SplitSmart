# Phase 1 Data Model

Planned model for Architecture 1 selected under [ADR-001](architecture-decision.md), not schema implementation. All entities share the modular monolith's PostgreSQL transactional boundary; they are not separate service-owned databases. See [class diagram](diagrams/class-diagram.puml) and [expense activity](diagrams/expense-activity.puml). UUID identifiers; UTC instants for audit timestamps, LocalDate for expense/payment business dates. Monetary values use BigDecimal in Java, decimal strings on transport, and exact NUMERIC in PostgreSQL. Persist currency and scale alongside financial records; never aggregate different currencies. Provisional policies D1–D5 are defined in research.md.

## Entities and Relationships

| Entity | Main fields | Relations / constraints |
| --- | --- | --- |
| User | id, normalizedEmail, passwordHash, displayName, status, createdAt | Unique normalized email; password never returned; no destructive account deletion designed |
| Session | id, userId, tokenHash, expiresAt, revokedAt | Many per user; token hashes unique; server authoritative |
| RecoveryToken | id, userId, tokenHash, expiresAt, consumedAt | Single-use atomic consumption; mail delivery never exposes hash |
| Group | id, name, currencyCode, currencyScale, createdBy, version | Creator becomes owner; currency immutable after financial activity |
| Membership | groupId, userId, role, joinedAt, removedAt | Unique group/user; roles OWNER/MANAGER/MEMBER; removal soft; cannot remove final owner |
| Invitation | id, groupId, normalizedEmail, tokenHash, expiresAt, acceptedBy, state | Manager-issued; acceptance requires signed-in matching email, single use |
| ApprovalPolicy / PolicyStep | id, groupId, version; policyId, ordinal, reviewerId | One current policy/group; nonempty contiguous steps; historical versions retained |
| Expense | id, groupId, submitterId, payerId, amount, currency, businessDate, description, splitMethod, state, policyVersion, allocationVersion, replacesExpenseId, version | Positive currency-precision amount; payer distinct field from participant set; payer/participants active members at submission; nonempty description; immutable submitted payload |
| ExpenseShare | expenseId, participantId, percentage, shareAmount, allocationRank | Unique expense/participant, nonempty participant set; percentage only for percentage method, nonnegative and sum exactly 100; nonnegative shares sum exactly amount |
| Receipt | id, expenseId, mediaType, byteLength, width, height, sha256 | Zero or one/expense; receipt bytes in private ReceiptContent table; D2 limits; no file-path references |
| ApprovalStep | id, expenseId, ordinal, assignedReviewerId, state, reviewedAt, comment, version | Snapshot of policy; one required decision/level; steps PENDING/APPROVED/REJECTED; authorization checked at decision time |
| ReviewerReassignment | id, approvalStepId, previousReviewerId, newReviewerId, actorId, at, reason | Append-only; manager-only, pending step only, eligible replacement cannot be submitter |
| Notification | id, recipientId, expenseId, groupId, type, createdAt, readAt | Unique recipient/expense/type; recipients snapshotted on submission excluding submitter |
| Payment | id, groupId, senderId, recipientId, amount, currency, businessDate, recordedBy, recordedAt | Sender and recipient differ; sender records; positive amount <= current pair debt under lock |
| PaymentReversal | id, paymentId, actorId, businessDate, reason, createdAt | Unique paymentId; full reversal only; original remains immutable |
| LedgerEntry | id, groupId, lowUserId, highUserId, currency, signedAmount, businessDate, sourceType, sourceId, sourceLine, createdAt | Immutable; canonical pair ordered by UUID; unique sourceType/sourceId/sourceLine; zero entries omitted |
| PairBalance | groupId, lowUserId, highUserId, currency, signedBalance, version | Unique canonical pair/group/currency; transactionally maintained projection, ledger is authority |
| IdempotencyRecord | actorId, operation, key, requestHash, resourceId, resultCode, createdAt | Unique actor/operation/key; persisted atomically with successful write; different payload for same key conflicts |
| AuditRecord | id, actorId, action, objectId, at, correlationId, details | Security/configuration/financial actions; excludes passwords, tokens and receipt bytes |
| Report | query specification and result DTO, not durable entity | Filters, opening/closing balance, expense/payment summaries; read-only projection |

Use bounded text and server request limits; proposed description maximum 2,000 characters. All decimal persistence precision/range limits must be explicit and reject overflow before writes (proposed NUMERIC(24,6) money supports configured scales up to 6; currency allowlist rejects other scales). Percentages use bounded exact decimals (proposed at most 6 fractional digits). These are validation defaults subject to review, not customer requests.

## Allocation Invariants (FR-003/004)

Use research R3's exact largest-remainder algorithm. Payer may be absent from participants. Participants and payer must belong to the group at submission; membership snapshots preserve historic meaning. Shares become immutable at submission. No implicit normalization of percentages, no negative percentage, no duplicate participant, no unallocated amount. Reject unsupported currency and invalid amount precision. A group's configuration cannot reinterpret posted amounts.

## Expense and Approval Transitions (FR-007)

`submit → PENDING`; approval of the current step leaves expense PENDING until the final level, then `PENDING → APPROVED`. Rejection of current level yields `PENDING → REJECTED`. A later level cannot decide early. Approval/rejection by wrong reviewer, self-review, stale version or inactive member fails without effects. No `REJECTED → APPROVED` or mutation of an approved expense. A rejected submission may be replaced by a new submission referencing the original. Replacement does not erase prior outcomes or notifications.

Within one transaction lock expense, re-read authorization/current step/version, write decision/audit and, only on final approval, all ledger lines and pair projection changes. A unique expense-source posting key plus state lock prevents retry duplication. Acquire multiple pair locks in canonical sorted order. Ensure rows exist using conflict-safe insertion before locking; retry deadlock/serialization failures with a bounded policy. Concurrent approve/reject yields one transition, the loser sees conflict.

## Pair Ledger Sign Convention (FR-008/009)

For canonical pair (low UUID, high UUID), positive balance means low owes high; negative means high owes low. For an approved share s, participant owes payer s: post +s if participant is low, otherwise -s. Skip payer's own share. No third-party debt simplification. Group balances are separately scoped; personal pair summary is a sum across authorized retained debts per currency, not automatic cross-group settlement.

Payment from low to high posts -amount; high to low posts +amount. Reversal posts the exact inverse of the original payment with a distinct unique source. Expense and payment date affect report attribution; live outstanding debt includes all accepted postings regardless of entered business date. No future-date scheduling is implied.

Example: Alice UUID sorts before Bob. Bob pays USD 10, split equally Alice/Bob: pair +5. Alice pays Bob 2: pair +3. Reverse payment: pair +5. If Alice alone is payer and excluded from participants Bob owes the full share, yielding a negative canonical balance. For every pair projection, balance equals ledger SUM(signedAmount); across users each debt has equal/opposite views and net totals sum to zero within currency.

Lock the pair row before checking payment direction and amount and appending payment/posting/projection. Two simultaneous payments that together exceed debt cannot both succeed. Reversal locks the same pair and original payment, checks unique reversal, then restores the exact debt effect without an overpayment check. All financial writes, state changes and idempotency records roll back together on failure.

## Membership and Authorization

Active members can read current group expense history/receipts; only managers manage membership/policies. Personal account access never exposes credentials or other private profiles. Removed members lose general group access and new notifications; they retain access to their own balance/payment history and may settle retained debt through restricted personal endpoints. Historical rows are never deleted solely by removal. The exact removed-member visibility rule is D2/D4, pending product confirmation.

Policy changes affect new submissions only; reviewer removal does not auto-approve or delete pending expenses. Reassignment is explicit/audited. Invitation acceptance and membership removal lock appropriate records. Owner succession is required before removing the last owner.

## Reports and Consistency

Use one consistent database snapshot for report components to avoid mismatched totals. Include opening debt before start date, in-range postings and closing debt through end date. Expense status totals are explicitly labeled; only approved entries enter financial totals. Summaries and notifications cannot bypass record-level access checks. Authorization after logout/removal must be re-evaluated even for previously delivered IDs. No mutable UI cache is authoritative.

## Diagram Mapping and Individual Sharing

The class diagram uses the entity names in this table: ExpenseShare represents each split allocation; SplitCalculator is a domain responsibility rather than a persisted table; ApprovalPolicy/PolicyStep configure workflows and ApprovalStep is the submitted snapshot. PairBalance is the pairwise balance projection, not a second authoritative financial history. Classes and associations express domain relationships; a database foreign key does not imply permission to read a record. Supporting identity/audit/transport records are omitted from the focused class diagram where they obscure required business concepts.

The selected schema represents individual sharing as a two-person Group with Membership records, reusing the same expenses, approvals and settlement rules. Standalone expenses without a group are not modeled; whether that separate UX is required remains an explicit unresolved interpretation of the brief.
