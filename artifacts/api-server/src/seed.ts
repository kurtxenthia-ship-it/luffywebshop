import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";

const ADMIN_EMAIL = "kenzohaizen@gmail.com";
const ADMIN_PASSWORD = "kenzo213";
const ADMIN_USERNAME = "kenzo";
const ADMIN_USER_ID = "LXO-ADMIN001";

export async function seedAdmin() {
  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL));

    if (existing) {
      logger.info("Admin user already exists, skipping seed.");
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await db.insert(usersTable).values({
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      passwordHash,
      userId: ADMIN_USER_ID,
      balance: 0,
      isAdmin: true,
    });

    logger.info("Admin user seeded successfully.");
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}
