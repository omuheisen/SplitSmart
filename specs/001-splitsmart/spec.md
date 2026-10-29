# SplitSmart Feature Specification

**Status:** Draft for product/customer review  
**Source of truth:** [`UserRequirement.md`](../../UserRequirement.md)  
**Implementation principles:** [SplitSmart Constitution](../../.specify/memory/constitution.md)

## Authority and Labels

- **Customer requirement** means a capability or platform explicitly present in `UserRequirement.md`. These requirements remain in scope regardless of the proposed MVP.
- **Derived requirement** means a testable interpretation or necessary detail inferred from a customer capability. It must not be mistaken for a separately approved customer request.
- **Implementation decision** means a technical constraint adopted by the project. It does not redefine or waive customer requirements.
- **MVP status** describes a proposed delivery subset only. An item marked deferred remains in the customer requirements inventory.

## Confirmed Product Decisions

The following decisions were confirmed during clarification and now define the corresponding acceptance criteria. These decisions resolve ambiguities in the customer request; they do not amend its feature inventory.

| Decision ID | Confirmed behavior | Affects |
| --- | --- | --- |
| DEC-001 | Record the payer separately from participants. The payer may also be a participant or may be excluded from the participant shares. | FR-003, FR-004 |
| DEC-002 | A group owner/manager controls invitations and member removal. Removing a member does not remove historical expenses or balances. | FR-002 |
| DEC-003 | Round shares to the currency's minor unit and assign any remainder deterministically. The specific rounding mode and deterministic participant ordering remain open. | FR-004, NFR-005 |
| DEC-004 | Expense and payment amounts must be positive and within the applicable currency precision; reject zero, negative, and excess fractional precision. | FR-003, FR-009 |
| DEC-005 | Percentage shares must total exactly 100%; reject other totals rather than normalizing or assigning an implicit remainder. | FR-004 |
| DEC-006 | Users register and sign in with email and password; password recovery is included. | FR-001 |
| DEC-007 | Notify other group members in-app when an expense is submitted for approval. | FR-006 |
| DEC-008 | Partial payments are allowed, but a payment cannot exceed the outstanding amount. Correct errors through a reversal record. | FR-009 |

## Actors

- **User:** A person with a SplitSmart account who views their own expenses and balances and participates in groups.
- **Group member:** A user participating in a shared group and its expenses.
- **Expense submitter:** A group member who enters an expense and its participants, split, and supporting receipt if any.
- **Expense reviewer:** A user authorized by the group’s approval workflow to approve or reject a submitted expense. Reviewer permissions and selection are open questions.
- **Payment recorder:** A user who records a payment made to settle an amount owed.
- **Report viewer:** An authenticated user who views reports and summaries for data they are authorized to access.

An individual may hold more than one actor role. The exact role and permission model requires product confirmation.

## User Scenarios

### US-001: Access a Personal Account

A person signs in to their own account and sees their own expense and balance information, without access to another user’s private account data.

### US-002: Organize a Group

A user creates a group for a shared context, manages its group details and participants, and uses the group to organize shared expenses and balances.

### US-003: Submit a Shared Expense

A group member records an expense with its amount, date, description, payer, participants, and either an equal or percentage allocation. The submitter may attach a receipt image. The expense enters the group’s review workflow before it can affect balances.

### US-004: Review an Expense

An authorized reviewer reviews a submitted expense and approves or rejects it. Only an approved expense contributes to tracked balances. The group’s configured workflow may use one or multiple approval steps.

### US-005: Learn About Group Expenses

A group member receives a notification when another group member creates an expense, according to the product’s agreed notification timing and channel.

### US-006: Check and Settle Balances

A user views amounts owed between users and records a payment made to settle an amount. The updated balances reflect the payment.

### US-007: Review Spending

A user views expense, balance, and payment summaries and can request a report for a selected date range and other agreed parameters.

### US-008: Use Supported Platforms

A user accesses the product primarily through the web and can also use an app on Android and iOS. The Java Swing MVP described below is not, by itself, fulfillment of this scenario.

## Functional Requirements Inventory

All rows below remain in scope as customer requirements unless explicitly marked derived. MVP status does not remove or amend an item.

