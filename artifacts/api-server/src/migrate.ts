import { pool } from "@workspace/db";
import { logger } from "./lib/logger";

export async function runMigrations() {
  const client = await pool.connect();
  try {
    logger.info("Running database migrations...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        balance INTEGER NOT NULL DEFAULT 0,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        is_banned BOOLEAN NOT NULL DEFAULT FALSE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reference TEXT,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS txt_files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        total_lines INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS generation_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        file_id INTEGER NOT NULL REFERENCES txt_files(id),
        line_count INTEGER NOT NULL,
        coins_spent INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS codm_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        account TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unknown',
        coins_spent INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS codm_account_pool (
        id SERIAL PRIMARY KEY,
        raw_text TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        nickname TEXT,
        uid TEXT,
        level INTEGER,
        region TEXT,
        account_status TEXT NOT NULL DEFAULT 'unknown',
        is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
        claimed_by_user_id INTEGER REFERENCES users(id),
        claimed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_config (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS login_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checker_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        filename TEXT NOT NULL DEFAULT 'upload.txt',
        file_content TEXT NOT NULL DEFAULT '',
        total_lines INTEGER NOT NULL,
        coins_spent INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        results JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      INSERT INTO site_config (key, value) VALUES
        ('generator_pricing', '{"1000":10,"2000":20,"3000":30,"4000":40,"5000":50}'),
        ('codm_pricing', '{"1":50,"2":80,"3":120}')
      ON CONFLICT (key) DO NOTHING;
    `);

    logger.info("Migrations complete.");
  } catch (err) {
    logger.error({ err }, "Migration failed");
    throw err;
  } finally {
    client.release();
  }
}
