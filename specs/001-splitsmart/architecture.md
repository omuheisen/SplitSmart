# Selected SplitSmart Architecture

**Architecture 1 — modular monolith, approved under [ADR-001](architecture-decision.md).** This document elaborates [plan.md](plan.md) without replacing the customer brief or confirming draft policy defaults. The [alternative](alternative-architecture.md) is retained for comparison.

## Structure and Responsibilities

| Boundary | Planned responsibilities | Dependency rule |
| --- | --- | --- |
| Swing desktop | Views/presenters, validation feedback, navigation, API calls and notification refresh | Uses transport contracts only; no SQL or financial-rule ownership; network/image work off EDT |
| HTTP/security adapters | Authentication, request parsing, authorization context, DTO mapping, errors and idempotency boundary | Invoke application use cases; never trust a client-calculated share or approval state |
| Application | Identity, group, expense, approval, payment, balance, notification and report use cases; transaction orchestration and persistence/mail ports | Depends on domain; application “services” are in-process classes, not independently deployed services |
| Domain | Exact money, SplitCalculator, approval state transitions, immutable shares and financial invariants | No Swing, HTTP, JDBC or framework types |
| Server adapters | JDBC repositories, transaction composition, migrations, private receipt persistence, security/session and SMTP integration | Implement application ports; all authoritative business data is in shared PostgreSQL |
| Contract module | Versioned decimal-safe HTTP request/response types | No persistence entities, credentials or UI types leaked to clients |

The planned Maven modules remain `splitsmart-domain`, `splitsmart-application`, `splitsmart-contracts`, `splitsmart-server` and `splitsmart-desktop`. Only the server is the backend deployable. PostgreSQL and SMTP are infrastructure; there is no gateway/broker or independently deployed Identity/Group/Finance/Receipt/Notification/Reporting service in the selected design. No cross-service saga or eventual report projection from the alternative is adopted.

## Data and Transaction Boundaries

[data-model.md](data-model.md) defines canonical names and relationships. Each Group has Membership records; removal preserves history. Expense has a separate submitter, payer and participant ExpenseShare rows. Equal/percentage allocations reconcile to the total through exact BigDecimal arithmetic. ApprovalPolicy/PolicyStep configure one or multiple ordered levels; each submission snapshots ApprovalStep assignments. Reviewer rules remain provisional D3.

Pending/rejected expenses do not affect debt. Final approval changes state, appends unique-source LedgerEntry rows and updates PairBalance projections in one transaction. Payment validation reads current debt under the pair lock; a successful payment and its ledger/balance effects commit together. PaymentReversal is a distinct retained record with an inverse posting. Retries use idempotency records and source uniqueness rather than assuming a network timeout means failure.

Receipt metadata/private bytes and submission notification rows commit with the pending expense. Persist notifications for each other active group member at submission, not after final approval. UI delivery is an authorized poll after commit; it is not a distributed financial transaction. Reports use consistent PostgreSQL snapshots and separate approved financial totals from pending/rejected activity. Date-range and additional filter defaults are documented under D5.

## Expense Flow

1. Signed-in user submits amount, date, description, payer, participants, equal/percentage method and optional receipt through HTTP.
2. Backend validates current membership/permissions, required fields, positive currency-precision amounts, participant selection, exact percentages, image content/limits and approval-policy eligibility. Invalid submissions return field errors without persisted expense/notification/balance effects.
3. Successful submission commits PENDING expense, shares, receipt if present, review snapshot and deduplicated in-app notification rows. Balance remains unchanged.
4. Assigned reviewer chooses approval or rejection. Backend revalidates reviewer eligibility, current step and version under transaction locks. Invalid/stale decisions have no effects. Intermediate approval keeps the expense pending; rejection records REJECTED without posting.
5. Final approval atomically commits APPROVED state, ledger and pair balances exactly once. A transaction failure rolls back the decision and financial changes together. Authoritative responses and subsequent reports read committed state.

Approved records are immutable. Correction of a rejected submission creates a new submission referencing the original; membership removal/reviewer reassignment does not automatically approve anything. Provisional policy details remain reviewable and are not additional confirmed customer requirements.

## Diagrams and Requirement Coverage

| Diagram | Purpose and coverage |
| --- | --- |
| [architecture.puml](diagrams/architecture.puml) | Deployment/module boundary, shared backend/PostgreSQL and required future clients |
| [class-diagram.puml](diagrams/class-diagram.puml) | User, Group, Membership, Expense, ExpenseShare/SplitCalculator, ApprovalPolicy/PolicyStep/ApprovalStep, Payment/PaymentReversal, LedgerEntry/PairBalance, Receipt and Notification |
| [expense-activity.puml](diagrams/expense-activity.puml) | Submission, validation failure, atomic pending creation/notifications, review/rejection/intermediate approval, final posting/balance update and rollback |
| [expense-workflow.puml](diagrams/expense-workflow.puml) | Complementary state machine; explicitly not the activity diagram |

The class diagram is a focused conceptual model, not a database schema or generated application code. Monetary fields are BigDecimal; relationship multiplicities preserve separate payer/participant semantics. Supporting security/audit/idempotency types remain in the data model. The activity diagram shows business orchestration, not implementation bodies. Class/activity requirement mapping and unresolved issues are recorded in [consolidation-report.md](consolidation-report.md).

## Deployment and Platform Coverage

Phase 1 uses Java 21/Maven with Swing clients connecting to one shared HTTP backend and PostgreSQL. Keep database credentials server-side; use HTTPS outside local development and private receipt endpoints with current authorization. Retain session/recovery semantics and JUnit 5 domain, HTTP/security and PostgreSQL concurrency validation from research/quickstart. Proposed benchmark and desktop support targets still need measurement and review.

Primary web, Android and iOS are mandatory future clients under FR-012. They reuse HTTP business contracts but require actual client implementation, authentication integration, support matrices and acceptance evidence. Future phase order beyond Swing-first remains a recommendation, not a newly approved schedule. A Swing executable alone never establishes full product completion.

Individual sharing currently uses two-person groups; confirmation of a distinct direct-expense experience remains open. No feature or platform requirement is removed to simplify delivery.
