import { createClient } from '@/lib/supabase/server'
import DocumentList from '@/components/user/DocumentList'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user || userError) {
    redirect('/login')
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('*, grupos(*)')
    .eq('id', user.id)
    .single()

  if (!perfil || perfilError) {
    redirect('/login')
  }

  let query = supabase
    .from('documentos')
    .select('*, grupos(*), perfiles!documentos_subido_por_fkey(*)')
    .order('created_at', { ascending: false })

  if (perfil.rol !== 'administrador') {
    // Usuarios ven documentos de su grupo o sin grupo
    if (perfil.grupo_id) {
      query = query.or(`grupo_id.is.null,grupo_id.eq.${perfil.grupo_id}`)
    } else {
      query = query.is('grupo_id', null)
    }
  }

  const { data: documentos } = await query

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documentos y Recursos</h1>
        <p className="text-gray-600 mt-2">
          {perfil.rol === 'administrador' 
            ? 'Todos los documentos disponibles' 
            : 'Documentos disponibles para ti'}
        </p>
      </div>

      <DocumentList documentos={documentos || []} />
    </div>
  )
}
