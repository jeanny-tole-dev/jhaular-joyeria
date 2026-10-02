import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Props {
  children: ReactNode
}

// Verifica que haya sesión Y que profiles.role === 'ADMIN'.
// Esto es una capa de UX (evita mostrar la pantalla al usuario incorrecto);
// la protección real de los DATOS la hacen las políticas RLS con is_admin().
export default function ProtectedRoute({ children }: Props) {
  const [estado, setEstado] = useState<'cargando' | 'autorizado' | 'denegado'>(
    'cargando'
  )

  useEffect(() => {
    const verificar = async () => {
      const { data: sesion } = await supabase.auth.getSession()
      if (!sesion.session) {
        setEstado('denegado')
        return
      }
      const { data: perfil } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sesion.session.user.id)
        .single()

      const role = perfil ? (perfil as { role: string }).role : null
      setEstado(role === 'ADMIN' ? 'autorizado' : 'denegado')
    }
    verificar()
  }, [])

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
        <p className="label-caps text-on-surface-variant">Verificando acceso…</p>
      </div>
    )
  }

  if (estado === 'denegado') {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
