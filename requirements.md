# SplitSmart Requirements

**Status:** Draft for product/customer review  
**Customer source of truth:** [`UserRequirement.md`](UserRequirement.md)  
**Detailed scenarios and acceptance criteria:** [Feature specification](specs/001-splitsmart/spec.md)  
**Engineering principles:** [Project constitution](.specify/memory/constitution.md)

## Authority and Scope

`UserRequirement.md` is the authoritative customer request. The functional requirements below preserve all capabilities and platforms stated there. Confirmed clarification decisions refine ambiguous behavior without removing or narrowing any original feature. Technical constraints are identified separately as implementation decisions, not customer requirements.

The Java Swing MVP is a proposed implementation subset, not an approved change to customer scope. A Swing client alone does not satisfy the customer requirement for a primarily web-based product with Android and iOS apps.

## Original Customer Requirements

The customer requests SplitSmart for sharing expenses between individuals or groups such as friends, roommates, family members, or coworkers, with these capabilities:

1. **User accounts:** Each person has an account to log in and access their own expense and balance information.
2. **Group management:** Users can create and manage groups of people to organize shared expenses and balances.
3. **Expense creation:** Users can create expenses with an amount, date, description, an equal or percentage split, and an optional receipt image. Users can identify the other users involved so balances can be adjusted appropriately.
4. **Notifications:** Users can be notified when other group members create expenses.
5. **Expense approval:** Expenses can be reviewed and approved before they are added to the system and used to adjust balances. A group may need a single review or multiple approval levels.
6. **Balance tracking:** The system tracks what each user owes every other user, taking entered expenses into account.
7. **Payment tracking:** Users can record payments made to settle balances so balances remain accurate.
8. **Reporting:** Users can view reports and summaries of expenses, balances, and payments, potentially with custom date ranges and other parameters.
9. **Platforms:** The product is primarily web-based and also has apps that run on Android and iOS.

## Functional Requirements

All functional requirements below remain in scope. The origin column distinguishes explicit customer requirements from behaviors added or clarified through confirmed decisions.

| ID | Requirement | Origin / confirmed clarification |
| --- | --- | --- |
| FR-001 | Each person shall have an account, be able to sign in, and access their own expense and balance information. Registration and sign-in use email and password; password recovery is included. | Account/access is a customer requirement. Email/password and recovery are confirmed clarifications DEC-006. |
| FR-002 | Users shall be able to create and manage groups of people for shared expenses and balances. A group owner/manager controls invitations and member removal. Removing a member shall not remove historical expenses or balances. | Group management is a customer requirement. Membership and history behavior are confirmed in DEC-002. |
| FR-003 | An authorized group member shall be able to create an expense with amount, date, description, payer, and equal or percentage allocation. The payer shall be recorded separately from participants and may or may not be a participant. Amounts shall be positive and within applicable currency precision; invalid amounts shall be rejected. | Expense fields and split methods are customer requirements. Payer semantics and amount validation are confirmed in DEC-001 and DEC-004. |
| FR-004 | An expense shall identify the users sharing it and calculate their allocations. Percentage allocations shall total exactly 100%; shares shall be rounded to the currency's minor unit, and any remainder shall be assigned deterministically so shares reconcile to the expense total. | Participant selection and allocation methods are customer requirements. Percentage validation is confirmed in DEC-005; rounding/remainder behavior in DEC-003. Rounding mode and deterministic participant order remain open. |
| FR-005 | An expense may include an optional receipt image, accessible to authorized users. | Optional receipt is a customer requirement; access control is derived. |
| FR-006 | Other group members shall receive an in-app notification when an expense is submitted for approval. | Notification is a customer requirement. Recipients, channel, and timing are confirmed in DEC-007. |
| FR-007 | The system shall support reviewing and approving expenses before they are added to tracked expenses or affect balances. A group's workflow may require one or multiple approval levels. | Approval workflow is a customer requirement. One-step versus multi-step configuration and reviewer permissions remain open; the proposed Swing MVP uses one review step. |
| FR-008 | The system shall track the balance owed between each pair of users based on approved expenses, allocations, and recorded payments. Pending or rejected expenses shall not affect balances. | Balance tracking is a customer requirement; applying only approved expenses follows the approval requirement. |
| FR-009 | Users shall be able to record payments made toward amounts owed, and balances shall reflect them. Positive partial payments are allowed up to the outstanding amount; overpayments are rejected. Corrections shall use a reversal record. | Payment tracking is a customer requirement. Partial payment, overpayment, and correction behavior are confirmed in DEC-008 and DEC-004. |
| FR-010 | Users shall be able to view reports and summaries of their expenses, balances, and payments. | Customer requirement. Basic summaries are included in the proposed Swing MVP. |
| FR-011 | Users shall be able to generate custom reports with specified date ranges and other parameters. | Customer requirement. Deferred beyond basic summaries in the proposed Swing MVP. |
| FR-012 | The product shall be primarily web-based and shall also have apps that run on Android and iOS. | Customer platform requirement. Not fulfilled by a Swing-only MVP. |

