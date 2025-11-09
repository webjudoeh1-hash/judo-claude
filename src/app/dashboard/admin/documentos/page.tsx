import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDocumentosManager from '@/components/admin/AdminDocumentosManager'

export default async function AdminDocumentosPage() {
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

  const { data: documentos } = await supabase
    .from('documentos')
    .select('*, grupos(*), perfiles!documentos_subido_por_fkey(*)')
    .order('created_at', { ascending: false })

  const { data: grupos } = await supabase
    .from('grupos')
    .select('*')
    .order('nombre')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Documentos</h1>
        <p className="text-gray-600 mt-2">Administrar documentos e imágenes</p>
      </div>

      <AdminDocumentosManager 
        documentos={documentos || []} 
        grupos={grupos || []}
        userId={user.id}
      />
    </div>
  )
}