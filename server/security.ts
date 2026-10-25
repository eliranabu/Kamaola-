/** Security headers. The app is fully self-hosted (fonts, scripts, styles), so the CSP allows only 'self'. */

import type { RequestHandler } from 'express';

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'", // React inline style attributes (chart bars, progress) only
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

/** `csp: false` is for the Vite dev server, whose HMR needs inline/eval scripts. */
export function securityHeaders(options: { csp: boolean }): RequestHandler {
  return (_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    if (options.csp) res.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    next();
  };
}
