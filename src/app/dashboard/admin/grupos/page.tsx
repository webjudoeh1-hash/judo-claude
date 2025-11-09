import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminGruposManager from '@/components/admin/AdminGruposManager'

export default async function AdminGruposPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'administrador') {
    redirect('/dashboard')
  }

  const { data: grupos } = await supabase
    .from('grupos')
    .select('*, perfiles(count)')
    .order('nombre')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Grupos</h1>
        <p className="text-gray-600 mt-2">Crear, editar y eliminar grupos</p>
      </div>

      <AdminGruposManager grupos={grupos || []} />
    </div>
  )
}