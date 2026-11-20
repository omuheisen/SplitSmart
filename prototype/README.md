# SplitSmart · CIS 285 Lab 9

SplitSmart is a local expense-sharing prototype. Create a group, add members, and record an expense by choosing its payer and the members who will split it. The payer can be included in or excluded from the split.

## Run locally

Use Node.js 22.12 or later. From the repository root, run:

```bash
cd prototype
npm ci
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open http://localhost:3000. The default SQLite file is `prisma/splitsmart.db`. Run the migration and the app with the same `DATABASE_URL` if you need to use a different SQLite file.

## Amounts and balances

Enter amounts in USD with up to two decimal places. SplitSmart stores integer cents. If a split leaves extra cents, the earliest-added selected members each receive one extra cent until the total is allocated. A member's balance is what they paid minus what they were allocated. Positive balances show what a member gets back and negative balances show what they owe.
