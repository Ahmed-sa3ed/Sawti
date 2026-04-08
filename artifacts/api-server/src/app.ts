import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    role?: "user" | "admin";
  }
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Build allowed origins from environment:
// - REPLIT_DOMAINS contains comma-separated list of domains for this Repl
// - Additional origins can be added via CORS_ALLOWED_ORIGINS
function buildAllowedOrigins(): string[] {
  const origins: string[] = [];
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    replitDomains.split(",").forEach((d) => {
      const domain = d.trim();
      if (domain) {
        origins.push(`https://${domain}`);
      }
    });
  }
  const extraOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (extraOrigins) {
    extraOrigins.split(",").forEach((o) => {
      const origin = o.trim();
      if (origin) origins.push(origin);
    });
  }
  // Always allow localhost in development
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:80");
    origins.push("http://localhost:3000");
    origins.push("http://localhost:5173");
  }
  return origins;
}

const allowedOrigins = buildAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (no Origin header)
      if (!origin) return callback(null, true);
      // Allow if origin is in the allowed list, or if it ends with a Replit domain
      const allowed =
        allowedOrigins.includes(origin) ||
        /\.repl\.co$/.test(origin) ||
        /\.replit\.app$/.test(origin) ||
        /\.replit\.dev$/.test(origin) ||
        /\.picard\.replit\.dev$/.test(origin);
      if (allowed) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/api", router);

async function ensureSeedUsers() {
  if (process.env.NODE_ENV !== "production") return;

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

ensureSeedUsers().catch((err) => logger.error({ err }, "Failed to seed default users"));

export default app;
