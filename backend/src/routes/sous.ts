import { Router, Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { validateSousChatBody } from "../utils/validation.js";
import { runSousAgent } from "../utils/sousAgent.js";
import { openSousEventStream, wantsEventStream, writeSse } from "../utils/sse.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

router.use(authMiddleware);

router.post("/chat", async (req: AuthRequest, res) => {
  const parsed = validateSousChatBody((req.body ?? {}) as Record<string, unknown>);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({ error: "Sous is not configured yet." });
    return;
  }

  const stream = wantsEventStream(req);
  let keepAlive: ReturnType<typeof setInterval> | undefined;

  if (stream) {
    openSousEventStream(res);
    writeSse(res, "started", { ok: true });
    keepAlive = setInterval(() => {
      if (!res.writableEnded) res.write(": ping\n\n");
    }, 15_000);
    req.on("close", () => {
      if (keepAlive) clearInterval(keepAlive);
    });
  }

  try {
    const result = await runSousAgent(req.userId!, parsed.messages, {
      apiKey,
      onEvent: stream
        ? (event) => {
            if (!res.writableEnded) writeSse(res, event.type, event);
          }
        : undefined,
    });

    if (stream) {
      if (keepAlive) clearInterval(keepAlive);
      if (res.writableEnded) return;
      if (!result.ok) {
        writeSse(res, "error", { error: result.error, status: result.status });
        res.end();
        return;
      }
      writeSse(res, "reply", {
        reply: result.reply,
        ...(result.pendingAction ? { pendingAction: result.pendingAction } : {}),
      });
      res.end();
      return;
    }

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    if (result.pendingAction) {
      res.json({ reply: result.reply, pendingAction: result.pendingAction });
      return;
    }

    res.json({ reply: result.reply });
  } catch (err) {
    console.error(err);
    if (stream) {
      if (keepAlive) clearInterval(keepAlive);
      if (!res.writableEnded) {
        writeSse(res, "error", {
          error: "Sous could not reply right now. Try again.",
          status: 502,
        });
        res.end();
      }
      return;
    }
    if (!res.headersSent) {
      res.status(502).json({ error: "Sous could not reply right now. Try again." });
    }
  }
});

export { router as sousRouter };
