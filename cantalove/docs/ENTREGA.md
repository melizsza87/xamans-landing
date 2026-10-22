# Entrega técnica · Cantalove + Cantalovergas

Fecha de revisión: 21 octubre 2026 (Monterrey). **Recomendación: NO GO para lanzamiento.** Hay implementación revisable y pruebas locales; no se declara producto comercial validado sin servicios reales.

## 1. Entorno de prueba y pull request

Rama: `codex/cantalove-launch-readiness`, base `main` (`20f5dc90c8d22bf7aaee91384dd4ee0b2336c5da`).

URL pública de prueba: **bloqueada** por Vercel HTTP403 al consultar el proyecto Cantalove de su equipo propietario. La conexión puede listar el proyecto pero no administrarlo. No se desplegó a producción ni se asignaron dominios. Véase `DESPLIEGUE.md` para recuperación y configuración exclusiva.

Pull request revisable: [#3](https://github.com/melizsza87/xamans-landing/pull/3) (draft, sin fusionar). Este archivo forma parte del mismo PR y de su evidencia revisable.

## 2. Comparación visual

Referencia principal: `cantalove_prototipo.html` recuperado de Library, 28,378 bytes. Mockup aprobado leído e inspeccionado; estilos incompatibles (fotografías rosa/azul/lima frente al HTML cálido/rojo con vinilo). Se reprodujo el HTML según el requerimiento de preservar composición/vinilo; discrepancia pendiente en `DECISIONES.md`.

Capturas: `tests/evidence/desktop-love.png`, `mobile-love.png`, `desktop-heartbreak.png`, `mobile-heartbreak.png`, formularios y referencias `*-prototype-*`. Comparación con fuentes Playfair/DM Sans cargadas localmente. Las diferencias comerciales necesarias (paquetes sin venta, correo, estados y recuperación) se registran, no se presentan como coincidencia píxel a píxel del sitio entero.

## 3. Pruebas

Matriz detallada en `PRUEBAS.md`; resultados de navegador y geometría en `tests/evidence`. Pruebas unitarias/SQL/mocks reproducibles con `npm test`, sin pagos reales. Build, lint y TypeScript aprobados. Resultado final: **38/38 tests unitarios/SQL/mocks y 4/4 tests de navegador**. Las 80 mediciones comparadas del hero con fuentes iguales tienen desviación máxima **0 px**. Esto valida la geometría medida, no todos los píxeles del sitio.

## 4. Implementado

- Dos marcas con diseño, paletas, vinilo, microinteracción, desktop/móvil y formulario modal de tres pasos.
- Nombres, historia, ocasión, género, voz, duración aproximada, emoción y correo. Borrador en sesión de pestaña, botón para borrarlo, identificador de solicitud y recuperación de pedido por correo verificado.
- OTP de 10 minutos, cinco intentos, límites por correo y globales; sesión HttpOnly, Secure en producción. PostgreSQL reserva una generación por correo de forma atómica y limita nuevas generaciones a 50/día globales como techo provisional de presupuesto (operativo, no promesa de disponibilidad).
- Letras con Anthropic y separación de instrucciones/datos; contrato Apiframe actualizado; submit único y polling recuperable, importación de dos MP3 a almacenamiento privado.
- Escucha completa gratuita mediante proxy con sesión; no se entregan URLs CDN en respuestas. Descarga solo con propiedad del pedido y pago aprobado; enlace privado de 60 segundos.
- Premium $449 MXN exige dos versiones y entrega MP3+PDF. Básico $249 y VIP $899 sin venta hasta resolver/validar sus prestaciones.
- Checkout calculado por servidor, vendedor sandbox verificado, recuperación de preferencia existente y bloqueo de estado ambiguo. Webhook HMAC, pago consultado en MP, monto/moneda/vendedor/referencia/preferencia verificados; idempotencia y revocación por reembolso.
- Correo Resend con errores tratados, nombres escapados y clave de idempotencia; entrega ambigua prolongada exige reconciliación. Correo de entrega usa recuperación OTP; no comparte acceso al pedido.
- Telemetría interna sin historias/letras/correos en eventos. Tokens/modelo/créditos en registro de costos; conversión por pedido escuchado en consultas agregadas. Eventos de descarga reflejan autorización de descarga, no prueba de transferencia completa al dispositivo.
- Borradores legales visibles como pendientes de revisión, flags de generación/checkout/legal cerrados por defecto; configuración de despliegue solo dentro de Cantalove.

## 5. Problemas corregidos

IDOR por identificador de pedido, exposición de URL completa, preview cortado a 30s contrario al GTM, generación gratuita sin límite, formularios sin límites servidor, duplicación de submit/checkout, verificación insuficiente del pago, correo del pagador sustituyendo al propietario, repetición del correo en callbacks, PDF truncado y páginas mal dibujadas, modelo/estados/voz de API musical desactualizados y errores de proveedor con información interna.

Las correcciones están probadas localmente según la matriz. No constituyen una auditoría externa de seguridad ni certificación legal.

## 6. Costos por canción y venta

Fuentes públicas consultadas: [Apiframe Suno](https://apiframe.ai/models/suno), [créditos por modelo](https://docs-v2.apiframe.ai/docs/pricing), [modelos Anthropic](https://platform.claude.com/docs/en/models/overview), [términos Apiframe](https://apiframe.ai/terms). Confirmar plan/factura/cuenta antes de vender.

Documentación actual: una solicitud Suno cuesta 11 créditos y produce dos tracks; página pública estima ≈US$0.11 por solicitud (≈US$0.055 por track si ambos sirven). No se adopta como hecho vigente el plan GTM de US$19/mes con 3,000 créditos; la página actual también anuncia US$19 como primer mes promocional y US$39 posteriormente. El costo efectivo depende del plan y créditos comprados.

**Escenario ilustrativo, no cotización:** Sonnet 5.5 a US$2 entrada / US$10 salida por millón de tokens; 1,000 tokens entrada + 1,000 salida ≈US$0.012. Con música US$0.11: US$0.122 por pedido de dos versiones; usando un tipo de cambio supuesto de $20 MXN/USD: **$2.44 MXN por generación** o **$1.22 por track**. Se sustituye por tokens/créditos reales y FIX/FX real de pago al validar.

| Escenario de conversión escucha→compra | Generación asignada a cada venta, incluye usuarios gratis |
|---|---:|
| 10% | $24.40 MXN |
| 15% | $16.27 MXN |

Fórmula comisión: `(precio × porcentaje + fijo) × factor_impuestos_comisión`, según contrato vigente MP. **No se verificó una tarifa de cuenta.** Solo para sensibilidad: si fuera 3.5%+$4 más 16% sobre comisión, en Premium $449 serían $22.87. A conversión15%, contribución ilustrativa: $449−$16.27−$22.87 = **$409.86**, antes de suscripciones/infraestructura, impuestos de venta, marketing, atención, fallos/reintentos y reembolsos. No es utilidad neta. No se calculan márgenes vendibles de Básico/VIP porque la oferta está pendiente.

Una regeneración duplica el costo variable correspondiente. El objetivo GTM de revisión ilimitada no tiene costo acotado y no puede aceptarse como prestación viable sin política comercial.

## 7. Variables y bloqueos

Prueba real independiente preparada: `npm run smoke:suno`. No depende de Anthropic, Supabase, Mercado Pago ni Resend: envía una letra original ficticia a Suno/Apiframe y guarda el job para reanudar sin duplicación. Su intento en esta sesión se detuvo antes del proveedor por falta de `APIFRAME_API_KEY`; no hay canción real generada todavía.

Configurar en los dashboards, nunca pegarlas en un PR ni compartir claves en texto:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: proyecto exclusivo Cantalove. El único proyecto accesible se llama MarketingCliniq; no se tocó.
- `AUTH_SECRET`: aleatorio de al menos32 caracteres.
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`: modelo con acceso confirmado.
- `APIFRAME_API_KEY`, `APIFRAME_MODEL_VERSION=V4_5PLUS`: saldo/licencia confirmados.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`: dominio/remitente verificados.
- `MP_ACCESS_TOKEN`, `MP_SELLER_ID`, `MP_WEBHOOK_SECRET`, comprador/vendedor de pruebas; `MP_ENVIRONMENT=sandbox`, `MP_ENABLE_LIVE_PAYMENTS=false`.
- `NEXT_PUBLIC_SITE_URL`: HTTPS del preview, no localhost para MP.
- `GENERATION_ENABLED`, `CHECKOUT_ENABLED`, `LEGAL_APPROVED`: permanecen false hasta cumplir el hito correspondiente.

Bloqueos externos: autorización de equipo Vercel; infraestructura/credenciales anteriores; confirmación comercial de paquetes; responsable legal, contacto/ARCO/soporte, impuestos/reembolso/retención y licencia comercial verificados. No se ocultan como tareas terminadas.

## 8. Dominio

Instrucciones completas en `DESPLIEGUE.md`. Conectar `cantalove.com` requiere primero preview validado y autorización expresa de producción. Los valores DNS se copian del panel de Vercel de ese proyecto en el momento de conectarlo; no se adivinan registros.

## 9. Pendientes operativos bajo revisión

- Una respuesta perdida después de submit a IA musical queda bloqueada para no duplicar gasto; reconciliar en proveedor, no reintentar a ciegas. No hay automatización durable de conciliación ni soporte operativo configurado.
- La importación/polling se completa cuando el cliente consulta el pedido; no hay worker autónomo sin navegador. El procesamiento del proveedor sí es asíncrono.
- Un enlace de descarga ya emitido vive hasta60s y el audio escuchado puede grabarse.
- Faltan limpieza programada/retención definitiva y un canal de soporte real. Avisos aún en borrador.
- Auditoría de dependencias por red no completada; verificar en CI/entorno conectado antes del GO.

## 10. GO / NO GO

**NO GO.** Para cambiar a GO deben quedar documentadas: canción real y sus dos audios, pagos sandbox aprobados/pendientes/rechazados, webhook duplicado/reembolso y recuperación, descarga privada en segundo dispositivo, correo real, Supabase remoto privado, QA móvil real, derechos y oferta aprobados, avisos finales y acceso/despliegue independiente. Compilar y aprobar mocks no cumplen esos requisitos por sí solos.
