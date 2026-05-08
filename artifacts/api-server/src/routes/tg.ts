import { Router, type IRouter, type Request } from "express";
import { requireAuth } from "../middlewares/auth";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
type UserRequest = Request & { user: typeof usersTable.$inferSelect };

const BOT_TOKEN = "8449404840:AAEYKk3aaaAqsP8n66tyFcUvwkr0PDkyEWs";
const COIN_COST = 5;

router.post("/tg/lookup", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;
  const { userId } = req.body as { userId?: string };

  if (!userId || !/^\d+$/.test(String(userId).trim())) {
    res.status(400).json({ error: "Invalid Telegram user ID. Must be numeric." });
    return;
  }

  if (user.balance < COIN_COST) {
    res.status(402).json({ error: `Need ${COIN_COST} coins. You have ${user.balance}.` });
    return;
  }

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${userId.trim()}`,
      { signal: AbortSignal.timeout(12000) }
    );
    const tgData = await tgRes.json() as {
      ok: boolean;
      result?: {
        id: number;
        type: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        bio?: string;
        photo?: { small_file_id: string };
        has_private_forwards?: boolean;
        is_verified?: boolean;
        is_premium?: boolean;
      };
      description?: string;
    };

    if (!tgData.ok || !tgData.result) {
      res.json({
        found: false,
        error: tgData.description ?? "User not found or has not interacted with the lookup bot.",
        coinsSpent: 0,
      });
      return;
    }

    await db.update(usersTable).set({ balance: user.balance - COIN_COST }).where(eq(usersTable.id, user.id));
    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "spend",
      amount: COIN_COST,
      status: "approved",
      note: `TG Lookup: ${userId.trim()}`,
    });

    const r = tgData.result;
    let photoUrl: string | null = null;

    if (r.photo?.small_file_id) {
      try {
        const fileRes = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${r.photo.small_file_id}`,
          { signal: AbortSignal.timeout(8000) }
        );
        const fileData = await fileRes.json() as { ok: boolean; result?: { file_path?: string } };
        if (fileData.ok && fileData.result?.file_path) {
          photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
        }
      } catch {}
    }

    res.json({
      found: true,
      coinsSpent: COIN_COST,
      remainingBalance: user.balance - COIN_COST,
      data: {
        id: r.id,
        firstName: r.first_name ?? null,
        lastName: r.last_name ?? null,
        username: r.username ? `@${r.username}` : null,
        bio: r.bio ?? null,
        type: r.type,
        isPremium: r.is_premium ?? false,
        isVerified: r.is_verified ?? false,
        photoUrl,
        phoneNote: "Phone numbers are private and not exposed by the Telegram API.",
        nameHistoryNote: "Name history is not available via the official Telegram Bot API.",
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to reach Telegram API. Try again." });
  }
});

export default router;
