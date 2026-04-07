import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }
  if (req.session.role !== "user") {
    res.status(403).json({ error: "غير مسموح" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "غير مسموح" });
    return;
  }
  next();
}
