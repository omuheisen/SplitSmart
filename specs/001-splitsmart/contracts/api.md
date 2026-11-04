# SplitSmart Service Contract v1

**Architecture context:** [ADR-001](../architecture-decision.md) selects the shared HTTP/PostgreSQL modular monolith. This remains a planned contract/validation guide, not a running implementation.

Design contract, not a running API. Base `/api/v1`; HTTPS outside local development; JSON UTF-8. The Swing client is the first consumer; later web/mobile consumers reuse this boundary. Concrete OpenAPI generation and DTO implementation belong to implementation tasks.

## Common Types and Behavior

IDs are UUID strings; dates `YYYY-MM-DD`; timestamps RFC3339 UTC. Money `{ "amount": "10.00", "currency": "USD" }`; percentage strings such as `"33.33"`. Reject numeric JSON money/percentages so clients cannot silently convert through binary floating point. Results use field allowlists, never persistence entities or credential fields.

Authenticated routes require `Authorization: Bearer <opaque-session-token>`. Derive actor from token, never a supplied actorId. All resource lookups enforce account/membership permissions server-side. Use 404 for inaccessible object IDs, 403 for known-resource role denial; do not reveal membership/private identity through errors. Recovery responses are uniform. Browser cookie/CORS/CSRF adaptations must be designed before future web delivery; bearer-only desktop contract does not prove browser readiness.

Financial/membership/submission/decision mutations require `Idempotency-Key` UUID. Scope actor+operation+key; atomically store request digest and committed result. Replay same request returns original result/resource with no new financial effect; key reuse with a different body yields 409. Recheck current authorization before returning saved results. Expense decisions and configuration changes carry `expectedVersion` to reject stale writes (409). Expired/unknown idempotency keys never bypass database business uniqueness. Get routes have no side effects.

Errors: `{ "code": "INVALID_PERCENTAGE_TOTAL", "message": "Percentages must total 100", "fieldErrors": [{"field":"participants","code":"TOTAL"}], "correlationId":"..." }`. Use 400 malformed input, 401 session missing/expired, 403/404 authorization, 409 state/version/idempotency conflicts or overpayment under concurrency, 422 field/business validation, 413 upload too large, 415 unsupported image. Server failures return no internal stack/data. Rejected commands have no ledger, balance, notification or partial expense effects.

Lists: `?cursor=<opaque>&limit=50`, maximum 100; response `{ "items": [...], "nextCursor": null }`; stable ordering by createdAt/id, no unbounded collections. Return immutable IDs and current versions for mutable resources.

## Identity (FR-001)

| Method/path | Request | Response / rules |
| --- | --- | --- |
| POST /auth/register | email, password, displayName | 201 public user profile; validate email/password, never echo password/hash |
| POST /auth/sessions | email, password | 201 token, expiresAt, own profile; generic invalid-credential response |
| DELETE /auth/session | bearer token | 204 revoke current session |
| POST /auth/recovery | email | 202 uniform response; SMTP/test-mail delivery only if account exists |
| POST /auth/reset | token, newPassword | 204; atomically consume valid one-use token, update password, revoke sessions |
| GET /me | — | 200 own public profile |

Proposed defaults: session 8 hours, recovery token 30 minutes, recovery/login rate limits; tune with review. Never issue another user's tokens through a desktop identity switch.

## Groups and Invitations (FR-002)

| Method/path | Request | Response / rules |
| --- | --- | --- |
| POST /groups | name, currency | 201 group; creator OWNER |
| GET /groups | pagination | Active memberships only |
| GET /groups/{g} | — | Group, policy summary and permitted member profiles |
| PATCH /groups/{g} | name, expectedVersion | Manager; 200 updated group |
| POST /groups/{g}/invitations | email | Manager; 201 invitation; deliver acceptance token privately through mail port |
| POST /invitations/accept | token | 200 membership; authenticated email must match |
| DELETE /groups/{g}/members/{u} | expectedVersion via query | 204 manager only; soft removal, cannot remove last owner |
| PUT /groups/{g}/approval-policy | steps[{reviewerId}], expectedVersion | 200 new version; one or multiple ordered levels; active reviewers |
| POST /groups/{g}/owner-transfer | newOwnerId, expectedVersion | 200; owner-only, active target; preserve owner invariant |

## Expenses, Receipts and Review (FR-003–FR-007)

