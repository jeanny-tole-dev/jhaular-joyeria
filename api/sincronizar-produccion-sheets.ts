// Vercel Serverless Function: Endpoint de Sincronización Google Sheets ➔ Supabase (ADMIN ONLY)
// Endpoint: POST /api/sincronizar-produccion-sheets

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const REAL_13_MANILLAS_CATALOG = [
  {
    sku: 'JH-001',
    nombre: 'mar',
    categoria: 'Esmeralda & Oro',
    material: 'Hilo macramé + balines 18k + esmeralda',
    colorHilo: 'Verde / Negro',
    precioBase: 136400,
    precioPublico: 231900,
    ganancia: 95500,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-002',
    nombre: 'Manilla PROMESA',
    categoria: 'Línea Esencial',
    material: 'Hilo macramé + balines 18k',
    colorHilo: 'Rojo',
    precioBase: 85785,
    precioPublico: 145900,
    ganancia: 60115,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-003',
    nombre: 'CORAZON DORADO',
    categoria: 'Oro 18K Diamantado',
    material: 'MANILLA HERMOSA EN ROSA CON DIJE DE CORAZON EN ORO Y BALINES',
    colorHilo: 'Rosa',
    precioBase: 343310,
    precioPublico: 583700,
    ganancia: 240390,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-004',
    nombre: 'manilla rosa sacro',
    categoria: 'Religiosas',
    material: 'hermosa manilla en rosado con dije de la virgen del Carmen acompañada de balines de oro',
    colorHilo: 'Rosa',
    precioBase: 357715,
    precioPublico: 608200,
    ganancia: 250485,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-005',
    nombre: 'color esmeralda',
    categoria: 'Esmeralda & Oro',
    material: 'Hilo macramé + balines 18k',
    colorHilo: 'Verde',
    precioBase: 420750,
    precioPublico: 715300,
    ganancia: 294550,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-006',
    nombre: 'Manilla San Benito protector',
    categoria: 'Religiosas',
    material: 'HERMOSA MANILLA EN MACRAME ROJA CON BALINES EN ORO DE 18K Y DIJE DE SAN BENITO',
    colorHilo: 'Rojo',
    precioBase: 396598,
    precioPublico: 674300,
    ganancia: 277702,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-007',
    nombre: 'ESMERALDA DORADA',
    categoria: 'Esmeralda & Oro',
    material: 'HERMOSA MANILLA EN VERDE CON DORADO ACOMPAÑADA DE ORO Y ESMERALDA',
    colorHilo: 'Verde / Dorado',
    precioBase: 386870,
    precioPublico: 657700,
    ganancia: 270830,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-008',
    nombre: 'MANILLA JHAULAR DORADA',
    categoria: 'Oro 18K Diamantado',
    material: 'Hilo macramé + balines 18k',
    colorHilo: 'Dorado',
    precioBase: 184881,
    precioPublico: 314300,
    ganancia: 129419,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-009',
    nombre: 'DOLAR',
    categoria: 'Oro 18K Diamantado',
    material: 'Hilo macramé + balines 18k',
    colorHilo: 'Negro',
    precioBase: 721651,
    precioPublico: 1051600,
    ganancia: 329949,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-010',
    nombre: 'Manilla Guadalupana',
    categoria: 'Religiosas',
    material: 'HERMOSA manilla beige balines en oro de 18k y un dije de la virgen de Guadalupe',
    colorHilo: 'Beige',
    precioBase: 345453,
    precioPublico: 587300,
    ganancia: 241847,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-011',
    nombre: 'SAN BENITO GUARDIAN',
    categoria: 'Religiosas',
    material: 'MANILLA EN MACRAME BALINES DE ORO Y MURRALLAS DE ESMERALDA',
    colorHilo: 'Negro',
    precioBase: 501763,
    precioPublico: 853000,
    ganancia: 351237,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-012',
    nombre: 'GUARDIAN DORADO',
    categoria: 'Oro 18K Diamantado',
    material: 'MANILLA EN MACRAME CON DIJE DE OSO Y BALINES DE ORO',
    colorHilo: 'Dorado',
    precioBase: 322595,
    precioPublico: 530800,
    ganancia: 208205,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  },
  {
    sku: 'JH-013',
    nombre: 'MANILLA 7 NUDOS DORADA INFANTIL',
    categoria: 'Línea Esencial',
    material: 'MANILLA INFANTIL 7 NUDOS CON 6 BALINES #4 Y DOS BALINES #3',
    colorHilo: 'Rojo / Dorado',
    precioBase: 189315,
    precioPublico: 324600,
    ganancia: 135285,
    stock: 5,
    estado: 'Disponible',
    qa: 'Aprobado'
  }
]

