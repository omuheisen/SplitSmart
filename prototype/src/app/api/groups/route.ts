import { prisma } from "@/lib/db";
import { parseCents, splitCents } from "@/lib/money";

function invalid(error: string, status = 400) {
  return Response.json({ error }, { status });
}

function readText(data: FormData, field: string) {
  const value = data.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readId(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value)) return null;
  const id = Number(value);
  return id <= 2_147_483_647 ? id : null;
}

export async function POST(request: Request) {
  const data = await request.formData().catch(() => null);
  if (!data) return invalid("Submit the group, member, or expense form.");

  const action = data.get("action");
  try {
    if (action === "group") {
      const name = readText(data, "name");
      if (!name || name.length > 80) return invalid("Enter a group name of 1–80 characters.");
      const group = await prisma.group.create({ data: { name } });
      return Response.json({ groupId: group.id }, { status: 201 });
    }

    if (action !== "member" && action !== "expense") return invalid("Choose a valid action.");
    const groupId = readId(data.get("groupId"));
    if (!groupId) return invalid("Choose a valid group.");
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { members: { select: { id: true } } },
    });
    if (!group) return invalid("This group could not be found.", 404);

    if (action === "member") {
      const name = readText(data, "name");
      if (!name || name.length > 80) return invalid("Enter a member name of 1–80 characters.");
      const member = await prisma.member.create({ data: { name, groupId } });
      return Response.json({ groupId, memberId: member.id }, { status: 201 });
    }

    const description = readText(data, "description");
    if (!description || description.length > 200) {
      return invalid("Enter an expense description of 1–200 characters.");
    }
    const amountCents = parseCents(readText(data, "amount"));
    if (amountCents === null) {
      return invalid("Enter a positive amount up to $21,474,836.47 with at most two decimal places.");
    }

    const payerId = readId(data.get("payerId"));
    const groupMemberIds = new Set(group.members.map(({ id }) => id));
    if (!payerId || !groupMemberIds.has(payerId)) return invalid("Choose a payer from this group.");
    const participantIds = data.getAll("participantId").map(readId);
    if (!participantIds.length) return invalid("Select at least one participant.");
    const memberIds: number[] = [];
    for (const id of participantIds) {
      if (!id || !groupMemberIds.has(id)) return invalid("Every participant must belong to this group.");
      memberIds.push(id);
    }
    if (new Set(memberIds).size !== memberIds.length) return invalid("Select each participant only once.");

    const expense = await prisma.expense.create({
      data: { description, amountCents, groupId, payerId, shares: { create: splitCents(amountCents, memberIds) } },
    });
    return Response.json({ groupId, expenseId: expense.id }, { status: 201 });
  } catch (error) {
    console.error("SplitSmart could not save the form", error);
    return invalid("The entry could not be saved. Please try again.", 500);
  }
}
