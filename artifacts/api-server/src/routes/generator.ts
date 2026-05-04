import { Router, type IRouter, type Request } from "express";
import { db, txtFilesTable, generationHistoryTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { UploadTxtFileBody, GenerateTxtBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { formatUser } from "./auth";

const router: IRouter = Router();

type UserRequest = Request & { user: typeof usersTable.$inferSelect };

const COIN_COSTS: Record<number, number> = {
  50: 20,
  100: 40,
  200: 80,
};

router.get("/generator/files", requireAuth, async (_req, res): Promise<void> => {
  const files = await db.select({
    id: txtFilesTable.id,
    name: txtFilesTable.name,
    totalLines: txtFilesTable.totalLines,
    createdAt: txtFilesTable.createdAt,
  }).from(txtFilesTable).orderBy(desc(txtFilesTable.createdAt));

  res.json(files.map(f => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  })));
});

router.post("/generator/files", requireAdmin, async (req: Request, res): Promise<void> => {
  const body = UploadTxtFileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const lines = body.data.content.split("\n").filter(l => l.trim().length > 0);
  const totalLines = lines.length;

  const [file] = await db.insert(txtFilesTable).values({
    name: body.data.name,
    content: body.data.content,
    totalLines,
  }).returning();

  res.status(201).json({
    id: file.id,
    name: file.name,
    totalLines: file.totalLines,
    createdAt: file.createdAt.toISOString(),
  });
});

router.post("/generator/generate", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;

  const body = GenerateTxtBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { fileId, lineCount } = body.data;
  const coinsRequired = COIN_COSTS[lineCount];

  if (coinsRequired == null) {
    res.status(400).json({ error: "Invalid line count. Choose 50, 100, or 200." });
    return;
  }

  if (user.balance < coinsRequired) {
    res.status(402).json({ error: `Insufficient coins. Need ${coinsRequired} coins but you have ${user.balance}.` });
    return;
  }

  const [file] = await db.select().from(txtFilesTable).where(eq(txtFilesTable.id, fileId));
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const allLines = file.content.split("\n").filter(l => l.trim().length > 0);
  const shuffled = allLines.sort(() => Math.random() - 0.5);
  const selectedLines = shuffled.slice(0, Math.min(lineCount, allLines.length));

  await db.update(usersTable).set({ balance: user.balance - coinsRequired }).where(eq(usersTable.id, user.id));

  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "spend",
    amount: coinsRequired,
    status: "approved",
    note: `Generated ${lineCount} lines from "${file.name}"`,
  });

  await db.insert(generationHistoryTable).values({
    userId: user.id,
    fileId: file.id,
    lineCount,
    coinsSpent: coinsRequired,
  });

  res.json({
    lines: selectedLines,
    coinsSpent: coinsRequired,
    remainingBalance: user.balance - coinsRequired,
  });
});

router.get("/generator/history", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;

  const history = await db
    .select({
      id: generationHistoryTable.id,
      fileId: generationHistoryTable.fileId,
      fileName: txtFilesTable.name,
      lineCount: generationHistoryTable.lineCount,
      coinsSpent: generationHistoryTable.coinsSpent,
      createdAt: generationHistoryTable.createdAt,
    })
    .from(generationHistoryTable)
    .leftJoin(txtFilesTable, eq(generationHistoryTable.fileId, txtFilesTable.id))
    .where(eq(generationHistoryTable.userId, user.id))
    .orderBy(desc(generationHistoryTable.createdAt));

  res.json(history.map(h => ({
    id: h.id,
    fileId: h.fileId,
    fileName: h.fileName ?? "Unknown",
    lineCount: h.lineCount,
    coinsSpent: h.coinsSpent,
    createdAt: h.createdAt.toISOString(),
  })));
});

export default router;
