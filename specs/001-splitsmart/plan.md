# Implementation Plan: SplitSmart

**Feature**: `001-splitsmart` | **Git branch**: `main` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Status**: Architecture 1 selected by the project owner for CIS 285 Lab 7 under ADR-001; detailed policy defaults remain reviewable. No application code generated. No functional requirement is implemented or verified by these documents.

## Summary

[ADR-001](architecture-decision.md) records approval of this modular monolith over the retained [service-oriented alternative](alternative-architecture.md). See [architecture documentation](architecture.md) and the [consolidation report](consolidation-report.md) for the consolidated design and remaining issues. This selection does not independently approve draft product-policy defaults.

PLAN-001 is the project owner's approved sequencing decision: Phase 1 delivers a Java 21 Swing desktop MVP using Maven; later phases deliver the primary web product and Android/iOS apps. Full product scope remains FR-001–FR-012 as defined in the unchanged customer brief. Swing alone never satisfies FR-012.

Use a modular Java application with a shared HTTP service, PostgreSQL, and a thin Swing client. The server owns authentication, authorization, transactions, allocation, approvals and balances. Independent desktop users connect to the same service; they do not exchange local databases. Future clients reuse versioned service contracts without porting Swing code. See [research](research.md), [data model](data-model.md), [contracts](contracts/api.md), [validation guide](quickstart.md), and [architecture diagram](diagrams/architecture.puml).

## Technical Context

**Language/Version**: Java 21; Maven reactor for all Phase 1 Java modules.

**Primary Dependencies**: JDK Swing and HttpClient; Spring Boot MVC, Security, JDBC and transaction management; PostgreSQL JDBC driver; Flyway migrations; Jackson decimal-safe DTO serialization. Pin compatible versions and plugins in the implementation parent POM; explicitly retain JUnit Jupiter 5 and verify compatibility rather than accepting a framework BOM's test major version implicitly.

**Storage**: Shared PostgreSQL database, exact NUMERIC monetary fields; private receipt bytes in a separate database table for atomic upload/submission, with bounded size. No filesystem paths or public receipt URLs. SMTP adapter for recovery email; development mail sink. No payment processor integration: record settlements only.

**Testing**: JUnit 5 domain/application unit tests; server integration tests against disposable PostgreSQL; HTTP contract/authorization tests; focused Swing presenter/EDT tests plus manual desktop smoke checks. Maven Surefire unit tests and Failsafe integration tests.

**Target Platform**: Phase 1 Java 21 desktop environments on Windows, macOS and Linux with a shared Java service/PostgreSQL deployment. These are proposed engineering validation targets, not a customer-approved OS matrix. Phase 2 primary web; Phase 3 Android and iOS (ordering within future phases is a planning recommendation). Specific supported browser/mobile versions are release decisions for those phases.

**Project Type**: Networked desktop client plus modular monolith service. Domain/application boundaries independent of Swing, HTTP and SQL frameworks.

**Performance Goals**: Proposed benchmark: 100 registered users, 20 concurrent clients, 50 members/group and 10,000 approved expenses/group; p95 under 1 second for paginated balances/expense lists and under 2 seconds for non-upload commands on a documented local reference environment. These are engineering targets to measure, not customer commitments or measured results.

**Constraints**: BigDecimal money, currency-specific precision, deterministic remainder allocation, exact 100% percentage totals, atomic exactly-once posting effects, transactionally enforced overpayment prevention, authorization on every operation, network I/O off Swing EDT. Phase 1 requires connectivity; no offline financial writes or device-local source of truth.

**Scale/Scope**: Phase 1 plans FR-001–FR-011 on desktop, including sequential multi-level approvals and basic configurable date-range reports. This is a conservative design coverage decision: PLAN-001 did not approve dropping those features. No export formats, debt simplification, currency conversion, MFA or account deletion inferred as requirements.

## Constitution Check

| Principle | Before Phase 0 | After Phase 1 design |
| --- | --- | --- |
| 1. Java 21 / Maven | PASS: explicit baseline | PASS: Java-only modules, Maven build; no extra runtime/build introduced |
| 2. Swing and platforms | PASS: PLAN-001 approves phased sequencing | PASS: Swing client planned; FR-012 mandatory and unfulfilled until future platform acceptance |
| 3. UI separation | PASS: server owns business behavior | PASS: Swing depends on transport DTOs; domain/application do not import UI/framework types |
| 4. Focused OO design | PASS: cohesive components | PASS: split, approval, balance, payment and report responsibilities separated |
| 5. Exact money | PASS: decimal boundary required | PASS: decimal strings, currency scale, floor/largest-remainder rule and examples documented |
| 6. JUnit 5 | PASS: independent verification planned | PASS: requirements mapped to meaningful unit/integration/acceptance scenarios |
| 7. PlantUML | PASS: diagrams planned | PASS: architecture and expense workflow sources versioned |
| 8. Traceability | PASS: all FRs retained | PASS: matrix below; nothing falsely marked satisfied |
| 9. Human review | PASS: drafting only | PASS: human review before merge/release and before defaults become accepted product policy |

