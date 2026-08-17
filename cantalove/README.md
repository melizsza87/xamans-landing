# cantalove.com

Plataforma de canciones personalizadas con IA para el mercado mexicano.
Next.js (App Router) + Vercel + Supabase + MercadoPago + Claude API + Suno
(vía Apiframe) + Resend.

## Regla de seguridad no negociable

Ninguna API key sale del servidor. `ANTHROPIC_API_KEY`, `APIFRAME_API_KEY`,
`MP_ACCESS_TOKEN` y `SUPABASE_SERVICE_ROLE_KEY` sólo existen como variables
de entorno del servidor. Las API routes en `src/app/api/**` (`lib/*.ts`
importan `server-only`) son el único punto de contacto con Anthropic,
Apiframe, MercadoPago y Supabase — el navegador nunca las llama
directamente. Sólo las variables con prefijo `NEXT_PUBLIC_` llegan al
cliente, y hoy ninguna ruta del frontend las necesita.

## Flujo del producto

1. `/` → el usuario llena el formulario de personalización en `/crear`.
2. `POST /api/generate-lyrics` → llama a Claude, crea la orden en Supabase y
   devuelve la letra generada.
3. `POST /api/generate-song` → llama a Suno vía Apiframe con esa letra y
   devuelve la URL del preview.
4. `/preview/[orderId]` → reproductor real, corta el audio a los 30s y
   muestra el gate de pago con los 3 tiers.
5. El usuario elige un tier → `POST /api/checkout` crea una preferencia de
   MercadoPago y redirige al checkout hospedado.
6. `POST /api/mercadopago/webhook` verifica la notificación, marca la orden
   como pagada, sube el track completo a Supabase Storage y dispara el
   email de entrega vía Resend.
7. `/descarga/[orderId]` sólo muestra la descarga si la orden está pagada en
   Supabase (`GET /api/download/[orderId]` genera una URL firmada).

## Setup paso a paso

### 1. Clonar e instalar

```bash
cd cantalove
npm install
```

### 2. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, corre el contenido de `supabase/schema.sql`. Esto
   crea las tablas `orders`, `personalizations`, `songs` con RLS activado
   (sin políticas públicas — sólo la service role tiene acceso) y el bucket
   privado de Storage `tracks` para los tracks completos ya pagados.
3. Copia `Project URL` y la `service_role` key desde **Project Settings →
   API** a `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Claude (Anthropic)

1. Genera una API key en [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. Colócala en `ANTHROPIC_API_KEY`.

### 4. Apiframe (Suno)

1. Crea una cuenta en [apiframe.ai](https://apiframe.ai) y genera tu API key.
2. Colócala en `APIFRAME_API_KEY`.
3. `src/lib/apiframe.ts` asume los endpoints documentados actualmente en
   [docs.apiframe.ai](https://docs.apiframe.ai) para generación de Suno
   (`/suno/custom-generate`) y consulta de tareas (`/fetch`). Verifica esos
   nombres de campo contra la documentación vigente antes de ir a
   producción — Apiframe puede actualizar su contrato.
4. La generación de música puede tardar varios minutos. `/api/generate-song`
   declara `export const maxDuration = 300`, lo cual requiere un plan de
   Vercel que soporte duración extendida de funciones (Pro o superior).

### 5. MercadoPago

1. En tus [credenciales de integración](https://www.mercadopago.com/developers/panel/app),
   copia el `Access Token` a `MP_ACCESS_TOKEN` y la `Public Key` a
   `MP_PUBLIC_KEY` / `NEXT_PUBLIC_MP_PUBLIC_KEY`.
2. Configura un webhook apuntando a
   `https://tu-dominio.com/api/mercadopago/webhook`, suscrito al evento
   `payment`.
3. Copia la **firma secreta** del webhook a `MP_WEBHOOK_SECRET` — sin esto
   `/api/mercadopago/webhook` rechaza todas las notificaciones (por diseño).
4. Los precios están centralizados en `src/lib/pricing.ts` — el cliente
   nunca envía el monto, sólo el `tier`, así que edítalos ahí si cambian.

### 6. Resend

1. Verifica tu dominio de envío en [resend.com](https://resend.com/domains).
2. Genera una API key y colócala en `RESEND_API_KEY`.
3. Ajusta `RESEND_FROM_EMAIL` a un remitente de tu dominio verificado.

### 7. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena todos los valores — ver `.env.example` para la lista completa y
comentada de cada variable, incluyendo `NEXT_PUBLIC_SITE_URL` (usada para
construir los `back_urls` de MercadoPago, el `notification_url` del webhook
y los links de los emails de Resend).

### 8. Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para probar el flujo
de pago completo en local necesitas exponer tu servidor con un túnel (p. ej.
`ngrok`) y apuntar `NEXT_PUBLIC_SITE_URL` y el webhook de MercadoPago a esa
URL pública.

### 9. Deploy en Vercel

1. Importa el repo en Vercel, seleccionando `cantalove/` como root
   directory del proyecto.
2. Configura todas las variables de `.env.example` en **Project Settings →
   Environment Variables**.
3. Verifica que el plan de Vercel soporte `maxDuration = 300` para
   `/api/generate-song` (ver sección Apiframe arriba).
4. Actualiza `NEXT_PUBLIC_SITE_URL` con el dominio final y vuelve a
   configurar el webhook de MercadoPago con esa URL.

## Estructura

```
cantalove/
├── supabase/schema.sql          # Tablas, RLS, bucket de Storage
├── src/
│   ├── app/
│   │   ├── page.tsx             # Landing (/)
│   │   ├── crear/                # Formulario de personalización
│   │   ├── preview/[orderId]/    # Player + gate de pago + tiers
│   │   ├── descarga/[orderId]/   # Descarga tras pago confirmado
│   │   └── api/
│   │       ├── generate-lyrics/
│   │       ├── generate-song/
│   │       ├── checkout/
│   │       ├── mercadopago/webhook/
│   │       └── download/[orderId]/(lyrics)/
│   ├── components/               # UI por página (landing, crear, preview, descarga)
│   └── lib/                      # Clientes server-only: supabase, anthropic,
│                                  # apiframe, mercadopago, resend, pricing
└── .env.example
```