| ID | Requirement | Origin | Proposed Java Swing MVP status |
| --- | --- | --- | --- |
| FR-001 | Each person can have an account, sign in, and access their own expense and balance information. | Customer requirement | Included |
| FR-002 | Users can create and manage groups of people to organize shared expenses and balances. A group owner/manager controls invitations and member removal; removing a member preserves historical expenses and balances. | Customer requirement; management rules confirmed | Included |
| FR-003 | Users can create expenses containing amount, date, description, and allocation method (equal or percentage). The payer is recorded separately from participants and may or may not be a participant. | Customer requirement; payer behavior confirmed | Included |
| FR-004 | An expense identifies the other users involved, and the system applies the appropriate participant allocation. | Customer requirement | Included |
| FR-005 | An expense can include an optional receipt image. | Customer requirement | Included |
| FR-006 | Other group members receive an in-app notification when an expense is submitted for approval. | Customer requirement; timing and channel confirmed | Included |
| FR-007 | Expenses can be reviewed and approved before being added to tracked expenses and affecting balances. A group can use a single review or multiple approval levels. | Customer requirement | Included with one review step proposed; configurable levels open |
| FR-008 | The system tracks the balance owed by each user to every other user, taking entered expenses into account. | Customer requirement | Included |
| FR-009 | Users can record positive payments up to the outstanding amount, including partial payments. Corrections use a reversal record, and balances reflect payments. | Customer requirement; settlement rules confirmed | Included |
| FR-010 | Users can view reports and summaries of their expenses, balances, and payments. | Customer requirement | Included as basic summaries |
| FR-011 | Users can generate custom reports with specified date ranges and other parameters. | Customer requirement | Deferred beyond basic summaries |
| FR-012 | The product is primarily web-based and also has apps that run on Android and iOS. | Customer requirement | Not fulfilled by Swing MVP; separate platform delivery required |

## Acceptance Criteria

Criteria are observable behaviors for the listed requirements. Items that depend on unresolved policy are marked as provisional and must be confirmed before being treated as final acceptance rules.

### Account and Group

**FR-001**

- Given a person registering with an email address and password, when registration succeeds, then they can sign in to their own account.
- Given a user who cannot sign in, when they use password recovery, then they can recover access through the supported recovery flow.
- Given a registered user with valid credentials, when they sign in, then they can access their account’s expenses and balances.
- Given one signed-in user, when they request another user’s private account information without authorization, then the system does not disclose that information.

**FR-002**

- Given a signed-in user, when they create a group with a name, then the group is available to organize shared expenses.
- Given a group owner/manager, when they invite or remove a member, then the membership change is reflected in subsequent group views and unauthorized users cannot manage membership.
- Given a member is removed, when historical group expenses and balances are viewed, then those records remain available to authorized users and are not deleted or recalculated solely because of removal.

### Expense Creation and Allocation

**FR-003**

- Given an authorized group member, when they submit an expense with an amount, date, description, payer, and supported split method, then the expense is recorded with those values and a review state.
- Given an expense, when the payer is selected, then the payer is recorded separately from the participants and may be included in or excluded from the participant shares.
- Given a submission missing a required field, or whose amount is zero, negative, or has more fractional digits than the currency permits, when it is submitted, then it is rejected with a field-specific explanation and is not approved or applied to balances.

**FR-004**

- Given an expense split equally among its selected participants, when the allocation is calculated, then shares are rounded to the currency's minor unit, any remainder is assigned deterministically, and shares reconcile exactly to the expense total.
- Given an expense split by percentage, when valid participant percentages are supplied, then each participant’s share follows their percentage and all shares reconcile exactly to the expense total.
- Given a percentage allocation whose total is not exactly 100%, when submitted, then it is rejected with a validation message rather than normalized or implicitly assigned.
- Given a user not selected as a participant, when the expense is allocated, then that user receives no share of that expense.

**FR-005**

- Given an expense submission, when the submitter attaches a supported receipt image, then the image remains associated with that expense and can be viewed by authorized users.
- Given an expense submission without an image, when it is submitted, then it can proceed without a receipt.
- Supported formats, size limits, retention, and access policy are open questions.

### Notifications and Approval

**FR-006**

- Given a group member submits an expense for approval, when submission succeeds, then the other group members receive an in-app notification identifying the expense and group without exposing it to non-members.

**FR-007**

- Given an expense awaiting review, when a reviewer approves it, then it becomes an approved expense and its allocations are applied to balances exactly once.
- Given an expense awaiting review, when a reviewer rejects it, then it does not affect balances and its review outcome is visible to authorized users.
- Given a group configured for multiple approval levels, when only some required levels have approved, then the expense remains pending and does not affect balances until all required approvals are complete.
- Reviewer authorization, rejection edits/resubmission, and approval configuration are open questions.

### Balances, Payments, and Reports

**FR-008**

- Given approved expenses for multiple users, when a user views balances, then the system shows the net amount owed between each relevant pair of users, consistent with the approved expense allocations and payments.
- Pending and rejected expenses do not change balances.
- Balance calculations use exact decimal monetary arithmetic and a consistent currency/rounding policy.

**FR-009**

- Given a user records a positive payment between a payer and recipient with an amount no greater than the outstanding amount and a date, when the payment is accepted, then the payment is visible in payment history and the corresponding amount owed is reduced by that amount.
- Given a user records a partial payment, when it is accepted, then the remaining outstanding balance is retained.
- Given a payment amount greater than the outstanding amount, or an amount outside currency precision, when it is submitted, then it is rejected with a validation message.
- Given an accepted payment needs correction, when a reversal is recorded, then the original payment remains in history and the balance reflects the reversal.

