import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, generationHistoryTable, codmAccountsTable, codmAccountPoolTable, siteConfigTable, loginEventsTable } from "@workspace/db";
import { eq, count, sum, desc, inArray } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { formatUser } from "./auth";

const router: IRouter = Router();

function parseCodmAccounts(content: string): Array<{
  rawText: string;
  username: string;
  password: string;
  nickname: string | undefined;
  uid: string | undefined;
  level: number | undefined;
  region: string | undefined;
  accountStatus: string;
}> {
  const blocks = content.split(/(?=🎯)|(?=NEW HIT)/g).filter(b => b.trim().length > 50);

  const results = blocks.map(block => {
    const rawText = block.trim();
    const usernameMatch = block.match(/[Uu]sername[:\s]+([^\n\r]+)/);
    const passwordMatch = block.match(/[Pp]assword[:\s]+([^\n\r]+)/);
    const nicknameMatch = block.match(/[Nn]ickname[:\s]+([^\n\r]+)/);
    const uidMatch = block.match(/UID[:\s]+([^\n\r]+)/i);
    const levelMatch = block.match(/[Ll]evel[:\s]+(\d+)/);
    const regionMatch = block.match(/[Rr]egion[:\s]+([^\n\r]+)/);
    const statusMatch = block.match(/[Ss]tatus[:\s]+([^\n\r]+)/);

    const username = usernameMatch?.[1]?.trim() ?? "";
    const password = passwordMatch?.[1]?.trim() ?? "";

    if (!username || !password) return null;

    return {
      rawText,
      username,
      password,
      nickname: nicknameMatch?.[1]?.trim(),
      uid: uidMatch?.[1]?.trim(),
      level: levelMatch ? parseInt(levelMatch[1]) : undefined,
      region: regionMatch?.[1]?.trim(),
      accountStatus: statusMatch?.[1]?.trim() ?? "unknown",
    };
  });

  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [genCount] = await db.select({ count: count() }).from(generationHistoryTable);
  const [codmCount] = await db.select({ count: count() }).from(codmAccountsTable);
  const [codmPoolTotal] = await db.select({ count: count() }).from(codmAccountPoolTable);
  const [codmPoolAvail] = await db.select({ count: count() }).from(codmAccountPoolTable).where(eq(codmAccountPoolTable.isClaimed, false));

  const pendingTopups = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "pending"));

  const totalCoins = await db
    .select({ total: sum(transactionsTable.amount) })
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "topup"));

  res.json({
    totalUsers: userCount.count,
    totalCoinsDistributed: Number(totalCoins[0]?.total ?? 0),
    totalGenerations: genCount.count,
    pendingTopups: pendingTopups[0].count,
    totalRevenue: Number(totalCoins[0]?.total ?? 0),
    totalCodmGenerated: codmCount.count,
    codmPoolTotal: codmPoolTotal.count,
    codmPoolAvailable: codmPoolAvail.count,
  });
});

router.get("/admin/recent-logins", requireAdmin, async (_req, res): Promise<void> => {
  const events = await db
    .select({
      id: loginEventsTable.id,
      userId: loginEventsTable.userId,
      username: usersTable.username,
      email: usersTable.email,
      loginAt: loginEventsTable.loginAt,
    })
    .from(loginEventsTable)
    .leftJoin(usersTable, eq(loginEventsTable.userId, usersTable.id))
    .orderBy(desc(loginEventsTable.loginAt))
    .limit(50);

  res.json(events.map(e => ({
    id: e.id,
    userId: e.userId,
    username: e.username ?? "Unknown",
    email: e.email ?? "Unknown",
    loginAt: e.loginAt.toISOString(),
  })));
});

