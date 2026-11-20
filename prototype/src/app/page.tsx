import Link from "next/link";
import { prisma } from "@/lib/db";
import { dollars, memberBalances } from "@/lib/money";
import { ExpenseForm, GroupForm, MemberForm } from "./forms";

export const dynamic = "force-dynamic";

const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
const heading = "mb-4 text-lg font-semibold";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ group?: string | string[] }>;
}) {
  const { group: selected } = await searchParams;
  const groups = await prisma.group.findMany({ orderBy: { id: "asc" } });
  const active = selected === undefined ? groups[0] : groups.find(({ id }) => String(id) === selected);
  const group = active && await prisma.group.findUnique({
    where: { id: active.id },
    include: {
      members: { orderBy: { id: "asc" } },
      expenses: {
        orderBy: { id: "desc" },
        include: { payer: true, shares: { orderBy: { memberId: "asc" }, include: { member: true } } },
      },
    },
  });

  const balances = group && memberBalances(group.members, group.expenses);
  const total = group?.expenses.reduce((sum, expense) => sum + BigInt(expense.amountCents), 0n);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-teal-900 bg-teal-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-5">
          <Link href="/" className="text-2xl font-bold tracking-tight">SplitSmart</Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl items-start gap-6 px-5 py-8 md:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className={panel}>
          <h2 className={heading}>Groups</h2>
          {groups.length > 0 && (
            <nav aria-label="Groups" className="mb-5 space-y-1">
              {groups.map(({ id, name }) => (
                <Link key={id} href={`/?group=${id}`} aria-current={group?.id === id ? "page" : undefined}
                  className="block rounded-lg px-3 py-2 text-sm break-words hover:bg-slate-100 aria-[current=page]:bg-teal-50 aria-[current=page]:font-semibold aria-[current=page]:text-teal-900">
                  {name}
                </Link>
              ))}
            </nav>
          )}
          <GroupForm />
        </aside>

        {group && balances ? (
          <div key={group.id} className="space-y-6">
            <div>
              <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">{group.name}</h1>
              <p className="mt-2 text-sm text-slate-600">{group.members.length} {group.members.length === 1 ? "member" : "members"} · {dollars(total ?? 0)} in expenses</p>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <section className={panel}>
                <h2 className={heading}>Members &amp; balances</h2>
                {group.members.length > 0 ? (
                  <ul className="mb-5 divide-y divide-slate-100">
                    {group.members.map(({ id, name }) => {
                      const balance = balances.get(id)!;
                      return (
                        <li key={id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                          <span className="min-w-0 break-words font-medium">{name}</span>
                          <span className={`shrink-0 text-right tabular-nums ${balance > 0n ? "text-teal-800" : balance < 0n ? "text-red-700" : "text-slate-600"}`}>
                            {balance > 0n ? `Gets back ${dollars(balance)}` : balance < 0n ? `Owes ${dollars(-balance)}` : "Settled"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="mb-5 text-sm text-slate-600">Add your first group member.</p>}
                <MemberForm groupId={group.id} />
              </section>
              <section className={panel}>
                <h2 className={heading}>New expense</h2>
                {group.members.length > 0 ? <ExpenseForm groupId={group.id} members={group.members} />
                  : <p className="text-sm text-slate-600">Add a member to record an expense.</p>}
              </section>
            </div>
            <section className={panel}>
              <h2 className={heading}>Expense history</h2>
              {group.expenses.length === 0 ? <p className="text-sm text-slate-600">No expenses recorded yet.</p> : (
                <ul className="divide-y divide-slate-200">
                  {group.expenses.map((expense) => (
                    <li key={expense.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="min-w-0 break-words font-semibold">{expense.description}</h3>
                        <p className="shrink-0 font-semibold tabular-nums">{dollars(expense.amountCents)}</p>
                      </div>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        Paid by {expense.payer.name} · <time dateTime={expense.createdAt.toISOString()}>
                          {expense.createdAt.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}
                        </time>
                      </p>
                      <ul aria-label="Participant shares" className="mt-3 flex flex-wrap gap-2">
                        {expense.shares.map(({ member, amountCents }) => (
                          <li key={member.id} className="min-w-0 break-words rounded-lg bg-slate-100 px-3 py-1 text-sm">
                            {member.name} <span className="font-semibold">{dollars(amountCents)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <section className={panel}>
            <h1 className="text-2xl font-bold">{selected === undefined ? "Create your first group" : "Group not found"}</h1>
            <p className="mt-2 text-slate-600">
              {selected === undefined ? "Add the people you share expenses with, then record who paid and who joined each split." : "Choose a group from the list or create a new one."}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
