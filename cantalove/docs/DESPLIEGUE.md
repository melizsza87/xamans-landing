# Preview independiente y conexión de cantalove.com

No se ha autorizado producción. No se modificaron DNS, dominio, proyecto ni variables de Xamans.

Proyecto encontrado: Cantalove (`prj_XG4qXUtrINcX4p2rtUuvvX56fZis`), equipo `team_OGKRO0ueAPoA1XgiWNHTK4GB`. La conexión devolvió HTTP403 al consultar configuración: requiere autorización de acceso al equipo. La herramienta indicada en el error para autorizar equipo no está disponible en esta sesión. No se intenta evadir esa restricción usando otro contexto.

1. Autorizar acceso de la conexión Vercel al equipo propietario de Cantalove. Confirmar `rootDirectory=cantalove` y repo `melizsza87/xamans-landing`. No editar el proyecto Xamans.
2. Usar rama `codex/cantalove-launch-readiness` para preview únicamente. Mantener producción y dominio actual sin cambios. Comprobar que una rama no principal no se promueva automáticamente.
3. Configurar entorno exclusivo siguiendo `.env.example`; preview no tiene credenciales de producción. Proveer base Supabase exclusiva; el único proyecto accesible durante la revisión se llama MarketingCliniq y no se utiliza.
4. Ejecutar build, pruebas y deploy target preview. Configurar HTTPS preview como `NEXT_PUBLIC_SITE_URL` y webhook sandbox. No asignar cantalove.com todavía.
5. Completar matriz con proveedor real, SMTP/Resend real y pagos sandbox. Obtener resolución comercial, legal y GO explícito.
6. Solo tras autorización expresa de producción: agregar `cantalove.com` y `www.cantalove.com` al proyecto Cantalove. Copiar EXACTAMENTE los registros que Vercel muestre para esa cuenta/dominio; no asumir A/CNAME de memoria. Configurarlos en el registrador y comprobar propiedad y TLS. Elegir dominio canónico y redirección www/apex.
7. Actualizar `NEXT_PUBLIC_SITE_URL=https://cantalove.com`, remitente/DNS Resend SPF/DKIM, webhook live y vendedor live. Activar live requiere deliberadamente `MP_ENVIRONMENT=live` y `MP_ENABLE_LIVE_PAYMENTS=true`; no basta cambiar un token. Revisar impuestos y facturación con responsables.
8. Ensayo postrelease autorizado, monitoreo y rollback a último despliegue Cantalove. Nunca tocar Xamans para corregir Cantalove.

No hay una URL pública de prueba verificable mientras persista el HTTP403. `http://localhost:3000` solo sirve en una máquina con el proyecto ejecutándose; no es una URL entregable al cliente.
