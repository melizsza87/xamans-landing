// Anonymous HTTPS checks: no credentials, provider calls, orders or payments.
const base = new URL(process.argv[2] || 'https://cantalove.vercel.app');
if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/') {
  throw new Error('Indica únicamente el origen HTTPS público.');
}
const id = '00000000-0000-4000-8000-000000000000';
const results = [];
async function check(path, allowed, options = {}) {
  const response = await fetch(new URL(path, base), { ...options, redirect: 'manual', signal: AbortSignal.timeout(20000) });
  const ok = allowed.includes(response.status);
  results.push({ path, status: response.status, ok });
  if (path === '/') {
    results.push({ check: 'nosniff', ok: response.headers.get('x-content-type-options') === 'nosniff' });
    results.push({ check: 'frame-deny', ok: response.headers.get('x-frame-options') === 'DENY' });
  }
  await response.body?.cancel();
}
await check('/', [200]);
await check('/rgas', [200]);
await check('/recuperar', [200]);
await check('/api/orders', [401]);
for (const path of [`/api/orders/${id}`, `/api/listen/${id}`, `/api/download/${id}`, `/api/download/${id}/lyrics`, `/api/song-status/${id}`]) {
  await check(path, [401, 403, 404]);
}
await check('/api/auth/request', [403], { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://untrusted.invalid' }, body: '{}' });
await check('/api/auth/request', [415], { method: 'POST', headers: { 'content-type': 'text/plain', origin: base.origin }, body: '{}' });
console.log(JSON.stringify({ site: base.origin, checkedAt: new Date().toISOString(), results }, null, 2));
process.exitCode = results.every(r => r.ok) ? 0 : 1;
