import { createClient } from '@/lib/supabase/server'
import PerfilForm from '@/components/user/PerfilForm'

export default async function PerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, grupos(*)')
    .eq('id', user.id)
    .single()

  if (!perfil) return null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">Información personal</p>
      </div>

      <PerfilForm perfil={perfil} />
    </div>
  )
}