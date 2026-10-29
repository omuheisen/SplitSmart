# SplitSmart Constitution

**Version:** 1.0.0  
**Adopted:** 2026-10-29

## Purpose and Authority

This constitution governs engineering decisions for SplitSmart. The original customer request is recorded in [`UserRequirement.md`](../../UserRequirement.md) and remains the source of truth for customer-visible needs and acceptance criteria.

The principles below define implementation choices, not new customer requirements. An implementation decision must not be presented as a customer request or used to silently narrow, replace, or waive one. When an implementation decision conflicts with a customer requirement, record the conflict, preserve traceability, and obtain an explicit product/customer decision before treating the requirement as changed.

## Principles

### 1. Java 21 and Maven Baseline

Use Java 21 as the language and runtime baseline. Use Maven as the build and dependency-management system, with reproducible builds and dependencies declared in the project configuration. Do not introduce another runtime or build system without documenting the reason and reviewing its impact.

### 2. Swing Is a Client Implementation Choice

Use Java Swing for the desktop graphical client. Keep Swing-specific types and event handling at the presentation boundary. Swing is an implementation decision, not a change to the requested product platforms: the customer brief calls for a web-based product and Android and iOS apps. A Swing client alone does not satisfy those requirements. Track platform coverage and any proposed scope change explicitly; do not claim cross-platform completion without evidence for each required platform.

### 3. Separate Presentation from Business Logic

Keep business rules independent of Swing components and UI event handlers. Model expense creation and approval, participant shares, balances, payments, and reporting in testable application/domain code. The GUI should gather input, invoke application behavior, and present results rather than calculate or own business rules. Use clear boundaries so additional clients can reuse the same behavior where the architecture permits.

### 4. Object-Oriented Design with Explicit Responsibilities

Use cohesive classes and interfaces with explicit responsibilities, encapsulated state, and dependencies that are straightforward to test. Prefer composition and small, focused abstractions. Avoid unnecessary inheritance, global mutable state, and classes that combine unrelated presentation, persistence, and business responsibilities. Design complexity must be justified by current requirements.

### 5. Exact Decimal Arithmetic for Money

Represent monetary amounts and calculated shares with `BigDecimal`; never use `float` or `double` for financial values. Define currency, scale, rounding mode, and remainder-allocation behavior at the relevant business boundary. Apply rounding consistently so participant shares reconcile exactly to the expense total, and cover edge cases with tests.

### 6. JUnit 5 Verification

Use JUnit 5 for automated tests. Test domain and application behavior independently from Swing, including equal and percentage splits, rounding and remainder allocation, approval effects, balance changes, and payment settlement. Add presentation-level tests where they provide meaningful coverage, without making business correctness depend on GUI automation.

### 7. PlantUML as Maintained Design Documentation

Use PlantUML for diagrams when a diagram clarifies system structure, interactions, or workflows. Keep diagram sources under version control and update them alongside relevant architectural changes. Diagrams describe the implemented or deliberately planned design; they do not replace requirements, code, or tests.

### 8. Trace Requirements Through Delivery

Give each customer requirement a stable identifier when decomposing [`UserRequirement.md`](../../UserRequirement.md) into specifications. Maintain links from requirements to design decisions, implementation areas, and verification evidence. Mark requirements as satisfied only when their acceptance criteria have been demonstrated, and report deferred, unsupported, or ambiguous requirements explicitly. Keep implementation decisions separately labeled and traceable to their rationale.

### 9. Human Review of AI-Assisted Work

AI-generated code, tests, diagrams, documentation, and analyses are drafts, not authoritative decisions. A human contributor must review and understand AI-assisted changes, verify factual claims and requirement alignment, run relevant checks, and approve the result before merge or release. AI output must not independently approve expenses, change balances, alter customer requirements, or authorize deployment.

## Change and Compliance

Changes to this constitution require a documented rationale and version update. Any work that appears to violate a principle must identify the affected principle and explain the exception and its impact in the relevant specification or review. Exceptions do not amend customer requirements; those require an explicit customer/product decision and an update to the appropriate requirements record.
