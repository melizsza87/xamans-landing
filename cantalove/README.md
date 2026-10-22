# Cantalove / Cantalovergas

Aplicación independiente de Next.js dentro de `/cantalove`. No se modifica el sitio Xamans de la raíz.

**Estado: NO GO para lanzamiento.** UI corregida según el mockup fotográfico de Drive y controles implementados; faltan credenciales, pruebas reales y revisión comercial/legal. No hay simulaciones en producción. La generación y el checkout permanecen desactivados por defecto.

## Ejecutar y verificar

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

Para un navegador ya instalado: `PW_CHROMIUM_PATH=/ruta/chromium npm run test:e2e`. El runner levanta servidor y navegador juntos. Las pruebas de webhook usan mocks explícitos; las de esquema ejecutan PostgreSQL local mediante PGlite. No son evidencia de pagos sandbox o generación real.

## Primera canción real con Suno

`npm run smoke:suno` requiere únicamente `APIFRAME_API_KEY`. Usa una letra original ficticia, solicita dos versiones a Suno vía Apiframe y guarda el job para retomar sin duplicarlo. No prueba checkout ni correo; no sustituye el recorrido completo del producto. Los audios/estado de prueba quedan fuera de Git. Un submit ambiguo exige reconciliación antes de reintentar.

## Infraestructura separada

1. Proyecto Supabase exclusivo para Cantalove. Aplicar `supabase/schema.sql`, después `supabase/hardening.sql`. No usar MarketingCliniq ni otra base de clientes. Antes de aplicar a una base existente: respaldo, revisar duplicados históricos y policies existentes de Storage. Los pedidos anónimos antiguos no se adjudican por suposición.
2. Configurar variables de `.env.example` en el proyecto de hosting Cantalove, raíz `cantalove`, nunca en Xamans. `AUTH_SECRET`: al menos 32 caracteres aleatorios, generado fuera del código.
3. Resend: dominio y remitente verificados. Códigos expiran a los 10 minutos; máximo cinco intentos por código. Sesión HttpOnly SameSite=Lax, 7 días, Secure en producción.
4. Anthropic: elegir `ANTHROPIC_MODEL` disponible en la cuenta. Apiframe: clave, créditos, modelo y derechos comerciales confirmados.
5. Mercado Pago: vendedor de prueba, comprador de prueba distinto, `MP_SELLER_ID`, token y secreto de webhook. HTTPS y `NEXT_PUBLIC_SITE_URL` del preview. Webhook `/api/mercadopago/webhook`, evento payment. Nunca probar con vendedor de producción. El servidor verifica `/users/me`, firmas y pago real en la API.
6. Activar `GENERATION_ENABLED`, `CHECKOUT_ENABLED` y `LEGAL_APPROVED` solo en preview cuando proceda. `MP_ENVIRONMENT=sandbox`, `MP_ENABLE_LIVE_PAYMENTS=false` durante toda prueba.
7. Generar una canción real, escuchar ambas versiones, comprar en sandbox, probar aprobado/pendiente/rechazado, reembolso, duplicados, correo y descarga con dos navegadores distintos. Documentar IDs privados y costos sin publicarlos.

## Producto

`/` y `/rgas` → formulario de tres pasos → código de correo → letra → job musical asíncrono → `/preview/:id` → escucha completa gratuita → Premium $449 MXN → checkout → webhook → `/descarga/:id` + correo. `/recuperar` exige código nuevo y lista solo pedidos del correo verificado.

Una reserva gratuita por correo, única en PostgreSQL. Peticiones simultáneas no crean otra orden/canción. Una vez enviado un job, no se repite un POST automáticamente. Si el proveedor recibe un trabajo pero no devuelve su ID, se requiere reconciliación: no se sacrifica seguridad presupuestal fingiendo una recuperación automática.

Ambos MP3 se copian a bucket privado antes de ofrecer compra; el navegador escucha mediante proxy autorizado. Descargas con sesión propia, pago aprobado y enlaces de 60 segundos. La escucha puede grabarse; no se promete protección absoluta. No hay enlace de compartir pedidos privados.

Básico $249 y VIP $899 permanecen visibles sin venta. No se anuncian stems, karaoke ni revisiones ilimitadas como entregables disponibles. Premium exige dos archivos presentes antes de checkout. Duración y dueto son indicaciones aproximadas del proveedor.

## Recuperación y operación

- Letra interrumpida o submit musical sin confirmación: recuperar pedido y reconciliar en consola del proveedor antes de cambiar estados. No borrar límites para reintentar sin verificar cargos.
- Checkout guardado: se recupera la preferencia y se vuelve a verificar vendedor, precio, moneda y referencia. Estado `creating`: revisar proveedor y persistir su ID; no crear otra preferencia a ciegas.
- Correo ambiguo: idempotencia Resend + lease de entrega; tras 23 horas sin confirmación se exige reconciliación para evitar duplicados fuera de la ventana del proveedor.
- Reembolso/contracargo revoca nuevas descargas. No puede retirar un archivo ya descargado ni una URL firmada ya emitida antes de su expiración.
- Polling reanuda al volver a preview. No hay worker durable independiente del navegador todavía; el proveedor continúa procesando, pero la importación se completa al consultar el pedido.
- Revisar periódicamente consumo, saldo, costos, límites y retención. No hay borrado programado ni SLA/soporte operativo todavía: definirlos antes de lanzamiento.

Referencia visual vigente: mockup comparativo de Drive confirmado expresamente por la usuaria. Ver `docs/CORRECCION_VISUAL.md`; el prototipo HTML anterior ya no es la referencia visual principal.

Ver [informe de entrega](docs/ENTREGA.md), [matriz](docs/PRUEBAS.md), [decisiones](docs/DECISIONES.md), [despliegue](docs/DESPLIEGUE.md) y consultas de métricas en `ops/funnel.sql`.