`POST /groups/{g}/expenses` is multipart: a JSON `expense` part plus optional binary `receipt`. JSON fields: amount (Money), date, description, payerId, splitMethod (`EQUAL`/`PERCENTAGE`), participants[{userId, percentage?}], replacesExpenseId?. Return 201 with immutable shares, snapshot approval steps, state=PENDING, version and receipt metadata. Validate currency, participants/payer, policy eligibility and full image before committing. Do not accept client-calculated shares or approval status. Transaction creates notification rows for every other active group member exactly once. Separate group-member removal races serialize with submission membership checks.

| Method/path | Request | Response / rules |
| --- | --- | --- |
| GET /groups/{g}/expenses | cursor, limit, status?, from?, to? | Authorized paginated expense summaries |
| GET /expenses/{e} | — | Full authorized details, shares, steps, receipt metadata |
| GET /expenses/{e}/receipt | — | Authorized private image stream, safe content type, no public cache; 404 if absent |
| POST /expenses/{e}/decisions | decision APPROVE/REJECT, comment?, expectedVersion | Assigned current eligible reviewer; 200 current state/version, final approval posts once |
| POST /expenses/{e}/steps/{s}/reassign | reviewerId, reason, expectedVersion | Manager; pending step only; 200 audited assignment |
| GET /me/notifications | cursor, limit, unreadOnly? | Own items only; exclude inaccessible payload details after membership loss |
| PATCH /me/notifications/{n} | read=true | 200 read marker; own item only |

No edit/delete route for submitted or approved expenses. Correct rejected expense by new submission with replacesExpenseId. Configuring or reassigning a reviewer cannot authorize self-review. All steps must approve before any ledger effect. Receipt-free submission is fully supported.

## Balances and Settlement (FR-008/009)

| Method/path | Request | Response / rules |
| --- | --- | --- |
| GET /me/balances | cursor, limit, currency? | Own pair debts by group/currency including retained debt after removal |
| GET /groups/{g}/balances | cursor, limit | Active member group view; debtorId, creditorId, positive amount, currency; zero omitted |
| POST /me/payments | groupId, recipientId, amount (Money), date | Sender=actor; 201 immutable payment and updated pair balance; sender must owe recipient in this group/currency |
| GET /me/payments | cursor, limit, groupId? | Own sent/received payment and reversal history, including retained debt |
| POST /payments/{p}/reversals | date, reason | Original sender only under D4; 201 reversal plus updated balance; at most one full reversal |

Sender and recipient need historical group membership/debt; removed sender may settle own debt without regaining access to other records. Recipient cannot record a payment as if acting for sender. Under pair lock, reject overpayment or wrong direction atomically. A new key cannot duplicate reversal because original payment has unique reversal constraint.

## Reports (FR-010/011)

`GET /me/reports?from=YYYY-MM-DD&to=YYYY-MM-DD&groupId=...&recordType=ALL|EXPENSE|PAYMENT&expenseStatus=ALL|PENDING|APPROVED|REJECTED&cursor=...&limit=50` returns own authorized summaries and matching paginated rows. `from/to` optional for unfiltered summary but both required for a date-range query; from <= to. Group report detail requires active membership; removed-member personal report is restricted to their own ledger/payment view.

Response: filters, per-currency expense totals by status, paid/received/reversed totals, openingBalances, periodMovements, closingBalances, rows, nextCursor. Financial balance totals always use all applicable approved ledger/payment activity even when the visible row filter selects pending expenses or only payments; label this clearly to avoid presenting filtered rows as a complete reconciliation. Execute totals and rows against one consistent snapshot per response. Repeated page requests are live queries (no promise of a frozen report across pages). No CSV/PDF format or cross-currency total is promised.

## Representative Acceptance Exchanges

1. Bob submits USD 10 equal Alice/Bob: response PENDING and shares 5/5; notification to Alice; Alice's debt remains zero.
2. Assigned reviewer approves last step: response APPROVED; Alice owes Bob 5. Retry original key returns same result and debt remains 5. Another reviewer decision conflicts.
3. Alice records USD 2 to Bob: debt 3. Two simultaneous USD 2 payments when debt is 3 yield one success, one conflict; debt 1.
4. Original sender reverses the successful USD 2 payment: debt increases by 2 once. Second reversal with another key conflicts.
5. Non-member requesting expense/receipt/report IDs receives no protected payload. Removing a member preserves ledger and their restricted personal debt view.

Errors, state transitions, decimal serialization, required authorization, pagination, idempotency and expected-version behavior are contract-test requirements. See data-model.md for financial signs and quickstart.md for validation sequence.
