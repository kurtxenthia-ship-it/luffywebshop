import { Router, type IRouter, type Request } from "express";
import { db, transactionsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { RequestTopupBody, ApproveTopupParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { formatUser } from "./auth";

const router: IRouter = Router();

type UserRequest = Request & { user: typeof usersTable.$inferSelect };

function formatTransaction(tx: typeof transactionsTable.$inferSelect, user: typeof usersTable.$inferSelect) {
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
}

router.get("/balance/transactions", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;

  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(desc(transactionsTable.createdAt));

  res.json(txs.map(tx => formatTransaction(tx, user)));
});

router.post("/balance/topup", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;

  const body = RequestTopupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [tx] = await db.insert(transactionsTable).values({
    userId: user.id,
    type: "topup",
    amount: body.data.amount,
    status: "pending",
    reference: body.data.reference,
    note: "GCash topup request",
  }).returning();

  res.status(201).json(formatTransaction(tx, user));
});

router.post("/balance/topup/:id/approve", requireAdmin, async (req: Request, res): Promise<void> => {
  const params = ApproveTopupParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if (tx.status !== "pending") {
    res.status(400).json({ error: "Transaction already processed" });
    return;
  }

  await db.update(transactionsTable).set({ status: "approved" }).where(eq(transactionsTable.id, tx.id));

  await db.update(usersTable)
    .set({ balance: usersTable.balance + tx.amount } as never)
    .where(eq(usersTable.id, tx.userId));

  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, tx.userId));
  const updatedTx = { ...tx, status: "approved" };

  res.json(formatTransaction(updatedTx, updatedUser));
});

export default router;
