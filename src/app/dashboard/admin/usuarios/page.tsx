import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminUsuariosManager from '@/components/admin/AdminUsuariosManager'

export default async function AdminUsuariosPage() {
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

  const { data: perfiles } = await supabase
    .from('perfiles')
    .select('*, grupos(*)')
    .order('created_at', { ascending: false })

  const { data: grupos } = await supabase
    .from('grupos')
    .select('*')
    .order('nombre')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="text-gray-600 mt-2">Crear, editar y eliminar usuarios</p>
      </div>

      <AdminUsuariosManager perfiles={perfiles || []} grupos={grupos || []} />
    </div>
  )
}