"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-700";

function EntryForm({ action, groupId, button, children }: {
  action: "group" | "member" | "expense";
  groupId?: number;
  button: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("action", action);
    if (groupId !== undefined) data.set("groupId", String(groupId));
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/groups", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) {
        setFailed(true);
        setMessage(result.error);
        return;
      }

      form.reset();
      setFailed(false);
      setMessage(action === "group" ? "Group created." : action === "member" ? "Member added." : "Expense recorded.");
      if (action === "group") router.push(`/?group=${result.groupId}`);
      router.refresh();
    } catch {
      setFailed(true);
      setMessage("Could not save the entry. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={pending} className="min-w-0 space-y-4">
        {children}
        <button className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60">
          {pending ? "Saving…" : button}
        </button>
      </fieldset>
      {message && (
        <p role={failed ? "alert" : "status"} className={`mt-3 text-sm ${failed ? "text-red-700" : "text-teal-800"}`}>
          {message}
        </p>
      )}
    </form>
  );
}

export function GroupForm() {
  return (
    <EntryForm action="group" button="Create group">
      <label className="block space-y-1 text-sm font-medium">
        <span>Group name</span>
        <input name="name" required maxLength={80} className={inputClass} />
      </label>
    </EntryForm>
  );
}

export function MemberForm({ groupId }: { groupId: number }) {
  return (
    <EntryForm action="member" groupId={groupId} button="Add member">
      <label className="block space-y-1 text-sm font-medium">
        <span>Member name</span>
        <input name="name" required maxLength={80} className={inputClass} />
      </label>
    </EntryForm>
  );
}

export function ExpenseForm({ groupId, members }: {
  groupId: number;
  members: { id: number; name: string }[];
}) {
  return (
    <EntryForm action="expense" groupId={groupId} button="Record expense">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <label className="space-y-1 text-sm font-medium">
          <span>Description</span>
          <input name="description" required maxLength={200} className={inputClass} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>Amount (USD)</span>
          <input name="amount" inputMode="decimal" placeholder="0.00" required className={inputClass} />
        </label>
      </div>
      <label className="block space-y-1 text-sm font-medium">
        <span>Paid by</span>
        <select name="payerId" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select a payer</option>
          {members.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <fieldset className="min-w-0">
        <legend className="text-sm font-medium">Split equally among</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {members.map(({ id, name }) => (
            <label key={id} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-checked:border-teal-700 has-checked:bg-teal-50">
              <input type="checkbox" name="participantId" value={id} className="accent-teal-800" />
              <span className="break-all">{name}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </EntryForm>
  );
}
