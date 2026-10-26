# Despliegue independiente · 26 octubre 2026

## Estado comprobado

- Publicación y acceso público autorizados expresamente por la propietaria.
- URL: https://cantalove.vercel.app; Cantalovergas: https://cantalove.vercel.app/rgas.
- Proyecto exclusivo `cantalove`, ID `prj_XG4qXUtrINcX4p2rtUuvvX56fZis`, equipo `team_OGKRO0ueAPoA1XgiWNHTK4GB`.
- El bloqueo HTTP403 de Vercel fue resuelto. No pedir otra autorización de equipo salvo que la API vuelva a requerirla.
- Despliegue desde un SHA revisado de `codex/cantalove-launch-readiness`, raíz de aplicación `cantalove`; no desde la raíz Xamans. El PR #3 sigue sin fusionarse.
- La página pública no exige iniciar sesión en Vercel. Los pedidos, audios y descargas conservan autorización propia por correo verificado.
- `GENERATION_ENABLED=false`, `CHECKOUT_ENABLED=false`, `LEGAL_APPROVED=false`, `MP_ENVIRONMENT=sandbox`, `MP_ENABLE_LIVE_PAYMENTS=false` configurados explícitamente en Vercel para production y preview.
- `NEXT_PUBLIC_SITE_URL=https://cantalove.vercel.app` hasta que el dominio final tenga HTTPS operativo.
- Las credenciales de servicios siguen pendientes. Página pública disponible no equivale a apertura comercial.

## IONOS: conexión pendiente, sin transferencia del dominio

`cantalove.com` pertenece a la usuaria y sigue en IONOS. Vercel ya tiene el dominio agregado y verificado, pero DNS sigue apuntando a `74.208.236.166`, por lo que todavía no sirve este despliegue.

Lectura de la API de Vercel el 26 octubre 2026: conjunto IPv4 recomendado de rango 1: `216.198.79.1` y `64.29.17.1`. Para el dominio raíz, sustituir el A que apunta al alojamiento anterior por los registros A recomendados del proyecto. Comprobar los valores de nuevo en Vercel inmediatamente antes de guardar; no mezclar la IP anterior con las nuevas.

No cambiar servidores de nombres ni borrar registros MX, SPF, DKIM, DMARC o de otros servicios. Revisar también AAAA y redirecciones existentes antes de migrar para evitar tráfico dividido. La usuaria debe abrir DNS de cantalove.com en IONOS; no hay conexión IONOS disponible para efectuar el cambio desde este entorno.

`www.cantalove.com` ya fue agregado al proyecto, verificado y configurado como redirección 308 a cantalove.com. Vercel recomienda CNAME `23ca5c5a41cb3a96.vercel-dns-017.com.` en la lectura actual; obtener configuración exacta de www antes de aplicarla.

Después de propagar: validar apex/www, certificado TLS, redirección canónica y actualizar NEXT_PUBLIC_SITE_URL. Volver a desplegar y actualizar las URL de correo y webhook en el entorno correspondiente.

## Activación de integraciones

1. Crear o conectar Supabase exclusivo de Cantalove y aplicar `supabase/schema.sql` y `supabase/hardening.sql` tras revisar datos existentes. No usar MarketingCliniq.
2. Configurar secretos de `.env.example` en Vercel, nunca en GitHub ni el chat. `npm run check:config` revisa presencia sin imprimir valores; no certifica funcionamiento.
3. Verificar dominio y remitente Resend en DNS IONOS. Comprobar recepción real de OTP y correo de entrega con un destinatario de prueba autorizado.
4. Seleccionar modelo Anthropic accesible y cargar créditos/licencia Apiframe. `npm run smoke:suno` crea una prueba real independiente y guarda su estado privado para no duplicarla.
5. Pruebas de integración solo en preview protegido y datos ficticios. Para pruebas completas, aprobación legal/comercial correspondiente y flags explícitos. El sitio público permanece cerrado para generación/cobros mientras se prueba.
6. Mercado Pago México: comprador/vendedor de prueba diferentes; verificar vendedor y webhook sandbox. No procesar pagos reales durante QA.
7. Completar pruebas reales, licencia comercial, prestaciones, aviso y términos revisados, retención y canal de soporte antes de GO para ventas. Mantener Basic/VIP sin venta hasta resolución.
8. El paso a pagos reales requiere `MP_ENVIRONMENT=live` y `MP_ENABLE_LIVE_PAYMENTS=true`, cuenta habilitada y GO comercial documentado; no activarlos al introducir una clave.

## Verificación y recuperación

- `npm run check:public -- https://cantalove.vercel.app`: páginas públicas, cabeceras y denegación anónima; no genera canciones ni pagos. Node 24 admite `NODE_USE_ENV_PROXY=1` si el entorno requiere proxy.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e`.
- Build usa Webpack para evitar fallo de resolución de fuentes de Turbopack observado en Vercel. No tocar la configuración de Xamans.
- Si falla un despliegue nuevo, conservar el último READY del mismo proyecto; inspeccionar logs antes de reintentar. No reactivar flags para intentar arreglar un despliegue.
- No reintentar submits musicales o checkouts ambiguos sin reconciliar primero el proveedor.
