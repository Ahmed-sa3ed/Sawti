import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const userUsername = process.env.SEED_USER_USERNAME ?? "user";
  const userPassword = process.env.SEED_USER_PASSWORD ?? "user123";

  const existingAdmin = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, adminUsername))
    .limit(1);

  if (existingAdmin.length === 0) {
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

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, userUsername))
    .limit(1);

  if (existingUser.length === 0) {
    const passwordHash = await bcrypt.hash(userPassword, 10);
    await db.insert(usersTable).values({
      username: userUsername,
      passwordHash,
      role: "user",
    });
    console.log(`Starter user created: ${userUsername}`);
  } else {
    console.log("Starter user already exists");
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