router.get("/admin/pending-topups", requireAdmin, async (_req, res): Promise<void> => {
  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "pending"))
    .orderBy(desc(transactionsTable.createdAt));

  const result = await Promise.all(txs.map(async tx => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tx.userId));
    return {
      id: tx.id,
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      reference: tx.reference ?? null,
      note: tx.note ?? null,
      createdAt: tx.createdAt.toISOString(),
      user: formatUser(user),
    };
  }));

  res.json(result);
});

router.post("/admin/codm-pool", requireAdmin, async (req, res): Promise<void> => {
  const { content } = req.body as { content: unknown };

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Content required" });
    return;
  }

  const accounts = parseCodmAccounts(content);

  if (accounts.length === 0) {
    res.status(400).json({ error: "No valid accounts found. Make sure the format includes Username, Password fields." });
    return;
  }

  for (const acc of accounts) {
    await db.insert(codmAccountPoolTable).values({
      rawText: acc.rawText,
      username: acc.username,
      password: acc.password,
      nickname: acc.nickname,
      uid: acc.uid,
      level: acc.level,
      region: acc.region,
      accountStatus: acc.accountStatus,
      isClaimed: false,
    });
  }

  res.json({ inserted: accounts.length, message: `Successfully added ${accounts.length} account(s) to pool.` });
});

router.get("/admin/codm-pool", requireAdmin, async (_req, res): Promise<void> => {
  const accounts = await db
    .select()
    .from(codmAccountPoolTable)
    .orderBy(desc(codmAccountPoolTable.createdAt));

  res.json(accounts.map(a => ({
    id: a.id,
    username: a.username,
    nickname: a.nickname,
    uid: a.uid,
    level: a.level,
    region: a.region,
    accountStatus: a.accountStatus,
    isClaimed: a.isClaimed,
    claimedAt: a.claimedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.get("/admin/codm-pool/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [total] = await db.select({ count: count() }).from(codmAccountPoolTable);
  const [claimed] = await db.select({ count: count() }).from(codmAccountPoolTable).where(eq(codmAccountPoolTable.isClaimed, true));

  res.json({
    total: Number(total.count),
    claimed: Number(claimed.count),
    available: Number(total.count) - Number(claimed.count),
  });
});

router.patch("/users/:id/ban", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const { isBanned } = req.body as { isBanned: unknown };

  const [user] = await db
    .update(usersTable)
    .set({ isBanned: !!isBanned })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.get("/admin/config/pricing", requireAdmin, async (_req, res): Promise<void> => {
  const configs = await db
    .select()
    .from(siteConfigTable)
    .where(inArray(siteConfigTable.key, ["generator_pricing", "codm_pricing"]));

  const result: Record<string, unknown> = {};
  for (const config of configs) {
    try { result[config.key] = JSON.parse(config.value); } catch { result[config.key] = config.value; }
  }

  if (!result.generator_pricing) result.generator_pricing = { 1000: 10, 2000: 20, 3000: 30, 4000: 40, 5000: 50 };
  if (!result.codm_pricing) result.codm_pricing = { 1: 50, 2: 80, 3: 120 };

  res.json(result);
});

router.patch("/admin/config/pricing", requireAdmin, async (req, res): Promise<void> => {
  const { generator_pricing, codm_pricing } = req.body as {
    generator_pricing?: Record<string, number>;
    codm_pricing?: Record<string, number>;
  };

  if (generator_pricing) {
    await db.insert(siteConfigTable)
      .values({ key: "generator_pricing", value: JSON.stringify(generator_pricing) })
      .onConflictDoUpdate({
        target: siteConfigTable.key,
        set: { value: JSON.stringify(generator_pricing), updatedAt: new Date() },
      });
  }

  if (codm_pricing) {
    await db.insert(siteConfigTable)
      .values({ key: "codm_pricing", value: JSON.stringify(codm_pricing) })
      .onConflictDoUpdate({
        target: siteConfigTable.key,
        set: { value: JSON.stringify(codm_pricing), updatedAt: new Date() },
      });
  }

  res.json({ success: true });
});

export default router;
