export function parseCents(value: string): number | null {
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return cents > 0 && cents <= 2_147_483_647 ? cents : null;
}

export function splitCents(amountCents: number, memberIds: number[]) {
  const baseShare = Math.floor(amountCents / memberIds.length);
  const remainder = amountCents % memberIds.length;
  return [...memberIds].sort((a, b) => a - b).map((memberId, index) => ({
    memberId,
    amountCents: baseShare + Number(index < remainder),
  }));
}

export function dollars(value: number | bigint) {
  const cents = BigInt(value);
  const absolute = cents < 0n ? -cents : cents;
  return `${cents < 0n ? "-" : ""}$${(absolute / 100n).toLocaleString("en-US")}.${String(absolute % 100n).padStart(2, "0")}`;
}

export function memberBalances(
  members: { id: number }[],
  expenses: {
    payerId: number;
    amountCents: number;
    shares: { memberId: number; amountCents: number }[];
  }[],
) {
  const balances = new Map(members.map(({ id }) => [id, 0n]));
  for (const expense of expenses) {
    balances.set(expense.payerId, balances.get(expense.payerId)! + BigInt(expense.amountCents));
    for (const share of expense.shares) {
      balances.set(share.memberId, balances.get(share.memberId)! - BigInt(share.amountCents));
    }
  }
  return balances;
}
