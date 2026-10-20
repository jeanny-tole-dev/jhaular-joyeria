import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Hammer,
  Search,
  Boxes,
  AlertTriangle,
  Clock,
  Filter,
  FileSpreadsheet,
  Tag,
  Sparkles,
  Plus,
  Calculator,
  TrendingUp,
  Download
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import {
  CATEGORIAS_PRODUCCION,
  ESTADOS_PRODUCCION,
  CONTROL_CALIDAD_QA,
} from '../../../constants/categorias'
import type { ItemProduccion } from '../../../types/produccionSheets'
import type { ProductoData } from '../../../types/productos'
import BomCalculatorModal from '../../../components/Admin/BomCalculatorModal'

// Todos los 13 Productos Reales del Catálogo Oficial
const REAL_13_MANILLAS_CATALOG: ItemProduccion[] = [
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

export default function AdminProduccion() {
  const location = useLocation()
  const [itemsProduccion, setItemsProduccion] = useState<ItemProduccion[]>([])
  const [syncing, setSyncing] = useState(false)
  const [busquedaSku, setBusquedaSku] = useState('')
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [filtroQA, setFiltroQA] = useState<string>('TODOS')
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null)

  // Estado del Modal Calculadora BOM / Nueva Manilla
  const [isBomModalOpen, setIsBomModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemProduccion | null>(null)

  // Cargar Productos Reales desde Catálogo Admin (LocalStorage & Supabase)
  const cargarProduccion = useCallback(async () => {
    try {
      let catalogProds: ProductoData[] = []
      let deletedIds: string[] = []
      try {
        deletedIds = JSON.parse(localStorage.getItem('jhaular_deleted_product_ids') || '[]')
      } catch {
        // ignore
      }

      // 1. Leer productos guardados en el Catálogo Admin (LocalStorage)
      try {
        catalogProds = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
      } catch (e) {
        console.warn('Error leyendo catálogo guardado:', e)
      }

      // 2. Consultar Supabase
      let dbProds: ProductoData[] = []
      try {
        const { data } = await supabase.from('productos').select('*').order('created_at', { ascending: false })
        if (data && data.length > 0) dbProds = data as any
      } catch {
        // ignore
      }

      // 1. Crear un mapa de SKUs base por nombre desde REAL_13_MANILLAS_CATALOG
      const baseSkuMap = new Map<string, string>()
      REAL_13_MANILLAS_CATALOG.forEach((item) => baseSkuMap.set(item.nombre.toLowerCase(), item.sku))

      // Unificar mapa por Nombre
      const mapProds = new Map<string, any>()
      REAL_13_MANILLAS_CATALOG.forEach((item) => mapProds.set(item.nombre.toLowerCase(), item))

      dbProds.forEach((p) => {
        if (p.id && !deletedIds.includes(p.id)) {
          const pBase = p.costo_total_real || (p as any).precio_estandar || Math.round((p.precio_venta || 180000) * 0.58)
          const pPub = p.precio_venta || 180000
          const skuOriginal = (p as any).sku || baseSkuMap.get(p.nombre.toLowerCase())
          const existingItem = mapProds.get(p.nombre.toLowerCase())
          mapProds.set(p.nombre.toLowerCase(), {
            id: p.id,
            sku: skuOriginal || existingItem?.sku,
            nombre: p.nombre,
            categoria: p.categoria || existingItem?.categoria || 'Oro 18K Diamantado',
            material: (p as any).material_especificacion || p.descripcion || existingItem?.material || 'Hilo macramé + balines 18k',
            colorHilo: (p as any).color_hilo || existingItem?.colorHilo || 'Negro',
            precioBase: pBase,
            precioPublico: pPub,
            ganancia: Math.max(0, pPub - pBase),
            stock: (p as any).stock ?? existingItem?.stock ?? 5,
            estado: (p as any).estado_produccion || (p.activo ? 'Disponible' : 'Pausado'),
            qa: (p as any).control_calidad_qa || existingItem?.qa || 'Aprobado'
          })
        }
      })

      catalogProds.forEach((p) => {
        if (p.id && !deletedIds.includes(p.id)) {
          const pBase = p.costo_total_real || (p as any).precio_estandar || Math.round((p.precio_venta || 180000) * 0.58)
          const pPub = p.precio_venta || 180000
          const skuOriginal = (p as any).sku || baseSkuMap.get(p.nombre.toLowerCase())
          const existingItem = mapProds.get(p.nombre.toLowerCase())
          mapProds.set(p.nombre.toLowerCase(), {
            id: p.id,
            sku: skuOriginal || existingItem?.sku,
            nombre: p.nombre,
            categoria: p.categoria || existingItem?.categoria || 'Oro 18K Diamantado',
            material: (p as any).material_especificacion || p.descripcion || existingItem?.material || 'Hilo macramé + balines 18k',
            colorHilo: (p as any).color_hilo || existingItem?.colorHilo || 'Negro',
            precioBase: pBase,
            precioPublico: pPub,
            ganancia: Math.max(0, pPub - pBase),
            stock: (p as any).stock ?? existingItem?.stock ?? 5,
            estado: (p as any).estado_produccion || 'Disponible',
            qa: (p as any).control_calidad_qa || existingItem?.qa || 'Aprobado'
          })
        }
      })

      // 3. Leer produccion salvada localmente
      try {
        const prodLocales: ItemProduccion[] = JSON.parse(localStorage.getItem('jhaular_produccion_items') || '[]')
        prodLocales.forEach((p) => {
          if (p.nombre && !deletedIds.includes(p.id || '')) {
            mapProds.set(p.nombre.toLowerCase(), {
              ...mapProds.get(p.nombre.toLowerCase()),
              ...p
            })
          }
        })
      } catch {
        // ignore
      }

      // Asignar SKUs únicos garantizados (JH-001, JH-002, ..., JH-013)
      const itemsArray = Array.from(mapProds.values())
      const usedSkus = new Set<string>()

      const listaFinal: ItemProduccion[] = itemsArray.map((item, idx) => {
        let finalSku = item.sku
        if (!finalSku || usedSkus.has(finalSku)) {
          finalSku = `JH-${(idx + 1).toString().padStart(3, '0')}`
        }
        usedSkus.add(finalSku)

        return {
          ...item,
          sku: finalSku,
          ganancia: Math.max(0, (item.precioPublico || 0) - (item.precioBase || 0))
        }
      })

      // Ordenar estrictamente por SKU numérico (JH-001, JH-002, ..., JH-013)
      listaFinal.sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' }))

      setItemsProduccion(listaFinal)
    } catch {
      const itemsOrdenados = [...REAL_13_MANILLAS_CATALOG].sort((a, b) =>
        a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' })
      )
      setItemsProduccion(itemsOrdenados)
    }
  }, [])

  useEffect(() => {
    cargarProduccion()
  }, [cargarProduccion])

  // Sincronizar manualmente con Google Sheets
  const handleSincronizarGoogleSheets = async () => {
    setSyncing(true)
    setSyncStatusMsg('Conectando con Google Sheets (jhaularstore@gmail.com)...')
    try {
      const { data: sesion } = await supabase.auth.getSession()
      const token = sesion.session?.access_token
      if (!token) {
        setSyncStatusMsg('Inicia sesión como administrador para sincronizar.')
        return
      }

      const res = await fetch('/api/sincronizar-produccion-sheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (res.status === 401 || res.status === 403) {
        setSyncStatusMsg(data.error || 'No autorizado. Solo un administrador puede sincronizar.')
        return
      }

      if (data.exito && data.items) {
        const itemsOrdenados = [...data.items].sort((a: ItemProduccion, b: ItemProduccion) =>
          a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' })
        )
        setItemsProduccion(itemsOrdenados)
        localStorage.setItem('jhaular_produccion_items', JSON.stringify(itemsOrdenados))
        setSyncStatusMsg(`¡Sincronización exitosa! ${itemsOrdenados.length} manillas ordenadas y sincronizadas.`)
      } else {
        setSyncStatusMsg(data.error || 'No se pudo sincronizar la producción.')
      }
    } catch {
      setSyncStatusMsg('No se pudo conectar con la sincronización.')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncStatusMsg(null), 4000)
    }
  }

  // Copiar Tabla al Portapapeles para Pegar Directamente en Google Sheets
  const handleCopiarParaGoogleSheets = () => {
    const itemsOrdenados = [...itemsProduccion].sort((a, b) =>
      a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' })
    )

    const headers = [
      'SKU',
      'Nombre de Prod',
      'Categoría',
      'Material / Especificación',
      'Color Hilo',
      'Precio BASE',
      'Precio FINAL',
      'GANANCIA',
      'Stock',
      'Estado',
      'Control QA'
    ]

    const rows = itemsOrdenados.map((item) => [
      item.sku,
      item.nombre,
      item.categoria,
      item.material,
      item.colorHilo,
      item.precioBase,
      item.precioPublico,
      item.ganancia,
      item.stock,
      item.estado,
      item.qa
    ])

    const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n')
    navigator.clipboard.writeText(tsv)
    setSyncStatusMsg('¡Tabla ordenada copiada! Abre Google Sheets en jhaularstore@gmail.com y presiona Ctrl+V en la celda A1.')
    setTimeout(() => setSyncStatusMsg(null), 5000)
  }

  // Exportar a Excel Formateado (.xls HTML nativo con celdas y colores en columnas)
  const handleExportarExcelHTML = () => {
    const itemsOrdenados = [...itemsProduccion].sort((a, b) =>
      a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' })
    )

    const rowsHtml = itemsOrdenados
      .map(
        (item) => `
      <tr>
        <td style="font-family: monospace; font-weight: bold; text-align: center;">${item.sku}</td>
        <td style="font-weight: bold;">${item.nombre}</td>
        <td>${item.categoria}</td>
        <td>${item.material}</td>
        <td>${item.colorHilo}</td>
        <td style="text-align: right;">$${item.precioBase.toLocaleString('es-CO')}</td>
        <td style="text-align: right; font-weight: bold;">$${item.precioPublico.toLocaleString('es-CO')}</td>
        <td style="text-align: right; font-weight: bold; color: #047857;">$${item.ganancia.toLocaleString('es-CO')}</td>
        <td style="text-align: center;">${item.stock}</td>
        <td style="text-align: center;">${item.estado}</td>
        <td style="text-align: center;">${item.qa}</td>
      </tr>
    `
      )
      .join('')

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>PRODUCCION JHAULAR</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #334155; text-align: left; }
          td { padding: 8px; border: 1px solid #cbd5e1; font-size: 13px; }
        </style>
      </head>
      <body>
        <h2>JHAULAR - Matriz de Producción & Ganancias (Ordenada JH-001 a JH-${itemsOrdenados.length.toString().padStart(3, '0')})</h2>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre de Prod</th>
              <th>Categoría</th>
              <th>Material / Especificación</th>
              <th>Color Hilo</th>
              <th>Precio BASE</th>
              <th>Precio FINAL</th>
              <th>GANANCIA</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Control QA</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `JHAULAR_PRODUCCION_COMPLETA_ORDENADA_${Date.now()}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setSyncStatusMsg('¡Excel (.xls) descargado! Tabla formateada en columnas con SKU JH-001 a JH-013.')
    setTimeout(() => setSyncStatusMsg(null), 4500)
  }

  // Abrir Modal de Nueva Manilla / Calculadora BOM
  const handleOpenNuevaManillaModal = (itemToEdit?: ItemProduccion | null) => {
    setEditingItem(itemToEdit || null)
    setIsBomModalOpen(true)
  }

  // Manejar navegación directa desde Catálogo (para abrir automáticamente el modal BOM)
  useEffect(() => {
    if (location.state) {
      const stateObj = location.state as any
      if (stateObj.openNewBomModal) {
        handleOpenNuevaManillaModal()
        window.history.replaceState({}, document.title)
      } else if (stateObj.editProdId || stateObj.editNombre) {
        const found = itemsProduccion.find(
          (i) =>
            i.id === stateObj.editProdId ||
            i.sku === stateObj.editProdId ||
            (stateObj.editNombre && i.nombre.toLowerCase() === stateObj.editNombre.toLowerCase())
        )
        if (found) {
          handleOpenNuevaManillaModal(found)
        } else {
          handleOpenNuevaManillaModal()
        }
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, itemsProduccion])

  // Guardar Manilla desde Calculadora BOM Completa
  const handleGuardarManillaBOMModal = async (newItem: ItemProduccion, extraPayload?: any) => {
    // 1. Actualizar estado local de producción
    let actualizados: ItemProduccion[] = []
    const existeIndex = itemsProduccion.findIndex((i) => i.sku === newItem.sku || i.id === newItem.id)
    if (existeIndex >= 0) {
      actualizados = [...itemsProduccion]
      actualizados[existeIndex] = newItem
    } else {
      actualizados = [newItem, ...itemsProduccion]
    }

    setItemsProduccion(actualizados)
    localStorage.setItem('jhaular_produccion_items', JSON.stringify(actualizados))

    // 2. Sincronizar en localStorage de Catálogo Admin
    try {
      const catalogLocales: ProductoData[] = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
      const catIndex = catalogLocales.findIndex(
        (c) => c.nombre.toLowerCase() === newItem.nombre.toLowerCase() || c.id === newItem.id
      )
      const prodCatalog: ProductoData = {
        id: newItem.id,
        nombre: newItem.nombre,
        categoria: newItem.categoria,
        descripcion: newItem.material,
        precio_venta: newItem.precioPublico,
        costo_total_real: newItem.precioBase,
        precio_sugerido: newItem.precioPublico,
        activo: newItem.estado === 'Disponible',
        es_publico: true,
        ...(extraPayload || {})
      }

      if (catIndex >= 0) {
        catalogLocales[catIndex] = { ...catalogLocales[catIndex], ...prodCatalog }
      } else {
        catalogLocales.unshift(prodCatalog)
      }
      localStorage.setItem('jhaular_saved_productos', JSON.stringify(catalogLocales))
    } catch {
      // ignore
    }

    // 3. Sincronizar en Supabase
    try {
      const slugGenerado = newItem.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 -]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') || `manilla-${Date.now()}`

      const payloadSupabase = {
        nombre: newItem.nombre,
        slug: `${slugGenerado}-${newItem.sku.toLowerCase()}`,
        descripcion: newItem.material,
        costo_materiales: extraPayload?.costo_materiales || Math.round(newItem.precioBase * 0.7),
        mano_obra: extraPayload?.mano_obra || Math.round(newItem.precioBase * 0.1),
        costo_total_real: newItem.precioBase,
        precio_sugerido: newItem.precioPublico,
        precio_venta: newItem.precioPublico,
        imagen_principal_url: extraPayload?.imagen_principal_url || null,
        imagen_url: extraPayload?.imagen_url || null,
        tiempo_produccion: extraPayload?.tiempo_produccion || 35,
        tiempo_produccion_min: extraPayload?.tiempo_produccion_min || 35,
        es_publico: true,
        activo: newItem.estado === 'Disponible'
      }

      const isUuid = (str?: string | null) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      if (isUuid(newItem.id)) {
        await supabase.from('productos').upsert({ id: newItem.id, ...payloadSupabase })
      } else {
        await supabase.from('productos').insert(payloadSupabase)
      }
    } catch (e) {
      console.warn('Supabase sync error:', e)
    }

    setSyncStatusMsg(`Manilla "${newItem.nombre}" guardada y publicada en Catálogo.`)
    setTimeout(() => setSyncStatusMsg(null), 3500)
  }

  // Eliminar Manilla
  const handleDeleteManilla = async (itemId: string) => {
    const actualizados = itemsProduccion.filter((i) => i.id !== itemId && i.sku !== itemId)
    setItemsProduccion(actualizados)
    localStorage.setItem('jhaular_produccion_items', JSON.stringify(actualizados))

    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('jhaular_deleted_product_ids') || '[]')
      if (!deletedIds.includes(itemId)) {
        deletedIds.push(itemId)
        localStorage.setItem('jhaular_deleted_product_ids', JSON.stringify(deletedIds))
      }
    } catch {
      // ignore
    }

    try {
      const isUuid = (str?: string | null) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))
      if (isUuid(itemId)) {
        await supabase.from('productos').delete().eq('id', itemId)
      }
    } catch {
      // ignore
    }

    setSyncStatusMsg('Manilla eliminada del catálogo de producción.')
    setTimeout(() => setSyncStatusMsg(null), 3500)
  }

  // Filtrado Multicriterio
  const itemsFiltrados = useMemo(() => {
    return itemsProduccion.filter((item) => {
      const cumpleSku = busquedaSku === '' || item.sku.toLowerCase().includes(busquedaSku.toLowerCase())
      const cumpleNombre = busquedaNombre === '' || item.nombre.toLowerCase().includes(busquedaNombre.toLowerCase())
      const cumpleCategoria = filtroCategoria === 'TODAS' || item.categoria === filtroCategoria
      const cumpleEstado = filtroEstado === 'TODOS' || item.estado === filtroEstado
      const cumpleQA = filtroQA === 'TODOS' || item.qa === filtroQA

      return cumpleSku && cumpleNombre && cumpleCategoria && cumpleEstado && cumpleQA
    })
  }, [itemsProduccion, busquedaSku, busquedaNombre, filtroCategoria, filtroEstado, filtroQA])

  // Métricas de Producción
  const totalManillas = itemsProduccion.length
  const totalGananciaAcumulada = useMemo(() => itemsProduccion.reduce((acc, i) => acc + (i.ganancia || 0), 0), [itemsProduccion])
  const agotadosCount = useMemo(() => itemsProduccion.filter((i) => i.stock === 0 || i.estado === 'Agotado').length, [itemsProduccion])
  const enProduccionCount = useMemo(() => itemsProduccion.filter((i) => i.estado === 'En producción').length, [itemsProduccion])

  // Helper de badges para Estado
  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'En producción':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'Agotado':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'Pausado':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  // Helper de badges para QA
  const getBadgeQA = (qa: string) => {
    switch (qa) {
      case 'Aprobado':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'Revisión':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'Pendiente':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Administrativo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              Catálogo Real Sincronizado (13 Manillas)
            </span>
            <span className="text-xs font-mono text-on-surface-variant">jhaularstore@gmail.com</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2 mt-1">
            <Hammer className="w-6 h-6 text-secondary" />
            Producción & Ganancias del Catálogo Real
          </h1>
          <p className="text-xs text-on-surface-variant">
            Matriz conectada al Catálogo Admin, desglose de Precio BASE, Precio PÚBLICO, GANANCIA y Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenNuevaManillaModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-mono text-xs font-bold rounded-lg border border-outline-variant/30 transition-all"
          >
            <Plus className="w-4 h-4 text-secondary" />
            <span>+ Nueva Manilla / BOM</span>
          </button>

          <button
            onClick={handleCopiarParaGoogleSheets}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded-lg border border-emerald-500/30 transition-all"
            title="Copiar tabla de 10 columnas ordenada al portapapeles para pegar directo en Google Sheets"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Copiar para Google Sheets</span>
          </button>

          <button
            onClick={handleExportarExcelHTML}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-mono text-xs font-bold rounded-lg border border-outline-variant/30 transition-all"
            title="Descargar archivo Excel formateado en columnas (.xls) con SKU JH-001 a JH-013"
          >
            <Download className="w-4 h-4 text-secondary" />
            <span>Descargar Excel (.xls)</span>
          </button>

          <button
            onClick={handleSincronizarGoogleSheets}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary font-mono text-xs font-bold rounded-lg hover:bg-secondary/90 transition-all shadow-md disabled:opacity-50"
          >
            <FileSpreadsheet className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Google Sheets'}</span>
          </button>
        </div>
      </div>

      {/* Mensaje de Estado de Sincronización */}
      {syncStatusMsg && (
        <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg text-xs font-mono text-secondary flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Catálogo Real</span>
            <Boxes className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-bold text-on-surface font-mono">{totalManillas} manillas</p>
          <p className="text-[11px] text-on-surface-variant font-mono">Cargadas desde Catálogo Admin</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Ganancia Acumulada</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            ${totalGananciaAcumulada.toLocaleString('es-CO')}
          </p>
          <p className="text-[11px] text-emerald-400 font-mono font-bold">Margen positivo en matriz</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">En Producción</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400 font-mono">{enProduccionCount} lotes</p>
          <p className="text-[11px] text-on-surface-variant font-mono">En taller de orfebrería</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Modelos Agotados</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">{agotadosCount} piezas</p>
          <p className="text-[11px] text-rose-400 font-mono">Requieren confección</p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Multicriterio */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant font-bold uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-secondary" />
          Filtros de Búsqueda de Producción Real
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Buscar SKU */}
          <div className="relative">
            <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={busquedaSku}
              onChange={(e) => setBusquedaSku(e.target.value)}
              placeholder="Buscar por SKU (ej. JH-001)..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary"
            />
          </div>

          {/* Buscar Nombre */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={busquedaNombre}
              onChange={(e) => setBusquedaNombre(e.target.value)}
              placeholder="Buscar por nombre (ej. mar, PROMESA)..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary"
            />
          </div>

          {/* Filtro Categoría */}
          <div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono focus:outline-none focus:border-secondary"
            >
              <option value="TODAS">Categorías (Todas)</option>
              {CATEGORIAS_PRODUCCION.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono focus:outline-none focus:border-secondary"
            >
              <option value="TODOS">Estado (Todos)</option>
              {ESTADOS_PRODUCCION.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro QA */}
          <div>
            <select
              value={filtroQA}
              onChange={(e) => setFiltroQA(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono focus:outline-none focus:border-secondary"
            >
              <option value="TODOS">Control QA (Todos)</option>
              {CONTROL_CALIDAD_QA.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Oficial de Producción (con Columnas Separadas: Precio BASE, Precio PÚBLICO y GANANCIA) */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Nombre de Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 max-w-xs">Material / Especificación</th>
                <th className="py-3 px-4">Color Hilo</th>
                <th className="py-3 px-4 text-right bg-amber-500/5 text-amber-300">Precio BASE</th>
                <th className="py-3 px-4 text-right bg-emerald-500/5 text-emerald-300">Precio PÚBLICO</th>
                <th className="py-3 px-4 text-right bg-emerald-500/15 text-emerald-400 font-bold">GANANCIA</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Control QA</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-xs">
              {itemsFiltrados.map((item) => (
                <tr key={item.sku} className="hover:bg-surface-container-low/40 transition-colors">
                  {/* SKU */}
                  <td className="py-3 px-4 font-mono font-bold text-secondary">{item.sku}</td>

                  {/* Nombre */}
                  <td className="py-3 px-4 font-medium text-on-surface">{item.nombre}</td>

                  {/* Categoría */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-container-high text-on-surface border border-outline-variant/30">
                      {item.categoria}
                    </span>
                  </td>

                  {/* Material / Especificación */}
                  <td className="py-3 px-4 text-on-surface-variant max-w-xs truncate" title={item.material}>
                    {item.material}
                  </td>

                  {/* Color Hilo */}
                  <td className="py-3 px-4 font-mono text-on-surface">{item.colorHilo}</td>

                  {/* Precio BASE */}
                  <td className="py-3 px-4 font-mono font-bold text-amber-300 text-right bg-amber-500/5">
                    ${item.precioBase.toLocaleString('es-CO')}
                  </td>

                  {/* Precio PÚBLICO */}
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-right bg-emerald-500/5">
                    ${item.precioPublico.toLocaleString('es-CO')}
                  </td>

                  {/* GANANCIA (Resaltada) */}
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-right bg-emerald-500/10">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      +${(item.ganancia || (item.precioPublico - item.precioBase)).toLocaleString('es-CO')}
                    </span>
                  </td>

                  {/* Stock */}
                  <td className="py-3 px-4 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        item.stock === 0
                          ? 'bg-rose-500/20 text-rose-400 font-bold'
                          : item.stock <= 3
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-on-surface'
                      }`}
                    >
                      {item.stock} u.
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${getBadgeEstado(
                        item.estado
                      )}`}
                    >
                      {item.estado}
                    </span>
                  </td>

                  {/* Control QA */}
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${getBadgeQA(
                        item.qa
                      )}`}
                    >
                      {item.qa}
                    </span>
                  </td>

                  {/* Acción Editar BOM */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenNuevaManillaModal(item)}
                      className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded border border-outline-variant/30 transition-all flex items-center gap-1 ml-auto"
                    >
                      <Calculator className="w-3 h-3 text-secondary" />
                      BOM
                    </button>
                  </td>
                </tr>
              ))}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-on-surface-variant text-xs font-mono">
                    No se encontraron manillas en el catálogo que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CALCULADORA BOM COMPLETA (4 FASES) */}
      <BomCalculatorModal
        isOpen={isBomModalOpen}
        onClose={() => setIsBomModalOpen(false)}
        itemToEdit={editingItem}
        totalItemsCount={itemsProduccion.length}
        onSave={handleGuardarManillaBOMModal}
        onDelete={handleDeleteManilla}
      />
    </div>
  )
}
