import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";

const router = Router();

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  const { username, password } = parsed.data;

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({ id: user.id, username: user.username, role: user.role });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "المستخدم غير موجود" });
    return;
  }

  res.json({ id: user.id, username: user.username, role: user.role });
});

export default router;
