import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      return
    }
    navigate('/admin')
  }

  return (
    <main className="bg-background text-on-background min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
        <h1 className="font-display text-headline-md">Acceso Admin</h1>
        <input
          type="email"
          placeholder="correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent border-b border-outline-variant py-2 font-mono text-technical-mono focus:border-secondary outline-none"
        />
        <input
          type="password"
          placeholder="contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent border-b border-outline-variant py-2 font-mono text-technical-mono focus:border-secondary outline-none"
        />
        {error && <p className="text-error text-body-md">{error}</p>}
        <button type="submit" className="bg-secondary text-on-secondary px-8 py-3 label-caps w-full">
          Entrar
        </button>
      </form>
    </main>
  )
}
