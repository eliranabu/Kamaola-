/** F-18: security headers on every response; strict self-only CSP in production. */
import type { AddressInfo } from 'net';
import { check, finish } from './harness.ts';
import { createApp } from '../server/app.ts';
import { CONTENT_SECURITY_POLICY } from '../server/security.ts';

async function head(opts: Parameters<typeof createApp>[0], path: string) {
  const server = createApp(opts).listen(0);
  try {
    return await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`);
  } finally {
    server.close();
  }
}

const prod = await head({ csp: true }, '/api/nope');
check('production responses carry the CSP', prod.headers.get('content-security-policy') === CONTENT_SECURITY_POLICY);
check('CSP allows only same-origin sources (no wildcard / http(s) hosts / unsafe-eval / inline scripts)', !/(\*|https?:|unsafe-eval)/.test(CONTENT_SECURITY_POLICY) && /script-src 'self'(;|$)/.test(CONTENT_SECURITY_POLICY) && !/script-src[^;]*unsafe-inline/.test(CONTENT_SECURITY_POLICY));
check('CSP forbids framing, plugins and foreign base/form targets', ['frame-ancestors \'none\'', 'object-src \'none\'', 'base-uri \'self\'', 'form-action \'self\''].every((d) => CONTENT_SECURITY_POLICY.includes(d)));
check('inline style is limited to style attributes', CONTENT_SECURITY_POLICY.includes("style-src 'self'") && CONTENT_SECURITY_POLICY.includes("style-src-attr 'unsafe-inline'"));
check('nosniff, no-referrer, permissions policy and COOP are set', prod.headers.get('x-content-type-options') === 'nosniff' && prod.headers.get('referrer-policy') === 'no-referrer' && (prod.headers.get('permissions-policy') ?? '').includes('camera=()') && prod.headers.get('cross-origin-opener-policy') === 'same-origin');
check('x-powered-by is not disclosed', prod.headers.get('x-powered-by') === null);

const dev = await head({}, '/api/nope');
check('dev mode (Vite HMR) gets base headers but no CSP', dev.headers.get('content-security-policy') === null && dev.headers.get('x-content-type-options') === 'nosniff');

finish('security');
