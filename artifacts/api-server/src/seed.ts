import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error(
      "SEED_ADMIN_PASSWORD environment variable is required to run the seed script."
    );
    process.exit(1);
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, adminUsername))
    .limit(1);

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.insert(usersTable).values({
      username: adminUsername,
      passwordHash,
      role: "admin",
    });
    console.log(`Admin user created: ${adminUsername}`);
  } else {
    console.log("Admin user already exists");
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
