# CIS 285 Lab 7 — SplitSmart Documentation Consolidation

**Date:** 2026-11-04  
**Approved architecture:** Architecture 1, the [Spec Kit modular monolith](plan.md), recorded in [ADR-001](architecture-decision.md)  
**Outcome:** Documentation consolidated; no application implementation, commit, push or deployment performed

## Reviewed Inputs and Authority

Reviewed [UserRequirement.md](../../UserRequirement.md), [requirements.md](../../requirements.md), [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md) and the [alternative architecture](alternative-architecture.md). Also checked the constitution, HTTP contract, quickstart and existing PlantUML sources to keep related artifacts aligned.

The original customer brief remains byte-for-byte unchanged. The feature specification's confirmed DEC-001–DEC-008 decision table and complete acceptance-criteria section are also unchanged from the pre-consolidation snapshot. PLAN-001 still approves Swing-first delivery only; ADR-001 approves Architecture 1. No new policy confirmation, requirement waiver or release acceptance is implied.

## Updates and Resolved Conflicts

- Recorded why the modular monolith was selected: simpler lab deployment, centralized transactions, atomic receipt/submission/notification storage and fewer distributed recovery mechanisms. Acknowledged reduced independent scaling/failure isolation versus SOA.
- Aligned requirements/specification with the selected Phase 1 scope: FR-001–FR-011 on desktop, including single/multiple review levels and date-filtered reporting. Replaced stale one-step/basic-summary-only proposals that conflicted with plan.md.
- Clarified that Identity/Group/Expense/Payment application service names in the selected plan mean in-process responsibilities. The alternative's six independent services, gateway, broker, receipt reservations and report projections are not selected components.
- Kept the alternative document, including its substantive design/comparison, and updated its status to retained/not selected.
- Added a focused class diagram and an actual activity diagram. Kept the original expense state machine as a complementary artifact rather than presenting it as an activity diagram.
- Retained Java 21, Maven, Swing, JUnit 5, PlantUML, BigDecimal, the shared HTTP backend, PostgreSQL, private receipt data and required future primary web/Android/iOS clients.

## Requirement Traceability

All requirements are **planned, not implemented or demonstrated**. V1–V12 refer to future validation scenarios in [quickstart.md](quickstart.md), not executed test results. [contracts/api.md](contracts/api.md) defines intended external behavior; [data-model.md](data-model.md) defines entities/invariants.

| Requirement | Selected design / diagram trace | Intended evidence and remaining qualification |
| --- | --- | --- |
| FR-001 accounts | Identity use cases; User; HTTP session/recovery contract | V1 sign-in, recovery, access isolation; security supporting types detailed outside focused class diagram |
| FR-002 groups | Group, Membership; group/membership use cases | V2 manager authority, history retention and removal authorization |
| FR-003 expense fields/payer | Expense, separate submitter/payer links; activity input/validation | V3 required fields, positive precision-valid amount, payer excluded from participants |
| FR-004 allocations | SplitMethod, SplitCalculator, ExpenseShare; activity exact-allocation step | V4 exact 100%, deterministic reconciliation; D1 specific rounding/order provisional |
| FR-005 receipt | Optional Receipt association; submission validation and atomic storage | V5 valid/invalid image and access checks; D2 formats/limits/retention provisional |
| FR-006 notifications | Notification and recipient link; activity insertion and post-commit polling | V6 one row per other member at submission, no duplicate or non-member disclosure |
| FR-007 approvals | ApprovalPolicy, PolicyStep, ApprovalStep; rejection/intermediate/final activity branches | V7 one/multiple levels, stale/conflicting requests and no early posting; D3 reviewer rules provisional |
| FR-008 balances | LedgerEntry, PairBalance, canonical user pair; final approval transaction | V8 pending/rejected exclusion, exact debt and reconciliation |
| FR-009 payments | Payment, PaymentReversal, ledger/projection links | V9 partial/full payments, excess rejection, concurrency and single inverse reversal; D4 authorization provisional |
| FR-010 summaries | Report queries over a consistent PostgreSQL snapshot | V10 authorized expense/balance/payment totals; reporting is a query responsibility, not a second financial authority |
| FR-011 custom reports | Date/group/type/status filters and opening/movement/closing balances | V11 date boundaries, invalid range and currency separation; D5 further parameters/formats provisional |
| FR-012 platforms | Architecture diagram shows Swing plus required future primary web, Android and iOS clients | V12 separate delivered client/platform acceptance in future phases; never satisfied by Swing alone |

The full functional inventory is preserved. No missing FR identifier or removed original customer capability was found. The individual-sharing interpretation below remains a possible UX coverage gap that must be confirmed before claiming full fulfillment.

## Confirmed Clarification Traceability

| Decision | Preserved meaning | Selected design anchor |
| --- | --- | --- |
| DEC-001 | Payer distinct from participants, optionally included | Expense.payer and participant ExpenseShare associations |
| DEC-002 | Manager-controlled invitations/removal, preserved history | Membership soft removal and group authorization |
| DEC-003 | Minor-unit shares, deterministic remainder reconciliation | SplitCalculator / research D1; exact algorithm remains provisional |
| DEC-004 | Positive currency-precision expense/payment amounts | Submission validation and locked payment boundary |
| DEC-005 | Percentages total exactly 100%, no normalization | Allocation invariants and validation failure branch |
| DEC-006 | Email/password plus recovery | Identity use cases, session/recovery HTTP contract |
| DEC-007 | In-app notification to other members at submission | Notification insert in submission transaction, authorized retrieval after commit |
| DEC-008 | Partial payment allowed, overpayment rejected, reversal correction | Payment, PaymentReversal, canonical-pair locks and immutable ledger |

