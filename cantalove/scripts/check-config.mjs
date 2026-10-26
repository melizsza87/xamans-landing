// Read-only local preflight. Never prints values or calls paid providers.
import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const groups = {
  'Pedidos privados': ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'AUTH_SECRET'],
  'Letras': ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL'],
  'Música': ['APIFRAME_API_KEY', 'APIFRAME_MODEL_VERSION'],
  'Correo': ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
  'Pago sandbox': ['MP_ACCESS_TOKEN', 'MP_SELLER_ID', 'MP_WEBHOOK_SECRET'],
};
let pending = false;
for (const [name, keys] of Object.entries(groups)) {
  const missing = keys.filter(key => !process.env[key]?.trim());
  if (missing.length) pending = true;
  console.log(`${name}: ${missing.length ? `PENDIENTE (${missing.join(', ')})` : 'variables presentes; falta prueba real'}`);
}
if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
  pending = true;
  console.log('AUTH_SECRET: debe tener al menos 32 caracteres aleatorios.');
}
try {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') throw new Error();
} catch {
  pending = true;
  console.log('NEXT_PUBLIC_SITE_URL: falta un origen HTTPS válido, sin ruta ni credenciales.');
}
if (process.env.MP_ENVIRONMENT !== 'sandbox' || process.env.MP_ENABLE_LIVE_PAYMENTS === 'true') {
  pending = true;
  console.log('Pruebas: requiere MP_ENVIRONMENT=sandbox y cobros reales desactivados.');
}
for (const key of ['GENERATION_ENABLED', 'CHECKOUT_ENABLED', 'LEGAL_APPROVED']) {
  console.log(`${key}: ${process.env[key] === 'true' ? 'ACTIVO; comprobar autorización y evidencia' : 'desactivado'}`);
}
console.log('Este preflight no verifica saldo, licencias, DNS, esquema, entrega, pagos ni aprobación legal.');
process.exitCode = pending ? 1 : 0;
