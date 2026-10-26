# Corrección visual · mockup aprobado

La usuaria aclaró: “Tenía que ser así” y proporcionó nuevamente el [mockup comparativo de Drive](https://drive.google.com/file/d/1L7MUMCp55OYUXW7hZ5T9TZv5FqNb-9qC/view). Esta instrucción resuelve la contradicción anterior: **manda el mockup fotográfico; el HTML de vinilo deja de ser la referencia principal**.

## Aplicado

- Cantalove: crema, rosa intenso, logo serif, fotografía aprobada de pareja al atardecer, titular “La canción que llevas años queriendo regalarle”, CTA, tarjetas Amor/Boda-Vals/Celebración/Agradecimiento, cuatro pasos y recuerdo con portada/vinilo en la parte inferior.
- Cantalovergas: azul en hero, negro en contenido, acento lima, fotografía aprobada de despecho, letras manuscritas, titular “Despecho también suena bonito”, nota “Porque también se canta lo que duele”, tarjetas de papel Ex tóxico/Me mintió/Ahora estoy mejor/Modo rencor, cuatro pasos y fotografía de audífonos en la sección inferior.
- Fotografías hero son exactamente los archivos aprobados `cantalove_hero_aprobado.webp` y `cantalovergas_hero_aprobado.webp`; las fotografías secundarias se enmarcan desde la referencia aprobada con SVG. Textos, tarjetas, botones y navegación son HTML funcional: no se incrusta una captura de la página como interfaz.
- Responsive real, menú, selector entre marcas, formulario existente, validaciones y conservación del borrador. Los paquetes permanecen debajo de las secciones del mockup y conservan las restricciones comerciales previas.
- La marca comercial se mantiene Cantalovergas; no se adopta el aparente singular del wordmark de la imagen como un cambio de nombre.

## Diferencias deliberadas por funcionalidades pendientes

No se anuncia “envío anónimo disponible” porque no está implementado. Se conserva su lugar visual en la franja con mensajes entregables (“Tu historia es privada” / “Escucha completa antes de pagar”). “100% original” se sustituye por “Una canción original” / “Tu historia, tu canción”, sin garantizar exclusividad/copyright de un proveedor IA. La oferta VIP sigue sin venta ni promesa de ilimitadas/stems. Estas diferencias de promesa no alteran el diseño fotográfico aprobado.

## Evidencia vigente

`tests/evidence/mockup-v2/` contiene capturas desktop 1440px, móvil390px y ancho684px de la referencia, formularios y logs de las pruebas. Se revisaron manualmente fotografías, jerarquía, colores, espaciado y recortes. No se afirma coincidencia de píxeles contra un mockup raster: la adaptación responsive se compara visualmente y mediante comprobaciones funcionales.

Las anteriores capturas/mediciones contra el HTML se conservan como historial de la primera versión y no son prueba de aprobación del nuevo diseño. Las pruebas actuales ya no comparan contra ese HTML.

## Estado técnico

Se mantienen los bloqueos reales ya documentados: clave/saldo Suno-Apiframe y otras credenciales, validación de pago sandbox, correo real, infraestructura exclusiva y acceso Vercel403. No se ha hecho despliegue de producción, cambio DNS ni modificación de Xamans. El [PR#3](https://github.com/melizsza87/xamans-landing/pull/3) contiene esta corrección visual para revisión.