## Non-Functional Requirements and Implementation Decisions

These are engineering constraints from the project constitution, not additional customer-requested features. NFR-001 is a derived quality requirement necessary to protect customer account and group data.

| ID | Requirement | Origin | Verification evidence |
| --- | --- | --- | --- |
| NFR-001 | Access to accounts, groups, expenses, balances, receipts, and reports shall be limited to users authorized for that data. | Derived from customer account and group requirements | Authorization tests verify permitted access and deny unauthorized cross-account and non-member access. |
| NFR-002 | The Java implementation shall use Java 21 and Maven, with dependencies and build configuration declared in Maven. | Implementation decision | A clean Maven build succeeds on Java 21. |
| NFR-003 | The proposed desktop MVP shall use Java Swing, with UI components and event handling kept separate from business rules. | Implementation decision | Domain/application behavior can be tested without constructing Swing components; UI delegates to that behavior. |
| NFR-004 | The design shall use object-oriented principles, focused responsibilities, encapsulated state, and testable dependencies. | Implementation decision | Design review verifies business rules are not owned by UI handlers or unrelated all-purpose classes. |
| NFR-005 | Financial values shall use `BigDecimal`, not `float` or `double`. Shares shall use the currency's minor unit and a deterministic remainder allocation. | Implementation decision; remainder behavior confirmed in DEC-003 | JUnit tests cover currency precision, equal and percentage splits, rounding/remainder cases, and exact reconciliation. Exact rounding mode and participant ordering remain open. |
| NFR-006 | Automated behavior tests shall use JUnit 5, with business behavior tested independently from Swing where practical. | Implementation decision | Maven test execution runs JUnit 5 tests for requirements including allocation, approval, balances, and settlement. |
| NFR-007 | PlantUML sources shall be version-controlled for diagrams used to document meaningful architecture or workflows. | Implementation decision | Relevant diagrams have maintained source files updated with material design changes. |
| NFR-008 | Each customer requirement shall be traceable to its specification, implementation, and verification evidence. | Implementation decision | A release review can identify implementation and passing acceptance evidence for each requirement claimed as satisfied; deferred items remain marked. |
| NFR-009 | A human contributor shall review and understand AI-assisted code, tests, diagrams, and documentation before approval or release. AI output alone shall not authorize expense approval, balance changes, requirement changes, or deployment. | Implementation decision | Human review and relevant check results are recorded before merge or release. |

## Requirements Traceability

| Original customer requirement | Functional requirement IDs | Notes / status |
| --- | --- | --- |
| User accounts and access to own expense and balance information | FR-001 | Email/password and password recovery are clarified behaviors, not explicit details in the original brief. |
| Create and manage groups | FR-002 | Manager-controlled membership and retained historical records are confirmed clarifications. |
| Create expenses with amount, date, description, equal/percentage split, optional receipt, and involved users | FR-003, FR-004, FR-005 | Payer is separate from participants; valid amounts and exact percentage totals follow confirmed clarifications. |
| Notify users when another group member creates an expense | FR-006 | In-app notification to other members on submission for approval. |
| Review and approve expenses before applying them | FR-007 | Supports one or multiple approval levels; detailed reviewer permissions remain open. |
| Track what each user owes every other user | FR-008 | Based on approved expenses and recorded payments; pending/rejected expenses do not affect balances. |
| Record payments to settle balances | FR-009 | Partial payment allowed; overpayment rejected; corrections use reversals. |
| Provide expense, balance, and payment reports/summaries, including custom date ranges and parameters | FR-010, FR-011 | Basic summaries in proposed Swing MVP; custom reports deferred. |
| Primary web product plus Android and iOS apps | FR-012 | Remains a customer requirement and is not met by a Swing-only MVP. |

## Proposed Java Swing MVP Boundary

The following is a proposed implementation subset only and does not change the functional requirements above:

- Proposed implementation: Java 21, Maven, Java Swing desktop client, with business logic separated from the GUI.
- Proposed included scope: FR-001 through FR-010, with one approval step and the confirmed in-app notification on expense submission.
- Basic reporting under FR-010 is included; custom reports under FR-011 are deferred.
- FR-012 remains unsatisfied by this MVP. Web, Android, and iOS delivery requires additional clients and platform-specific verification.
- See the [feature specification](specs/001-splitsmart/spec.md) for scenarios, detailed acceptance criteria, confirmed decision IDs, and outstanding product questions.