function leerBearer(req: VercelRequest): string | null {
  const header = req.headers.authorization
  const value = Array.isArray(header) ? header[0] : header
  if (!value?.startsWith('Bearer ')) return null
  const token = value.slice('Bearer '.length).trim()
  return token || null
}

async function exigirAdmin(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const token = leerBearer(req)
  if (!token) {
    res.status(401).json({ exito: false, error: 'Se requiere sesión de administrador.' })
    return false
  }

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    res.status(500).json({ exito: false, error: 'Falta la configuración del servidor.' })
    return false
  }

  const supabaseAdmin = createClient(url, serviceKey)
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData.user) {
    res.status(401).json({ exito: false, error: 'Sesión no válida.' })
    return false
  }

  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (perfilError || perfil?.role !== 'ADMIN') {
    res.status(403).json({ exito: false, error: 'Solo un administrador puede sincronizar producción.' })
    return false
  }

  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const autorizado = await exigirAdmin(req, res)
  if (!autorizado) return

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID
    const apiKey = process.env.GOOGLE_API_KEY
    const csvUrl = process.env.GOOGLE_SHEET_CSV_URL
    let itemsSincronizados = REAL_13_MANILLAS_CATALOG

    if (csvUrl) {
      const resp = await fetch(csvUrl)
      if (resp.ok) {
        const text = await resp.text()
        const lines = text.split('\n').filter((l) => l.trim() !== '')
        const dataLines = lines.slice(1)
        itemsSincronizados = dataLines.map((line, idx) => {
          const r = line.split(/[\t,;]/).map((cell) => cell.replace(/^"(.*)"$/, '$1').trim())
          const valPrecioBase = Number(String(r[5] || '0').replace(/[^0-9]/g, '')) || 90000
          const valPrecioPub = Number(String(r[6] || '0').replace(/[^0-9]/g, '')) || valPrecioBase * 2
          const ganancia = Math.max(0, valPrecioPub - valPrecioBase)

          return {
            sku: r[0] || `JH-${(idx + 1).toString().padStart(3, '0')}`,
            nombre: r[1] || 'Manilla Jhaular',
            categoria: r[2] || 'Oro 18K Diamantado',
            material: r[3] || 'Hilo macramé + balines 18K',
            colorHilo: r[4] || 'Negro',
            precioBase: valPrecioBase,
            precioPublico: valPrecioPub,
            ganancia,
            stock: Number(r[7] || 5),
            estado: r[8] || 'Disponible',
            qa: r[9] || 'Aprobado'
          }
        })
      }
    } else if (sheetId && apiKey) {
      const range = 'PRODUCTOS!A2:J100'
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`
      const resp = await fetch(url)
      
      if (resp.ok) {
        const sheetData = await resp.json()
        const rows = sheetData.values || []

        itemsSincronizados = rows.map((r: any[], idx: number) => {
          const valPrecioBase = Number(String(r[5] || '0').replace(/[^0-9]/g, '')) || 90000
          const valPrecioPub = Number(String(r[6] || '0').replace(/[^0-9]/g, '')) || valPrecioBase * 2
          const ganancia = Math.max(0, valPrecioPub - valPrecioBase)

          return {
            sku: r[0] || `JH-${(idx + 1).toString().padStart(3, '0')}`,
            nombre: r[1] || 'Manilla Jhaular',
            categoria: r[2] || 'Oro 18K Diamantado',
            material: r[3] || 'Hilo macramé + balines 18K',
            colorHilo: r[4] || 'Negro',
            precioBase: valPrecioBase,
            precioPublico: valPrecioPub,
            ganancia,
            stock: Number(r[7] || 5),
            estado: r[8] || 'Disponible',
            qa: r[9] || 'Aprobado'
          }
        })
      }
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      for (const item of itemsSincronizados) {
        await supabaseAdmin.from('productos').upsert(
          {
            sku: item.sku,
            nombre: item.nombre,
            categoria: item.categoria,
            material_especificacion: item.material,
            color_hilo: item.colorHilo,
            precio_estandar: item.precioBase,
            precio_venta: item.precioPublico,
            costo_total_real: item.precioBase,
            stock: item.stock,
            estado_produccion: item.estado,
            control_calidad_qa: item.qa,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'sku' }
        )
      }
    }

    return res.status(200).json({
      exito: true,
      totalProcesados: itemsSincronizados.length,
      fuente: sheetId ? 'GOOGLE_SHEETS_LIVE' : 'SISTEMA_PRODUCCION_JHAULAR',
      items: itemsSincronizados
    })
  } catch (err: any) {
    console.error('Error al sincronizar datos de producción:', err)
    return res.status(500).json({
      exito: false,
      error: err.message || 'Error al conectar con Google Sheets'
    })
  }
}
