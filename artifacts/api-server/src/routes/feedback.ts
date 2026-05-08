import { Router, type IRouter, type Request } from "express";
import { requireAuth } from "../middlewares/auth";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

const BOT_TOKEN = "8449404840:AAEYKk3aaaAqsP8n66tyFcUvwkr0PDkyEWs";
const OWNER_CHAT_ID = "6909792649";

router.post("/feedback", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as Request & { user: typeof usersTable.$inferSelect }).user;
  const { name, message } = req.body as { name?: string; message?: string };

  if (!name?.trim() || !message?.trim()) {
    res.status(400).json({ error: "Name and message are required." });
    return;
  }
  if (name.trim().length > 100) {
    res.status(400).json({ error: "Name too long." });
    return;
  }
  if (message.trim().length > 2000) {
    res.status(400).json({ error: "Message too long (max 2000 chars)." });
    return;
  }

  const text =
    `📣 *New Feedback — COZY XO.SHOP*\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Name:* ${name.trim()}\n` +
    `🆔 *User ID:* ${user.userId}\n` +
    `📧 *Email:* ${user.email}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `💬 *Message:*\n${message.trim()}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🕐 ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: OWNER_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
      signal: AbortSignal.timeout(10000),
    });

    const tgData = await tgRes.json() as { ok: boolean; description?: string };

    if (!tgData.ok) {
      res.status(500).json({ error: "Failed to send feedback. Try again later." });
      return;
    }

    res.json({ success: true, message: "Feedback sent successfully!" });
  } catch {
    res.status(500).json({ error: "Network error. Try again later." });
  }
});

export default router;
