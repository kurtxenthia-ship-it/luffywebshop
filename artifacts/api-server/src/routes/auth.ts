import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, loginEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const router: IRouter = Router();

function generateUserId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "LXO-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    userId: user.userId,
    email: user.email,
    username: user.username,
    balance: user.balance,
    isAdmin: user.isAdmin,
    isBanned: user.isBanned,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { email, password, username } = parsed.data;

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateUserId();

    const [user] = await db.insert(usersTable).values({
      email,
      username,
      passwordHash,
      userId,
      balance: 0,
      isAdmin: false,
      isBanned: false,
    }).returning();

    req.session.userId = user.id;

    req.log.info({ userId: user.id }, "User registered");

    res.status(201).json({
      user: formatUser(user),
      token: userId,
    });
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { email, password } = parsed.data;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: "Your account has been banned. Contact support." });
      return;
    }

    await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));
    await db.insert(loginEventsTable).values({ userId: user.id });

    req.session.userId = user.id;
    req.log.info({ userId: user.id }, "User logged in");

    const updatedUser = { ...user, lastLoginAt: new Date() };

    res.json({
      user: formatUser(updatedUser),
      token: user.userId,
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      logger.error({ err }, "Error destroying session");
    }
  });
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (user.isBanned) {
      req.session.destroy(() => {});
      res.status(403).json({ error: "Your account has been banned." });
      return;
    }

    res.json(formatUser(user));
  } catch (err) {
    logger.error({ err }, "Auth me error");
    res.status(500).json({ error: "Failed to get user info." });
  }
});

export default router;
