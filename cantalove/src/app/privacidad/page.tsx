import Link from "next/link";
export default function Legal() {
  return (
    <main className="wrap order-page">
      <Link href="/">Volver a Cantalove</Link>
      <h1>Aviso de privacidad — borrador para revisión</h1>
      <p role="status">
        Pendiente de revisión legal. El servicio aún no está habilitado para
        ventas.
      </p>
      <p>
        Responsable: [razón social o nombre legal, domicilio y contacto de
        privacidad pendientes]
      </p>
      <p>
        Se recopilan correo verificado, nombres, historia, preferencias
        musicales, pedidos, estado de pago y registros técnicos mínimos
      </p>
      <p>
        Usamos estos datos para verificar identidad, generar letras y música,
        procesar tu pedido, entregar archivos y atender aclaraciones
      </p>
      <p>
        No enviamos tu correo, historia ni letra a herramientas analíticas; los
        eventos solo registran etapa y marca
      </p>
      <p>
        Anthropic y Apiframe procesan el contenido necesario para generar tu
        canción; Supabase almacena pedidos y archivos privados; Resend envía
        códigos y confirmaciones; Mercado Pago procesa el pago
      </p>
      <p>
        Deben confirmarse países, contratos, transferencias, plazos de
        conservación y procedimientos de eliminación con cada proveedor antes de
        publicar
      </p>
      <p>No incluyas información sensible ni datos de terceros sin permiso</p>
      <p>
        Debe habilitarse un canal para derechos de acceso, rectificación,
        cancelación, oposición, revocación y limitación de uso
      </p>
      <p>
        Borrador local: el borrador del formulario permanece en esta pestaña y
        puede borrarse con el botón correspondiente; el pedido de servidor
        requiere solicitud al responsable
      </p>
      <p>
        Conservación propuesta, sujeta a revisión: códigos 10 minutos, sesiones
        7 días; plazos fiscales, canciones y pedidos por definir y publicar
        antes de activar el servicio
      </p>
      <p>
        No se realizan campañas promocionales con estos datos sin autorización
        separada
      </p>
      <p>Fecha y versión definitivas pendientes.</p>
    </main>
  );
}
