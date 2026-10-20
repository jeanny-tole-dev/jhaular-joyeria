import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  Save,
  Clock,
  DollarSign,
  AlertCircle,
  PackageCheck,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Material } from '../../../types/materiales'
import {
  CATEGORIAS_PRODUCTOS,
  type RecetaItem,
  type ProductoData
} from '../../../types/productos'
import { convertGoogleDriveUrl } from '../../../utils/driveUrlConverter'

// Tarifa fija de tejido/ensamblaje por minuto en COP
const COSTO_MINUTO_MANO_OBRA = 150

interface CategoriaItem {
  id: string
  nombre: string
}

// Convertidor seguro de números para el payload
const cleanNumber = (val: unknown): number => {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

// Generador automático de slug limpio con sufijo único
const generateSlug = (text: string): string => {
  const baseSlug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  const suffix = Math.random().toString(36).substring(2, 7)
  return baseSlug ? `${baseSlug}-${suffix}` : `producto-${suffix}`
}

export default function NuevoProducto() {
  const navigate = useNavigate()
  const { id: editProductId } = useParams<{ id?: string }>()
  const isEditMode = Boolean(editProductId)

  // Materiales y Categorías disponibles cargados de Supabase
  const [materialesDisponibles, setMaterialesDisponibles] = useState<Material[]>([])
  const [loadingMateriales, setLoadingMateriales] = useState<boolean>(true)
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [categoriaId, setCategoriaId] = useState<string>('')

  // Datos Básicos del Formulario
  const [nombre, setNombre] = useState<string>('')
  const [tiempoProduccionMin, setTiempoProduccionMin] = useState<number>(30)
  const [descripcion, setDescripcion] = useState<string>('')
  const [imagenUrl, setImagenUrl] = useState<string>('')
  const [destacado, setDestacado] = useState<boolean>(false)
  const [badgeTag, setBadgeTag] = useState<string>('NUEVO')

  // Receta de Materiales (BOM)
  const [receta, setReceta] = useState<RecetaItem[]>([])

  // Fijación de Precios & Rentabilidad
  const [margenGananciaPct, setMargenGananciaPct] = useState<number>(40)
  const [precioVentaFinal, setPrecioVentaFinal] = useState<number>(0)
  const [precioVentaEditadoManual, setPrecioVentaEditadoManual] = useState<boolean>(false)

  // Estados de Guardado
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Cargar categorías y lista de materiales activos de Supabase + Datos previos si estamos en modo edición
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        setLoadingMateriales(true)

        // 1. Cargar Categorías (con fallback a categorías públicas del e-commerce)
        const { data: catData, error: catError } = await supabase
          .from('categorias')
          .select('id, nombre')
          .order('nombre', { ascending: true })

        if (!catError && catData && catData.length > 0) {
          setCategorias(catData)
          setCategoriaId(catData[0].id)
        } else {
          const FALLBACK_CATEGORIAS_PUBLICAS: CategoriaItem[] = [
            { id: 'cat_religiosa', nombre: 'Religiosa / Sacra' },
            { id: 'cat_tradicional', nombre: 'Tradicional' },
            { id: 'cat_aventura', nombre: 'Aventura' },
            { id: 'cat_ediciones_especiales', nombre: 'Ediciones Especiales' }
          ]
          setCategorias(FALLBACK_CATEGORIAS_PUBLICAS)
          setCategoriaId(FALLBACK_CATEGORIAS_PUBLICAS[0].id)
        }

        // 2. Cargar Materiales Activos
        const { data: matData, error: matError } = await supabase
          .from('materiales')
          .select('*')
          .eq('activo', true)
          .order('nombre', { ascending: true })

        if (matError) throw matError
        const mats = matData || []
        setMaterialesDisponibles(mats)

        // 3. Si estamos en MODO EDICIÓN, precargar los datos del producto existente (Supabase + LocalStorage)
        if (isEditMode && editProductId) {
          let prodData: any = null

          try {
            const { data, error: prodErr } = await supabase
              .from('productos')
              .select('*')
              .eq('id', editProductId)
              .maybeSingle()

            if (!prodErr && data) prodData = data
          } catch (e) {
            console.warn('Error leyendo producto de Supabase:', e)
          }

          // Si no está en Supabase, leer del almacenamiento local
          if (!prodData) {
            try {
              const localSaved: ProductoData[] = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
              prodData = localSaved.find((p) => p.id === editProductId)
            } catch (e) {
              console.warn('Error leyendo producto local:', e)
            }
          }

          if (prodData) {
            setNombre(prodData.nombre || '')
            if (prodData.categoria_id) setCategoriaId(prodData.categoria_id)
            setTiempoProduccionMin(prodData.tiempo_produccion || 30)
            setDescripcion(prodData.descripcion || '')
            setImagenUrl(prodData.imagen_principal_url || prodData.imagen_url || '')
            setDestacado(Boolean(prodData.destacado))
            setBadgeTag(prodData.bonds_tag || prodData.meta_keywords || 'NUEVO')
            const precioActual = prodData.precio_venta || prodData.precio_sugerido || 0
            if (precioActual > 0) {
              setPrecioVentaFinal(precioActual)
              setPrecioVentaEditadoManual(true)
            }
          }

          // Cargar receta BOM asociada
          const { data: recipeData, error: recipeErr } = await supabase
            .from('producto_materiales')
            .select('*, material:materiales(*)')
            .eq('producto_id', editProductId)

          if (!recipeErr && recipeData && recipeData.length > 0) {
            setReceta(
              recipeData.map((row: any) => ({
                id: row.id || crypto.randomUUID(),
                material_id: row.material_id,
                material: row.material || mats.find((m) => m.id === row.material_id) || null,
                cantidad: row.cantidad || 1
              }))
            )
          } else if (mats.length > 0) {
            setReceta([
              {
                id: crypto.randomUUID(),
                material_id: mats[0].id,
                material: mats[0],
                cantidad: 1
              }
            ])
          }
        } else if (mats.length > 0) {
          // Fila inicial vacía en la receta para un producto nuevo
          setReceta([
            {
              id: crypto.randomUUID(),
              material_id: mats[0].id,
              material: mats[0],
              cantidad: 1
            }
          ])
        }
      } catch (err: unknown) {
        console.error('Error al cargar datos iniciales de Supabase:', err)
      } finally {
        setLoadingMateriales(false)
      }
    }

    fetchDatosIniciales()
  }, [isEditMode, editProductId])

  // AGREGAR FILA DE INSUMO A LA RECETA
  const handleAddRecetaItem = () => {
    const defaultMat = materialesDisponibles.length > 0 ? materialesDisponibles[0] : null
    setReceta((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        material_id: defaultMat?.id || '',
        material: defaultMat,
        cantidad: 1
      }
    ])
  }

  // CAMBIAR MATERIAL EN UNA FILA DE LA RECETA
  const handleMaterialChange = (id: string, newMaterialId: string) => {
    const selectedMat = materialesDisponibles.find((m) => m.id === newMaterialId) || null
    setReceta((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, material_id: newMaterialId, material: selectedMat }
          : item
      )
    )
  }

  // CAMBIAR CANTIDAD EN UNA FILA DE LA RECETA
  const handleCantidadChange = (id: string, cantidad: number) => {
    setReceta((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidad } : item))
    )
  }

  // ELIMINAR FILA DE LA RECETA
  const handleRemoveRecetaItem = (id: string) => {
    setReceta((prev) => prev.filter((item) => item.id !== id))
  }

  // --- MOTOR CONTABLE Y CALCULADORA EN TIEMPO REAL (useMemo) ---
  // 1. Costo de Materiales
  const costoMateriales = useMemo(() => {
    return receta.reduce((acc, item) => {
      const costoUnitario = item.material?.costo_unitario || 0
      return acc + cleanNumber(item.cantidad) * cleanNumber(costoUnitario)
    }, 0)
  }, [receta])

  // 2. Costo de Mano de Obra ($150 COP / min)
  const costoManoObra = useMemo(() => {
    return Math.max(0, cleanNumber(tiempoProduccionMin)) * COSTO_MINUTO_MANO_OBRA
  }, [tiempoProduccionMin])

  // 3. Margen Operativo (Gastos Indirectos 10% sobre Materiales + Mano Obra)
  const costoMargenOperativo = useMemo(() => {
    return (costoMateriales + costoManoObra) * 0.1
  }, [costoMateriales, costoManoObra])

  // 4. COSTO TOTAL REAL DEL PRODUCTO
  const costoTotalReal = useMemo(() => {
    return costoMateriales + costoManoObra + costoMargenOperativo
  }, [costoMateriales, costoManoObra, costoMargenOperativo])

  // 5. Precio de Venta Sugerido = Costo Total Real / (1 - (Margen / 100))
  const precioSugerido = useMemo(() => {
    if (costoTotalReal <= 0) return 0
    const margenDecimal = Math.min(Math.max(cleanNumber(margenGananciaPct), 0), 99) / 100
    const resultado = costoTotalReal / (1 - margenDecimal)
    // Redondear a la centena más cercana para precios comerciales en COP (ej: $14.500)
    return Math.ceil(resultado / 100) * 100
  }, [costoTotalReal, margenGananciaPct])

  // Sincronizar el Precio de Venta Final si no ha sido editado manualmente por el usuario
  useEffect(() => {
    if (!precioVentaEditadoManual) {
      setPrecioVentaFinal(precioSugerido)
    }
  }, [precioSugerido, precioVentaEditadoManual])

  // Cálculo del Margen Real obtenido según el Precio de Venta Final
  const margenGananciaRealResultante = useMemo(() => {
    if (precioVentaFinal <= 0 || costoTotalReal <= 0) return 0
    const utilidad = precioVentaFinal - costoTotalReal
    return (utilidad / precioVentaFinal) * 100
  }, [precioVentaFinal, costoTotalReal])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  // --- SUBMIT: FLUJO SECUENCIAL Y PASOS DE GUARDADO (PASOS 1, 2 Y 3) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!nombre.trim()) {
      setErrorMessage('El nombre del producto es obligatorio.')
      return
    }

    if (receta.length === 0) {
      setErrorMessage('Debes agregar al menos un material a la receta BOM del producto.')
      return
    }

    try {
      setIsSubmitting(true)

      // Generar slug automático limpio a partir del nombre
      const slugGenerado = generateSlug(nombre) || `producto-${Date.now()}`
      const imagenLimpia = convertGoogleDriveUrl(imagenUrl) || null
      const tiempoProduccionNum = cleanNumber(tiempoProduccionMin)
      const precioVentaNum = cleanNumber(precioVentaFinal) > 0 ? cleanNumber(precioVentaFinal) : Math.round(precioSugerido)

      // Validar si categoriaId es un UUID válido (evita error 'invalid input syntax for type uuid' cuando se usan fallbacks)
      const isUuid = (str?: string | null) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      const validCategoriaUuid = isUuid(categoriaId) ? categoriaId : null

      // PASO 1: Sanitizar el Payload del Producto
      const payloadCompleto: Record<string, any> = {
        nombre: nombre.trim(),
        slug: slugGenerado,
        categoria_id: validCategoriaUuid,
        descripcion: descripcion.trim() || null,
        imagen_principal_url: imagenLimpia,
        imagen_url: imagenLimpia,
        tiempo_produccion: tiempoProduccionNum,
        costo_materiales: Math.round(costoMateriales),
        mano_obra: Math.round(costoManoObra),
        costo_total_real: Math.round(costoTotalReal),
        precio_sugerido: Math.round(precioSugerido),
        precio_venta: precioVentaNum,
        destacado,
        bonds_tag: badgeTag,
        meta_keywords: badgeTag,
        es_publico: true,
        activo: true
      }

      let productoId: string | null = editProductId || null

      // PASO 2: Inserción o Actualización Resiliente en la tabla 'productos'
      if (isEditMode && editProductId) {
        // 2.A MODO EDICIÓN (UPDATE / UPSERT RESILIENTE)
        const payloadConId = { id: editProductId, ...payloadCompleto }

        const { error: updateErr1 } = await supabase
          .from('productos')
          .upsert([payloadConId])

        if (updateErr1) {
          console.warn('Reintento de UPSERT sin la columna bonds_tag:', updateErr1)
          const payloadSinBonds: Record<string, any> = { ...payloadConId }
          delete payloadSinBonds.bonds_tag
          await supabase.from('productos').upsert([payloadSinBonds])
        }

        // Limpiar la receta previa para re-insertar la versión actualizada
        try {
          await supabase.from('producto_materiales').delete().eq('producto_id', editProductId)
        } catch (delErr) {
          console.warn('Error limpiando receta previa:', delErr)
        }
      } else {
        // 2.B MODO CREACIÓN (INSERT)
        const { data: d1, error: e1 } = await supabase
          .from('productos')
          .insert([payloadCompleto])
          .select('id')
          .maybeSingle()

        if (!e1 && d1?.id) {
          productoId = d1.id
        } else {
          console.warn('Primer intento de inserción falló en Supabase:', e1)
          const payloadSinBonds = { ...payloadCompleto }
          delete payloadSinBonds.bonds_tag

          const { data: d2, error: e2 } = await supabase
            .from('productos')
            .insert([payloadSinBonds])
            .select('id')
            .maybeSingle()

          if (!e2 && d2?.id) {
            productoId = d2.id
          } else {
            console.warn('Segundo intento de inserción falló:', e2)
            const payloadMinimo = {
              nombre: nombre.trim(),
              slug: slugGenerado,
              precio_venta: precioVentaNum,
              destacado
            }

            const { data: d3, error: e3 } = await supabase
              .from('productos')
              .insert([payloadMinimo])
              .select('id')
              .single()

            if (e3) throw e3
            if (d3?.id) productoId = d3.id
          }
        }
      }

      if (!productoId) {
        throw new Error('No se pudo obtener el ID del producto en Supabase.')
      }

      // PASO 3: Guardar la Receta BOM en la tabla 'producto_materiales'
      const recetaConsolidadaMap = receta
        .filter((item) => Boolean(item.material_id))
        .reduce<Record<string, number>>((acc, item) => {
          const matId = item.material_id
          const cant = cleanNumber(item.cantidad)
          acc[matId] = (acc[matId] || 0) + cant
          return acc
        }, {})

      const recetaPayload = Object.entries(recetaConsolidadaMap).map(([material_id, cantidad]) => ({
        producto_id: productoId,
        material_id,
        cantidad
      }))

      if (recetaPayload.length > 0) {
        const { error: recetaError } = await supabase
          .from('producto_materiales')
          .insert(recetaPayload)

        if (recetaError) {
          console.error('Error al guardar la receta BOM (producto_materiales):', recetaError)
        }
      }

      // El stock de materiales no se toca al guardar la ficha.
      // Baja solo cuando se confirma una venta real.

      // PASO 4: Guardar respaldo local para garantizar visibilidad e impacto inmediato en el Catálogo Admin y Público
      try {
        const prodGuardado: ProductoData = {
          id: productoId,
          nombre: payloadCompleto.nombre,
          precio_venta: payloadCompleto.precio_venta,
          costo_total_real: payloadCompleto.costo_total_real,
          costo_materiales: payloadCompleto.costo_materiales,
          mano_obra: payloadCompleto.mano_obra,
          tiempo_produccion: payloadCompleto.tiempo_produccion,
          tiempo_produccion_min: payloadCompleto.tiempo_produccion,
          ...payloadCompleto,
          updated_at: new Date().toISOString()
        } as ProductoData
        const prevSaved = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
        const sinDup = prevSaved.filter((p: ProductoData) => p.id !== productoId && p.id !== editProductId)
        localStorage.setItem('jhaular_saved_productos', JSON.stringify([prodGuardado, ...sinDup]))
      } catch (lErr) {
        console.warn('Error en respaldo local:', lErr)
      }

      // Redireccionar al catálogo tras guardar o editar exitosamente
      navigate('/admin/catalogo')
    } catch (err: any) {
      console.error('Error creando producto:', err)
      const msg =
        err?.message ||
        err?.details ||
        err?.hint ||
        (err instanceof Error ? err.message : 'Error al guardar el producto en Supabase.')
      setErrorMessage(`Error al guardar en Supabase: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Navigation */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/catalogo"
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-secondary" />
              <h1 className="font-display text-xl font-bold text-on-surface">
                {isEditMode ? 'Editar Producto & Calculadora BOM' : 'Nuevo Producto & Calculadora BOM'}
              </h1>
            </div>
            <p className="text-xs text-on-surface-variant">
              Fórmula contable: Costo de materiales, mano de obra ($150/min), indirectos y precio sugerido.
            </p>
          </div>
        </div>

        <button
          type="submit"
          form="producto-form"
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-secondary text-on-secondary hover:bg-secondary/90 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Guardando Producto...' : 'Guardar Producto'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 flex items-center space-x-2 text-xs text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Formulario (Izq) & Calculadora Contable (Der) */}
      <form id="producto-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Datos Básicos & Receta BOM */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Datos Básicos */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-on-surface flex items-center space-x-2">
              <PackageCheck className="w-4 h-4 text-secondary" />
              <span>1. Información General del Producto</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  Nombre del Producto <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Manilla Macramé San Benito Hilo Rojo Oro 18k..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                  required
                />
              </div>

              {/* Categoría */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  Categoría <span className="text-error">*</span>
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary transition-all font-medium cursor-pointer"
                  required
                >
                  {categorias.length > 0 ? (
                    categorias.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-surface-container-low text-on-surface">
                        {cat.nombre}
                      </option>
                    ))
                  ) : (
                    CATEGORIAS_PRODUCTOS.map((cat) => (
                      <option key={cat} value={cat} className="bg-surface-container-low text-on-surface">
                        {cat.replace('_', ' ')}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Tiempo de Producción */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  Tiempo de Producción (Minutos) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                  <input
                    type="number"
                    min="1"
                    value={tiempoProduccionMin}
                    onChange={(e) => setTiempoProduccionMin(Number(e.target.value))}
                    placeholder="30"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-mono font-bold focus:outline-none focus:border-secondary transition-all"
                    required
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles de diseño, significado espiritual o materiales clave..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              {/* URL Imagen */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                  <span>URL de Imagen del Producto</span>
                  <span className="text-[10px] text-amber-400 font-bold">Auto-convierte enlaces de Google Drive</span>
                </label>
                <input
                  type="url"
                  value={imagenUrl}
                  onChange={(e) => {
                    const raw = e.target.value
                    const converted = convertGoogleDriveUrl(raw)
                    setImagenUrl(converted)
                  }}
                  placeholder="Pegar enlace de Google Drive o URL de imagen (https://...)"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                />

                {/* Previsualización en Tiempo Real de la Imagen */}
                {imagenUrl && (
                  <div className="mt-2 p-3 bg-surface-container-lowest rounded-xl border border-amber-500/30 flex items-center space-x-3.5 shadow-md">
                    <div className="w-16 h-16 rounded-lg bg-black/50 overflow-hidden border border-amber-500/40 shrink-0 flex items-center justify-center relative group">
                      <img
                        src={convertGoogleDriveUrl(imagenUrl)}
                        alt="Vista previa del producto"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="space-y-1 text-xs overflow-hidden">
                      <p className="font-bold text-amber-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Enlace Convertido para Visualización Directa</span>
                      </p>
                      <p className="text-[10.5px] font-mono text-on-surface-variant/80 truncate break-all">
                        {convertGoogleDriveUrl(imagenUrl)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Etiqueta Visual (Badge) */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                  <span>Etiqueta Visual (Badge sobre foto)</span>
                  <span className="text-[10px] text-amber-400 font-bold">Líneas & Ganchos de Venta</span>
                </label>
                <select
                  value={badgeTag}
                  onChange={(e) => setBadgeTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary transition-all font-bold cursor-pointer"
                >
                  <optgroup label="🔥 Ganchos de Venta & E-Commerce" className="bg-surface-container-low text-amber-300 font-bold">
                    <option value="MÁS VENDIDO">MÁS VENDIDO (Best Seller)</option>
                    <option value="NUEVO">NUEVO (Lanzamiento)</option>
                    <option value="EDICIÓN LIMITADA">EDICIÓN LIMITADA</option>
                    <option value="ÚLTIMAS UNIDADES">ÚLTIMAS UNIDADES</option>
                    <option value="OFERTA ESPECIAL">OFERTA ESPECIAL</option>
                    <option value="RECOMENDADO">RECOMENDADO DEL ATELIER</option>
                  </optgroup>

                  <optgroup label="💎 Líneas de Colección Jhaular" className="bg-surface-container-low text-amber-300 font-bold">
                    <option value="LÍNEA AVENTURA">LÍNEA AVENTURA</option>
                    <option value="LÍNEA TRADICIONAL">LÍNEA TRADICIONAL</option>
                    <option value="COLECCIÓN SACRA">COLECCIÓN SACRA</option>
                    <option value="EDICIÓN ESPECIAL">EDICIÓN ESPECIAL</option>
                    <option value="CLÁSICO JHAULAR">CLÁSICO JHAULAR</option>
                    <option value="HECHO A MANO">HECHO A MANO (Artesanal)</option>
                    <option value="ORO 18K CERTIFICADO">ORO 18K CERTIFICADO</option>
                  </optgroup>
                </select>
              </div>

              {/* Toggle de Destacar (Más Vendido) */}
              <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 mt-2">
                <div>
                  <p className="text-xs font-bold text-on-surface flex items-center space-x-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-secondary" />
                    <span>Destacar Producto (Más Vendido)</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Muestra este producto en la sección principal de "Más Vendidos" del catálogo público.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={destacado}
                    onChange={(e) => setDestacado(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Constructor de la Receta (BOM) */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-secondary" />
                  <span>2. Constructor de la Receta (BOM - Bill of Materials)</span>
                </h2>
                <p className="text-[11px] text-on-surface-variant">
                  Selecciona los insumos e ingresa la cantidad exacta requerida para elaborar una unidad.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRecetaItem}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-secondary transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Insumo</span>
              </button>
            </div>

            {loadingMateriales ? (
              <p className="text-xs text-on-surface-variant font-mono">Cargando inventario de insumos...</p>
            ) : receta.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-outline-variant/40 rounded-xl text-xs text-on-surface-variant">
                No has agregado insumos a la receta. Haz clic en "Agregar Insumo".
              </div>
            ) : (
              <div className="space-y-3">
                {receta.map((row, index) => {
                  const subtotalFila = (row.cantidad || 0) * (row.material?.costo_unitario || 0)
                  return (
                    <div
                      key={row.id}
                      className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        {/* Selector de Insumo */}
                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[10px] font-mono text-on-surface-variant uppercase">
                            Insumo #{index + 1}
                          </label>
                          <select
                            value={row.material_id}
                            onChange={(e) => handleMaterialChange(row.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary font-medium cursor-pointer"
                          >
                            {materialesDisponibles.map((m) => (
                              <option key={m.id} value={m.id} className="bg-surface-container-low text-on-surface">
                                {m.nombre} ({m.categoria}) — {formatCurrency(m.costo_unitario)} / {m.unidad}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Cantidad Requerida */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] font-mono text-on-surface-variant uppercase">
                            Cantidad ({row.material?.unidad || 'und'})
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={row.cantidad}
                            onChange={(e) => handleCantidadChange(row.id, Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:border-secondary"
                          />
                        </div>

                        {/* Costo Subtotal */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] font-mono text-on-surface-variant uppercase">
                            Subtotal COP
                          </label>
                          <p className="px-2.5 py-1.5 font-mono font-bold text-emerald-400">
                            {formatCurrency(subtotalFila)}
                          </p>
                        </div>
                      </div>

                      {/* Botón Eliminar Fila */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecetaItem(row.id)}
                        className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/15 transition-all self-end sm:self-center"
                        title="Eliminar insumo de la receta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Calculadora Contable y Rentabilidad (Sticky Panel) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-20 p-5 rounded-2xl bg-surface-container-lowest border border-secondary/40 shadow-xl space-y-5">
            <div className="flex items-center space-x-2 border-b border-outline-variant/30 pb-3">
              <Calculator className="w-5 h-5 text-secondary" />
              <h2 className="text-base font-bold text-on-surface">
                Resumen Contable & Rentabilidad
              </h2>
            </div>

            {/* Desglose de Costos */}
            <div className="space-y-2.5 text-xs font-mono">
              {/* 1. Costo Materiales */}
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                <span className="text-on-surface-variant">Costo Insumos (BOM):</span>
                <span className="font-bold text-on-surface">{formatCurrency(costoMateriales)}</span>
              </div>

              {/* 2. Mano de Obra */}
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                <div>
                  <span className="text-on-surface-variant">Mano de Obra:</span>
                  <p className="text-[10px] text-on-surface-variant/60 font-normal">
                    {tiempoProduccionMin} min × $150/min
                  </p>
                </div>
                <span className="font-bold text-on-surface">{formatCurrency(costoManoObra)}</span>
              </div>

              {/* 3. Margen Operativo (Indirectos 10%) */}
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                <div>
                  <span className="text-on-surface-variant">Indirectos Operativos (10%):</span>
                  <p className="text-[10px] text-on-surface-variant/60 font-normal">
                    SIM, empaque, pasajes
                  </p>
                </div>
                <span className="font-bold text-on-surface">{formatCurrency(costoMargenOperativo)}</span>
              </div>

              {/* COSTO TOTAL REAL */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-secondary/30 flex items-center justify-between text-sm mt-3">
                <span className="font-bold text-on-surface">COSTO TOTAL REAL:</span>
                <span className="font-bold text-amber-400 text-base">
                  {formatCurrency(costoTotalReal)}
                </span>
              </div>
            </div>

            {/* Fijación de Precios y Ganancia */}
            <div className="space-y-4 pt-2 border-t border-outline-variant/30">
              {/* Input Margen de Ganancia Deseado */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  Margen Ganancia Deseado (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="95"
                  value={margenGananciaPct}
                  onChange={(e) => {
                    setMargenGananciaPct(Number(e.target.value))
                    setPrecioVentaEditadoManual(false)
                  }}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs font-mono font-bold text-secondary focus:outline-none focus:border-secondary"
                />
              </div>

              {/* MUESTRA GRANDE: Precio Sugerido con Botón de Aplicación Directa */}
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-semibold">
                    PRECIO DE VENTA SUGERIDO
                  </p>
                  <span className="text-[9.5px] font-mono text-emerald-400/80 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Calculado Automático
                  </span>
                </div>
                <p className="text-3xl font-bold text-emerald-400 font-mono">
                  {formatCurrency(precioSugerido)}
                </p>
                <p className="text-[10px] text-emerald-300/70 font-mono">
                  Fórmula: Costo Real ({formatCurrency(costoTotalReal)}) / (1 - {margenGananciaPct}%)
                </p>

                {/* BOTÓN INTERACTIVO: APLICAR PRECIO SUGERIDO */}
                <button
                  type="button"
                  onClick={() => {
                    setPrecioVentaFinal(precioSugerido)
                    setPrecioVentaEditadoManual(false)
                  }}
                  className="w-full mt-2 py-2 px-3 bg-[#85E3B3] hover:bg-emerald-300 text-slate-950 font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Aplicar Precio Sugerido ({formatCurrency(precioSugerido)})</span>
                </button>
              </div>

              {/* Input Precio de Venta Final */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                  <span>Precio de Venta Final (COP)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPrecioVentaFinal(precioSugerido)
                      setPrecioVentaEditadoManual(false)
                    }}
                    className="text-[10px] text-emerald-400 hover:underline font-mono font-bold cursor-pointer"
                  >
                    ⚡ Usar Sugerido ({formatCurrency(precioSugerido)})
                  </button>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={precioVentaFinal}
                    onChange={(e) => {
                      setPrecioVentaFinal(Number(e.target.value))
                      setPrecioVentaEditadoManual(true)
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-surface-container-low border border-secondary rounded-lg text-sm font-mono font-bold text-secondary focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Advertencia si el precio manual genera Pérdida o Margen Negativo */}
              {precioVentaFinal < costoTotalReal && (
                <div className="p-3 bg-red-950/90 border border-red-500/60 rounded-xl text-xs text-red-200 font-mono space-y-1.5 shadow-lg">
                  <div className="flex items-center space-x-1.5 font-bold text-red-300">
                    <span>⚠️ ATENCIÓN: PÉRDIDA DETECTADA</span>
                  </div>
                  <p className="text-[11px] text-red-200/90 leading-tight">
                    El precio manual ({formatCurrency(precioVentaFinal)}) es menor al Costo Real en Bodega ({formatCurrency(costoTotalReal)}).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPrecioVentaFinal(precioSugerido)
                      setPrecioVentaEditadoManual(false)
                    }}
                    className="w-full mt-1 py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow"
                  >
                    ⚡ Corregir y Aplicar Precio Sugerido ({formatCurrency(precioSugerido)})
                  </button>
                </div>
              )}

              {/* Resumen de Margen Real Obtenido */}
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Margen Ganancia Real:</span>
                <span className={`font-mono font-bold ${margenGananciaRealResultante < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {margenGananciaRealResultante.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-semibold bg-secondary text-on-secondary hover:bg-secondary/90 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar & Guardar Producto'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
