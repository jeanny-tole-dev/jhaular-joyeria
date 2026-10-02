// Vercel Serverless Function.
// Esta es la ÚNICA parte del sistema que usa la service_role key.
// El navegador nunca llama a Supabase directo para crear pedidos.
//
// Endpoint: POST /api/confirmar-pedido

import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ solo existe en el servidor
)

interface ItemPedido {
  productoId: string
  varianteId?: string
  nombreProducto: string
  cantidad: number
  precioUnitario: number
}

interface BodyConfirmarPedido {
  nombreCliente: string
  telefonoCliente: string
  direccionEntrega?: string
  ciudad?: string
  items: ItemPedido[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const body = req.body as BodyConfirmarPedido

  if (!body.nombreCliente || !body.telefonoCliente || !body.items?.length) {
    return res.status(400).json({ error: 'Faltan datos requeridos' })
  }

  const subtotal = body.items.reduce(
    (sum, i) => sum + i.precioUnitario * i.cantidad,
    0
  )

  // 1. Buscar o crear el cliente en el CRM simple (por teléfono)
  const { data: clienteExistente } = await supabaseAdmin
    .from('clientes')
    .select('id')
    .eq('telefono', body.telefonoCliente)
    .maybeSingle()

  let clienteId = clienteExistente?.id

  if (!clienteId) {
    const { data: nuevoCliente, error: errorCliente } = await supabaseAdmin
      .from('clientes')
      .insert({ nombre: body.nombreCliente, telefono: body.telefonoCliente })
      .select('id')
      .single()
    if (errorCliente) return res.status(500).json({ error: errorCliente.message })
    clienteId = nuevoCliente.id
  }

  // 2. Crear el pedido (el trigger genera pedido_code automáticamente)
  const { data: pedido, error: errorPedido } = await supabaseAdmin
    .from('pedidos')
    .insert({
      cliente_id: clienteId,
      nombre_cliente: body.nombreCliente,
      telefono_cliente: body.telefonoCliente,
      direccion_entrega: body.direccionEntrega,
      ciudad: body.ciudad,
      subtotal,
      total: subtotal, // ajusta si agregas envío/descuento
    })
    .select('id, pedido_code')
    .single()

  if (errorPedido) return res.status(500).json({ error: errorPedido.message })

  // 3. Insertar los items
  const { error: errorItems } = await supabaseAdmin.from('pedido_items').insert(
    body.items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.productoId,
      variante_id: i.varianteId,
      nombre_producto: i.nombreProducto,
      cantidad: i.cantidad,
      precio_unitario: i.precioUnitario,
    }))
  )

  if (errorItems) return res.status(500).json({ error: errorItems.message })

  // 4. Armar el link de WhatsApp usando la vista pública de configuración
  const { data: config } = await supabaseAdmin
    .from('configuracion')
    .select('valor')
    .eq('clave', 'whatsapp_numero')
    .single()

  const mensaje = encodeURIComponent(
    `Hola! Quiero confirmar mi pedido ${pedido.pedido_code} por $${subtotal.toLocaleString('es-CO')} COP`
  )
  const linkWhatsapp = `https://wa.me/${config?.valor}?text=${mensaje}`

  return res.status(200).json({ pedidoCode: pedido.pedido_code, linkWhatsapp })
}
