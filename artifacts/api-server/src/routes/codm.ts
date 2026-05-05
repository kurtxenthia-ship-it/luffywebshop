import { Router, type IRouter, type Request } from "express";
import { db, codmAccountsTable, codmAccountPoolTable, transactionsTable, usersTable, siteConfigTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

type UserRequest = Request & { user: typeof usersTable.$inferSelect };

const DEFAULT_CODM_PRICING: Record<number, number> = {
  1: 50,
  2: 80,
  3: 120,
};

async function getCodmPricing(): Promise<Record<number, number>> {
  try {
    const [config] = await db.select().from(siteConfigTable).where(eq(siteConfigTable.key, "codm_pricing"));
    if (config) return JSON.parse(config.value) as Record<number, number>;
  } catch {}
  return DEFAULT_CODM_PRICING;
}

router.post("/codm/claim", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;
  const { packageSize } = req.body as { packageSize: unknown };

  const size = Number(packageSize);
  if (![1, 2, 3].includes(size)) {
    res.status(400).json({ error: "Invalid package. Choose 1, 2, or 3 accounts." });
    return;
  }

  const pricing = await getCodmPricing();
  const coinsRequired = pricing[size];

  if (!coinsRequired) {
    res.status(400).json({ error: "Pricing not configured." });
    return;
  }

  if (user.balance < coinsRequired) {
    res.status(402).json({ error: `Insufficient coins. Need ${coinsRequired} but you have ${user.balance}.` });
    return;
  }

  const available = await db
    .select()
    .from(codmAccountPoolTable)
    .where(eq(codmAccountPoolTable.isClaimed, false))
    .limit(size);

  if (available.length < size) {
    res.status(503).json({
      error: `Not enough accounts available in pool. Only ${available.length} available. Please contact the seller.`,
    });
    return;
  }

  const now = new Date();

  for (const acc of available) {
    await db.update(codmAccountPoolTable).set({
      isClaimed: true,
      claimedByUserId: user.id,
      claimedAt: now,
    }).where(eq(codmAccountPoolTable.id, acc.id));
  }

  await db.update(usersTable).set({ balance: user.balance - coinsRequired }).where(eq(usersTable.id, user.id));

  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "spend",
    amount: coinsRequired,
    status: "approved",
    note: `Claimed ${size} CODM account(s)`,
  });

  for (const acc of available) {
    await db.insert(codmAccountsTable).values({
      userId: user.id,
      account: JSON.stringify({
        username: acc.username,
        password: acc.password,
        nickname: acc.nickname,
        uid: acc.uid,
        level: acc.level,
        region: acc.region,
        status: acc.accountStatus,
      }),
      status: acc.accountStatus,
      coinsSpent: Math.round(coinsRequired / size),
    });
  }

  res.json({
    accounts: available.map(acc => ({
      username: acc.username,
      password: acc.password,
      nickname: acc.nickname ?? null,
      uid: acc.uid ?? null,
      level: acc.level ?? null,
      region: acc.region ?? null,
      status: acc.accountStatus,
    })),
    coinsSpent: coinsRequired,
    remainingBalance: user.balance - coinsRequired,
  });
});

router.get("/codm/accounts", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;

  const accounts = await db
    .select()
    .from(codmAccountsTable)
    .where(eq(codmAccountsTable.userId, user.id))
    .orderBy(desc(codmAccountsTable.createdAt));

  res.json(accounts.map(a => {
    let parsed: Record<string, unknown> | null = null;
    try { parsed = JSON.parse(a.account) as Record<string, unknown>; } catch {}
    return {
      id: a.id,
      account: a.account,
      parsed,
      status: a.status,
      coinsSpent: a.coinsSpent,
      createdAt: a.createdAt.toISOString(),
    };
  }));
});

export default router;
