import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, generationHistoryTable, codmAccountsTable, loginEventsTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { formatUser } from "./auth";

const router: IRouter = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [genCount] = await db.select({ count: count() }).from(generationHistoryTable);
  const [codmCount] = await db.select({ count: count() }).from(codmAccountsTable);

  const pendingTopups = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "pending"));

  const totalCoins = await db
    .select({ total: sum(transactionsTable.amount) })
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "topup"));

  const totalSpend = await db
    .select({ total: sum(transactionsTable.amount) })
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "spend"));

  res.json({
    totalUsers: userCount.count,
    totalCoinsDistributed: Number(totalCoins[0]?.total ?? 0),
    totalGenerations: genCount.count,
    pendingTopups: pendingTopups[0].count,
    totalRevenue: Number(totalCoins[0]?.total ?? 0),
    totalCodmGenerated: codmCount.count,
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

export default router;
