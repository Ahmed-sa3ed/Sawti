import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function ensureSeedUsers() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const userUsername = process.env.SEED_USER_USERNAME ?? "user";
  const userPassword = process.env.SEED_USER_PASSWORD ?? "user123";

  const adminExists = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, adminUsername))
    .limit(1);

  if (adminExists.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.insert(usersTable).values({
      username: adminUsername,
      passwordHash,
      role: "admin",
    });
    logger.info({ username: adminUsername }, "Seeded admin user");
  }

  const userExists = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, userUsername))
    .limit(1);

  if (userExists.length === 0) {
    const passwordHash = await bcrypt.hash(userPassword, 10);
    await db.insert(usersTable).values({
      username: userUsername,
      passwordHash,
      role: "user",
    });
    logger.info({ username: userUsername }, "Seeded starter user");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

ensureSeedUsers()
  .catch((err) => logger.error({ err }, "Failed to seed default users"))
  .finally(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  });
