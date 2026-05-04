import { Router, type IRouter, type Request } from "express";
import { db, codmAccountsTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { GenerateCodmAccountBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

type UserRequest = Request & { user: typeof usersTable.$inferSelect };

const COINS_PER_ACCOUNT = 10;

function generateRandomAccount(): { account: string; status: string } {
  const usernames = ["player", "gamer", "ninja", "sniper", "beast", "ghost", "shadow", "storm"];
  const username = usernames[Math.floor(Math.random() * usernames.length)];
  const num = Math.floor(Math.random() * 99999);
  const pass = Math.random().toString(36).substring(2, 10) + Math.floor(Math.random() * 999);
  const statuses = ["working", "working", "working", "not_working"];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  return {
    account: `${username}${num}:${pass}`,
    status,
  };
}

router.post("/codm/generate", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;

  const body = GenerateCodmAccountBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const count = Math.max(1, Math.min(10, body.data.count));
  const coinsRequired = count * COINS_PER_ACCOUNT;

  if (user.balance < coinsRequired) {
    res.status(402).json({ error: `Insufficient coins. Need ${coinsRequired} coins but you have ${user.balance}.` });
    return;
  }

  await db.update(usersTable).set({ balance: user.balance - coinsRequired }).where(eq(usersTable.id, user.id));

  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "spend",
    amount: coinsRequired,
    status: "approved",
    note: `Generated ${count} CODM account(s)`,
  });

  const generated = generateRandomAccount();

  const [inserted] = await db.insert(codmAccountsTable).values({
    userId: user.id,
    account: generated.account,
    status: generated.status,
    coinsSpent: coinsRequired,
  }).returning();

  res.json({
    id: inserted.id,
    account: inserted.account,
    status: inserted.status,
    coinsSpent: inserted.coinsSpent,
    createdAt: inserted.createdAt.toISOString(),
  });
});

router.get("/codm/accounts", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;

  const accounts = await db
    .select()
    .from(codmAccountsTable)
    .where(eq(codmAccountsTable.userId, user.id))
    .orderBy(desc(codmAccountsTable.createdAt));

  res.json(accounts.map(a => ({
    id: a.id,
    account: a.account,
    status: a.status,
    coinsSpent: a.coinsSpent,
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