**FR-010**

- Given an authorized user with expense, balance, or payment activity, when they open reports, then summaries include the applicable expenses, balances, and payments.
- Report data is limited to groups and records the viewer is authorized to access.

**FR-011**

- Given a user selects a valid date range and supported report parameters, when they generate a custom report, then the report includes only matching authorized expenses, balances, and/or payments.
- Given an invalid date range, when a report is requested, then the system reports the validation issue and does not present it as a valid report.
- The available parameters, output formats, and date-boundary rules are open questions.

### Platforms

**FR-012**

- Given the agreed release scope, when platform acceptance is assessed, then the primary web product is usable and supported Android and iOS apps are available.
- A Java Swing desktop build does not pass this criterion unless separate web, Android, and iOS clients are also delivered and verified.
- Supported OS versions, browser matrix, and device coverage are open questions.

## Non-Functional Requirements and Implementation Constraints

These requirements are labeled by origin so technical choices are not misrepresented as customer requests.

| ID | Requirement | Origin | Acceptance evidence |
| --- | --- | --- | --- |
| NFR-001 | Preserve account and group data boundaries: users can access only information permitted by their account and group membership. | Derived from customer account/group needs | Authorization tests demonstrate allowed access and denied cross-account/non-member access for expenses, balances, receipts, and reports. |
| NFR-002 | Use Java 21 and Maven for the proposed Java implementation, with dependencies and build configuration declared in Maven. | Implementation decision | A clean Maven build succeeds on Java 21 and the project identifies the required Java version. |
| NFR-003 | Use Java Swing for the proposed desktop MVP client while keeping UI/event handling separate from business rules. | Implementation decision | Domain/application behavior can be exercised without constructing Swing components; UI code delegates business operations to that layer. |
| NFR-004 | Use object-oriented design with focused responsibilities and testable dependencies. | Implementation decision | Review confirms the expense, approval, balance, payment, and reporting rules are not concentrated in UI handlers or a single unrelated class. |
| NFR-005 | Use `BigDecimal`, not binary floating-point types, for financial values; round shares to the currency's minor unit and assign remainders deterministically. | Implementation decision; remainder policy confirmed | Automated tests cover equal and percentage splits, currency precision, deterministic remainder allocation, and exact reconciliation of participant shares to expense totals. |
| NFR-006 | Use JUnit 5 for automated behavior tests, especially domain and application rules independent of Swing. | Implementation decision | Maven test execution runs JUnit 5 tests for the critical acceptance criteria, including approval and settlement effects. |
| NFR-007 | Use version-controlled PlantUML sources for diagrams that document meaningful architecture or workflows. | Implementation decision | Relevant diagrams have source files in the project and are updated when the documented design changes. |
| NFR-008 | Maintain traceability from each customer requirement ID to specification, implementation, and verification evidence. | Implementation decision | A release review can identify implementation and passing acceptance evidence for every claimed satisfied FR; deferred items remain explicitly marked. |
| NFR-009 | Human contributors review and understand AI-assisted code, tests, diagrams, and documentation before approval or release. | Implementation decision | Review/merge records show human approval and relevant checks; AI output alone is not treated as approval or verification. |

## Proposed Java Swing MVP Subset

This section records a **proposed implementation scope**, not a change to the authoritative customer request. It is subject to product approval and does not redefine any FR.

- **Client:** Java 21 desktop application using Swing and Maven.
- **Proposed included requirements:** FR-001 through FR-010, with one approval step proposed and the confirmed in-app notification on expense submission.
- **Basic reports only:** Include summaries under FR-010; defer custom report parameters under FR-011.
- **Platform gap:** FR-012 remains unsatisfied by this MVP. The customer-requested primary web experience and Android/iOS apps require separately scoped clients and acceptance evidence.
- **Architecture constraint:** Keep business rules independent from Swing so they can be reused by additional clients where appropriate.
- **No Java code is specified or generated by this document.**

## Open Questions

1. Is a Swing desktop MVP an approved first delivery, given the customer’s explicit primary-web and Android/iOS requirement, or must the MVP include those platforms?
2. Who may review expenses? Can the submitter review their own expense? How are single- and multi-level workflows configured, and what happens after rejection?
3. Which currencies are supported, which rounding mode applies, and what stable rule identifies the participant who receives a rounding remainder?
4. How should a payment reversal be authorized and handled if the original payment has already been reconciled or otherwise acted upon?
5. Which report filters beyond date range are required, and which export formats (if any) are expected?
6. Which receipt image formats, maximum sizes, storage duration, and visibility rules are required?
7. Which browser versions, Android/iOS versions, and desktop operating systems must be supported?
8. Are account deletion or multi-factor authentication in scope? Email/password registration, sign-in, and password recovery are confirmed; other lifecycle and authentication controls are not defined by the source brief.
