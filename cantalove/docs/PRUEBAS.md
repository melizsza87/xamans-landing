# Matriz de validación · 21 octubre 2026

Esta matriz distingue implementación de validación con servicios reales. Los tests no contienen credenciales reales. Historias de QA ficticias (José y María).

| Requisito | Evidencia | Estado |
|---|---|---|
| TypeScript, lint, build producción | `npm run typecheck`, `npm run lint`, `npm run build` | Aprobados localmente |
| Validación servidor, correo, caracteres españoles, enums/arrays, límites de tamaños | `tests/security.test.ts` | Aprobado |
| PostgreSQL: reserva gratuita atómica, cuota por correo, cuota diaria, no filas parciales | PGlite ejecutando `schema.sql` + `hardening.sql` | Aprobado local; falta Supabase remoto |
| OTP: vencimiento, cinco intentos, un solo uso | RPCs reales en PostgreSQL local | Aprobado local; correo real pendiente |
| RLS, roles públicos sin RPC ni lectura, bucket privado | Pruebas de permisos en PGlite, segunda aplicación del hardening | Aprobado local; policies remotas pendientes |
| Firma webhook, manipulación de ID/monto/moneda/vendedor/referencia/preferencia, modo sandbox | Tests puros y mocks aislados `webhook.test.ts` | Aprobado con mocks |
| Pagos aprobado/pendiente/en proceso/rechazado, callbacks duplicados/concurrentes | Mocks explícitos de DB, proveedor y correo | Aprobado con mocks; NO equivale a sandbox real |
| Reembolso antes/después de aprobación; callback aprobado antiguo | Webhook tests, estado revocado nunca resucitado | Aprobado con mocks |
| Preferencia existente y navegación interrumpida; creación ambigua bloqueada | Checkout tests | Aprobado con mocks |
| Entrega correo repetida y ambigua >23h | Lease DB, stable Resend key, cuarentena de reconciliación | Aprobado con mocks |
| PDF español, páginas múltiples, líneas largas sin truncar | `tests/pdf.test.ts` | Aprobado |
| Diseño desktop 1440×1000 y móvil 390×844 | Playwright `tests/ui.spec.ts`, PNG en `tests/evidence` | Aprobado local |
| Marca, navegación, vinilo, modal/Escape, borrador al recargar, voz/correo/nombres españoles | Browser real Chromium | Aprobado local |
| Descargas/escucha sin sesión y acceso cruzado anónimo | HTTP en navegador de prueba: denegación sin secretos | Aprobado para anónimo; segundo comprador autenticado remoto pendiente |
| Comparación con HTML aprobado | Fuentes locales iguales, capturas y `visual-metrics.json` | Métricas finales registradas en evidencia; discrepancia mockup pendiente |
| Generación letra Anthropic real | Sin clave ni modelo confirmado | BLOQUEADO |
| Generación Suno real, latencia/calidad y costo | Contrato corregido/documentado; no saldo/clave | BLOQUEADO |
| Timeout/proveedor fallido | Código sin POST automático; mocks y recuperación por poll | Implementado; simulación de fallos reales en preview pendiente |
| Audio real reproducido en celular real | Dos versiones privadas, proxy implementado | Pendiente proveedor/Storage remoto |
| Checkout Mercado Pago sandbox E2E | Sin vendedor y comprador de prueba configurados | BLOQUEADO |
| Resend OTP + confirmación real | Sin remitente/dominio/clave configurados | BLOQUEADO |
| Descarga autorizada tras compra sandbox | Flujo implementado, no pago real de prueba | Pendiente validación remota |
| Xamans | Todos los archivos cambiados están bajo `cantalove/`; comparación Git | Sin cambios de código/configuración Xamans; smoke de producción no ejecutado |
| Dependencias | npm audit no respondió en red del entorno; se canceló | Auditoría externa pendiente; no se certifica ausencia total de vulnerabilidades |

Resultado final: **38/38 tests unitarios/SQL/mocks y 4/4 browser**; **80/80 mediciones de geometría con desviación0px** en elementos del hero, con fuentes realmente cargadas. Capturas before-main y referencia/implementación incluidas.

Los tests unitarios/SQL y de webhook se repiten con `npm test`. Browser: `npm run build && npm run test:e2e`; para usar Chromium instalado fuera de Playwright, configurar `PW_CHROMIUM_PATH`.

Limitación de capturas: el Chromium Linux de QA no tiene fuente emoji completa y algunos símbolos aparecen como cuadros. Se conservaron los caracteres del HTML; validar en iOS/Android reales antes del GO. La igualdad de fuentes Playfair y DM Sans se verifica en la comparación, evitando comparar con Georgia de respaldo por bloqueo de Google Fonts.
