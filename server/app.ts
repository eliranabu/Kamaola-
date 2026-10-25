/** Express app for the API only (no static/Vite, no listen) so it can be tested in isolation. */

import express from 'express';
import { parseInsights } from '../src/services/insights.ts';
import { validateInsightsBody } from './validate.ts';
import { createRateLimiter } from './rateLimit.ts';
import { buildInsightsPrompt } from './prompt.ts';

export type GenerateFn = (prompt: string) => Promise<string | null | undefined>;

export interface AppOptions {
  /** Returns the model's raw text, or undefined when no API key is configured. */
  generate?: GenerateFn;
  rateLimit?: { windowMs: number; max: number; now?: () => number };
  timeoutMs?: number;
  trustProxyHops?: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function createApp(options: AppOptions = {}) {
  const { generate, timeoutMs = 15_000, trustProxyHops = 0 } = options;
  const limiter = createRateLimiter(options.rateLimit ?? { windowMs: 60_000, max: 10 });
  const app = express();

  app.set('trust proxy', trustProxyHops);
  app.disable('x-powered-by');
  app.use('/api', express.json({ limit: '2kb' }));

  app.post('/api/insights', async (req, res) => {
    const limit = limiter(req.ip || 'unknown');
    if (!limit.allowed) {
      res.set('Retry-After', String(limit.retryAfterSec));
      return res.status(429).json({ error: 'rate_limited' });
    }

    const body = validateInsightsBody(req.body);
    if (!body.ok) return res.status(400).json({ error: body.error });
    if (!generate) return res.status(503).json({ error: 'insights_unavailable' });

    try {
      const text = await withTimeout(generate(buildInsightsPrompt(body.value)), timeoutMs);
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text || '');
      } catch {
        parsed = null;
      }
      const insights = parseInsights(parsed);
      if (!insights) return res.status(502).json({ error: 'bad_ai_response' });
      return res.json(insights);
    } catch (error) {
      console.error('Insights generation failed:', (error as Error)?.message);
      return res.status(503).json({ error: 'insights_unavailable' });
    }
  });

  app.all('/api/*', (_req, res) => res.status(404).json({ error: 'not_found' }));

  // JSON body errors (too large / malformed) -> JSON responses with correct status
  // Express recognises error handlers by their 4-argument signature, so `_next` must stay.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err?.type === 'entity.too.large' ? 413 : err?.status && err.status < 500 ? err.status : 500;
    res.status(status).json({ error: status === 413 ? 'payload_too_large' : 'bad_request' });
  });

  return app;
}
