# ADR-001: Select Architecture 1, the Modular Monolith

**Status:** Approved architecture selection by the project owner for CIS 285 Lab 7  
**Date:** 2026-11-04  
**Selected:** [Spec Kit modular monolith](plan.md)  
**Compared:** [Modular service-oriented alternative](alternative-architecture.md), retained and not selected

## Context and Authority

SplitSmart needs accounts, groups, exact expense allocation, receipts, notifications, single/multiple review levels, pairwise balances, payment history and reports. The [customer brief](../../UserRequirement.md) remains authoritative. FR-001–FR-012 and DEC-001–DEC-008 in [spec.md](spec.md) are unchanged. PLAN-001 approves Swing-first sequencing, with primary web, Android and iOS still required later. This decision selects implementation structure; it does not approve further product-policy defaults, waive requirements or claim completed delivery.

## Decision

Use Java 21 and Maven, a thin Java Swing Phase 1 client, one shared versioned HTTP backend, and PostgreSQL. Keep focused presentation, application/domain and adapter modules. The backend owns financial rules and authorization; the desktop never connects directly to PostgreSQL. All authoritative financial writes and their balance effects share a database transaction. Retain JUnit 5 verification, BigDecimal monetary arithmetic and maintained PlantUML sources.

Future primary web, Android and iOS clients consume the same backend contracts and require separate delivery/acceptance evidence. Their exact toolchains and support matrices remain future-phase decisions. Swing does not satisfy FR-012.

## Comparison and Rationale

| Criterion | Selected modular monolith | Service-oriented alternative | Selection reason |
| --- | --- | --- | --- |
| Lab implementation/operation | One backend artifact, database and migration sequence | Six business services, gateway, broker and privately owned stores | Lower setup and debugging burden for the lab's proposed scale |
| Finance correctness | Approval, ledger, balances and payments share local transactions | Alternative also keeps these in Finance, preserving its local transaction | Neither inherently guarantees correctness; the monolith needs fewer distributed workflows around it |
| Receipts and submission | Image metadata/content, expense and notifications can commit together | Receipt reservations, confirmation/retry and cleanup coordination | Prefer the simpler atomic lifecycle |
| Notifications/reports | Durable notification rows and snapshot queries in shared PostgreSQL | Consumer deduplication, replay and projection freshness handling | Avoid event-delivery and stale-read complexity without a demonstrated need |
| Modularity | In-process responsibilities and enforced dependency direction | Business capabilities isolated through network contracts/data ownership | In-process boundaries are sufficient initially and cheaper to evolve |
| Scaling/failure isolation | Backend deployed/scaled as a unit | Services can scale/release independently | Accept reduced independence; no measured load currently justifies added infrastructure |
| Future platforms | Shared HTTP contract supports additional clients | Same benefit through gateway APIs | Platform support does not require distributed business services |

These are design tradeoffs, not benchmark results or a claim that SOA is unsuitable in general. The existing plan's user/latency/load values are proposed engineering targets, not approved customer commitments.

## Consequences and Deployment

A lab setup needs the Swing client, shared Java backend, PostgreSQL and a local mail sink. Outside local development use HTTPS, private database access and deployment-managed secrets. JDBC transactions include financial records, idempotency results and audit changes; database uniqueness and locks must prevent duplicate posting and concurrent overpayment. Receipt storage stays private in PostgreSQL, rather than adopting the alternative's separate Receipt service/store.

The server is one deployment unit: faults, resource pressure and releases can affect multiple features together. Reporting/image workloads need monitoring and bounded queries/uploads. A shared schema requires disciplined module responsibilities to avoid an all-purpose service or UI-owned rules. Future server replication must preserve shared session state, idempotency and database serialization; extra server replicas do not remove database bottlenecks.

Reconsider service extraction if measurements demonstrate independent scaling needs, teams need independent releases, or failure-isolation requirements justify distributed recovery costs. A later decision must define contracts, data migration and ownership explicitly. No service extraction or infrastructure deployment is approved here.

## Approval Boundary and Verification

Architecture selection and PLAN-001 sequencing are approved. D1–D5 currency/rounding, receipt/access/retention, reviewer, reversal and report details remain provisional product-policy defaults. Individual sharing through two-person groups is the current design interpretation; standalone direct-expense UX requires confirmation. No acceptance criterion is altered to resolve these questions silently.

See [architecture.md](architecture.md), [class diagram](diagrams/class-diagram.puml), [activity diagram](diagrams/expense-activity.puml), [quickstart.md](quickstart.md) and the [consolidation report](consolidation-report.md). Human review and passing implementation evidence remain required before merge/release. This record authorizes no financial activity, application implementation, deployment, commit or push.