The delivery-scope gate is resolved by PLAN-001. No constitutional exceptions. Technical research questions are resolved in research.md. Product-policy defaults are explicitly provisional design decisions, not unresolved technical dependencies or newly confirmed customer requirements. Their confirmation is a release acceptance gate, not a reason to discard the architecture. No financial or external production actions are authorized by planning.

## Delivery Scope and Traceability

Every row remains **planned, not implemented**. Verification names below are intended evidence, not executed tests.

| Requirement | Phase 1 implementation area | Intended verification / full-scope status |
| --- | --- | --- |
| FR-001 accounts | Identity service, Swing sign-in/recovery, SMTP adapter | V1 registration/login/reset, isolation and session revocation |
| FR-002 groups | Group service, membership/invitations | V2 manager-only changes; removal preserves history |
| FR-003 expense fields/payer | Expense service, submission presenter | V3 field validation and payer outside participant set |
| FR-004 allocations | SplitCalculator, immutable shares | V4 equal/percentage/remainder precision tests |
| FR-005 receipt | Authorized private receipt repository/viewer | V5 optional JPEG/PNG, size rejection and access denial |
| FR-006 notifications | Transactional notification rows; Swing polling | V6 all other active members once, no non-members |
| FR-007 approvals | Policy snapshot, ordered review steps | V7 single/multiple levels, rejection, retry/race safety |
| FR-008 pair balances | Immutable ledger, pair projection | V8 exact sums, no pending/rejected effects, reconciliation |
| FR-009 settlements | Payment/reversal service | V9 partial/excess/concurrent payments and reversal replay |
| FR-010 summaries | Report queries/presenter | V10 authorized expense/payment/balance summaries |
| FR-011 custom reports | Date/group/type/status filters, on-screen output | V11 inclusive dates, invalid range, opening/closing balances; additional parameters/export remain subject to product confirmation |
| FR-012 platforms | Phase 1 Swing only; NOT satisfied | V12 future primary web + Android + iOS client acceptance; all remain required |

Earlier one-step/basic-summary-only proposals are superseded by this selected Phase 1 scope; requirements.md and spec.md now reflect single/multiple approvals and date-filtered reporting. Individual sharing uses two-person groups in this design; standalone direct-expense UX remains a product question. Future clients must reproduce all applicable business acceptance scenarios against the same server. Future technology choices and any additional runtime/build impact will be reviewed under constitution principle 1.

## Project Structure

Documentation generated now:

```text
specs/001-splitsmart/
├── spec.md
├── plan.md
├── research.md
├── architecture-decision.md
├── architecture.md
├── consolidation-report.md
├── alternative-architecture.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
└── diagrams/
    ├── architecture.puml
    ├── expense-workflow.puml
    ├── class-diagram.puml
    └── expense-activity.puml
```

Planned implementation layout (not created by this command):

```text
pom.xml
splitsmart-domain/       # money, split policy, expense/review state, ledger values
splitsmart-application/  # use cases and repository/session/clock/mail ports
splitsmart-contracts/    # versioned transport DTOs; no persistence/UI types
splitsmart-server/       # HTTP, security, JDBC adapters, migrations, SMTP
splitsmart-desktop/      # Swing views/presenters, HttpClient transport
```

Each module uses standard `src/main/java`, `src/test/java`; server resources include migrations; integration fixtures live in server tests. Dependency direction: application → domain; server → application/domain/contracts; desktop → contracts only. The domain is framework-free. Repository ports cover aggregate/transaction needs, not generic CRUD wrappers. This separation is justified by shared authority and multiple required clients, without deploying microservices.

## Verification and Next Workflow

Follow quickstart.md when application implementation exists. For this planning change validate document links, preserved requirements, source diagrams, and whitespace. No Maven build or runtime claim is possible yet. Next use `/speckit-tasks` to derive implementation tasks; this plan command ends at design and does not create tasks.md or source code.

Extension hook checks before/after planning: `.specify/extensions.yml` is absent; no hooks dispatched. Human review must examine PLAN-001 and ADR-001 traceability, provisional defaults and future platform obligations. Application service names in the matrix denote in-process responsibilities, not separate server deployments.

## Complexity Tracking

No constitution violations. The shared service/database are necessary for independent users, centralized authorization and concurrent settlements. A single-machine database per Swing client cannot meet those collaboration guarantees. Microservices, a message broker and independently deployed balance projections are unnecessary for the planned scale.
