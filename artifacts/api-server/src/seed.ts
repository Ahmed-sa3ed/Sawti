import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, "admin"))
    .limit(1);

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(usersTable).values({
      username: "admin",
      passwordHash,
      role: "admin",
    });
    console.log("Admin user created: admin / admin123");
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
