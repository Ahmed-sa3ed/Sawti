import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    role?: "user" | "admin";
  }
}

const app: Express = express();

// Trust the first proxy (Replit's edge / TLS terminator).
// Without this, req.secure is false (HTTP internally) even though
// the browser connected over HTTPS, and express-session refuses to
// send the Secure session cookie, breaking auth in production.
app.set("trust proxy", 1);

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

export default app;