NFR-001–NFR-009 remain present in requirements/specification: authorization, Java/Maven, Swing separation, OO responsibilities, exact money, JUnit 5, PlantUML, traceability and human review. Their acceptance evidence is planned rather than executed.

## Unresolved Issues and Approval Boundaries

| ID | Issue | Current treatment / resolution needed |
| --- | --- | --- |
| I1 | Individual sharing versus standalone direct expenses | Model supports two-person groups. Confirm whether a distinct direct-expense workflow without group setup is required; no waiver inferred. |
| I2 | Currency set and exact rounding/remainder order | D1 proposes configured currency scales and floor/largest remainder with stable UUID ties. Confirm allowlist and policy; fixture currencies are not the full support list. |
| I3 | Reviewer/self-review/reassignment and rejection correction | D3 proposes ordered named reviewers, no self-review, audited reassignment and new-submission correction. Single/multiple approval capability is retained; precise policy needs confirmation. |
| I4 | Receipt formats, limits, retention and removed-member visibility | D2 proposes private JPEG/PNG limits and history retention; confirm access and retention before release. |
| I5 | Payment reversal authority and reconciliation treatment | D4 proposes original-sender full reversal once; confirm handling of reconciled or otherwise acted-upon payments. No external settlement integration is claimed. |
| I6 | Report parameters, formats and date semantics | D5 proposes inclusive business dates and on-screen filters. Confirm any additional parameters/exports and period-close expectations; no cross-currency total assumed. |
| I7 | OS/browser/device support, future phase details and measured capacity | Swing-first is approved. Detailed matrices, future client toolchains/phase ordering and numerical targets require review/measurement; primary web/Android/iOS remain mandatory. |
| I8 | Optional account lifecycle/security additions | MFA/account deletion remain unspecified, not silently added or used to narrow existing login/recovery requirements. |

These are openly tracked policy/delivery questions, not conflicting newly approved requirements. Product confirmation and implementation evidence remain necessary. Architecture selection resolves structural choice but does not make D1–D5 confirmed customer decisions.

## Diagram and Consistency Validation

- **Preservation:** SHA-256 comparison verifies the original brief is unchanged. Exact-text comparison verifies the specification's confirmed decision table and acceptance section are preserved. The alternative remains present; only status/selection wording changed.
- **Inventory:** FR-001–FR-012 and DEC-001–DEC-008 appear in both requirements/specification and the traceability tables; NFR-001–NFR-009 remain present. No stale one-step-only/custom-report-deferral assertion remains in the current selected scope.
- **Class coverage:** Explicit User, Group, Membership, Expense, ExpenseShare/SplitCalculator, ApprovalPolicy/PolicyStep/ApprovalStep, Payment/PaymentReversal and PairBalance/LedgerEntry classes and relationships cover all eight requested concepts. Receipt and Notification are also included.
- **Activity coverage:** Explicit paths cover submission, validation rejection, PENDING persistence, optional receipt, submission notifications, reviewer validation, intermediate approval, rejection, final approval, ledger/balance updates and rollback. Balance changes occur only on final approval; notifications occur on submission as required by DEC-007.
- **Structure and links:** Local Markdown link targets, PlantUML start/end markers, balanced braces and activity branch/loop delimiters were checked. Whitespace checks passed on tracked diffs and the changed documentation inventory. Documentation cross-checks distinguish the selected shared database from alternative private stores and retain future platform obligations.
- **Limits:** No PlantUML executable was available, so diagrams were not compiled/rendered; basic source checks and semantic review do not establish renderer acceptance or visual layout quality. No Maven/JUnit/runtime tests ran because no application implementation was produced. External reference websites were not revalidated as part of this documentation consolidation.

## Complete File Inventory for This Consolidation

Created:

1. [architecture-decision.md](architecture-decision.md) — approved ADR-001, comparison/rationale and consequences.
2. [architecture.md](architecture.md) — consolidated boundaries, transactions, flows, deployment and diagram index.
3. [diagrams/class-diagram.puml](diagrams/class-diagram.puml) — required domain classes and associations.
4. [diagrams/expense-activity.puml](diagrams/expense-activity.puml) — submission/review activity and failure paths.
5. [consolidation-report.md](consolidation-report.md) — this report, traceability, issue register and validation limits.

Updated:

1. [requirements.md](../../requirements.md) — selected scope, architecture decision links and confirmed decision summary.
2. [spec.md](spec.md) — selected architecture/coverage labels, superseded subset removal and individual-sharing question; confirmed decisions and acceptance text preserved.
3. [plan.md](plan.md) — approval status, consolidated document/diagram index and terminology/scope alignment.
4. [research.md](research.md) — approved structure versus provisional product-policy status.
5. [data-model.md](data-model.md) — shared ownership, class mapping and individual-sharing interpretation.
6. [alternative-architecture.md](alternative-architecture.md) — retained/not-selected status and ADR cross-reference.
7. [contracts/api.md](contracts/api.md) — selected-architecture context; endpoint behavior unchanged.
8. [quickstart.md](quickstart.md) — selected-architecture context; future validation remains explicitly unexecuted.
9. [diagrams/architecture.puml](diagrams/architecture.puml) — explicit single-backend deployment and future client boundaries.
10. [diagrams/expense-workflow.puml](diagrams/expense-workflow.puml) — state-machine identity and provisional reviewer-policy labeling.

No files were deleted. Pre-existing unrelated files, including `specs/.DS_Store`, were left unchanged. `UserRequirement.md` and the constitution were not modified. No application code or infrastructure configuration was generated; no commit or push was performed.
