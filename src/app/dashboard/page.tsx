import { createClient } from '@/lib/supabase/server'
import DocumentList from '@/components/user/DocumentList'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, grupos(*)')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('documentos')
    .select('*, grupos(*), perfiles!documentos_subido_por_fkey(*)')
    .order('created_at', { ascending: false })

  if (perfil?.rol === 'administrador') {
    // Administradores ven todo
  } else {
    // Usuarios ven documentos de su grupo o sin grupo
    query = query.or(`grupo_id.is.null,grupo_id.eq.${perfil?.grupo_id}`)
  }

  const { data: documentos } = await query

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documentos y Recursos</h1>
        <p className="text-gray-600 mt-2">
          {perfil?.rol === 'administrador' 
            ? 'Todos los documentos disponibles' 
            : 'Documentos disponibles para tu grupo'}
        </p>
      </div>

      <DocumentList documentos={documentos || []} />
    </div>
  )
}