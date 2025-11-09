'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Perfil, Grupo } from '@/types/database.types'
import { Plus, Edit, Trash2, X, User, Shield, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface AdminUsuariosManagerProps {
  perfiles: any[]
  grupos: Grupo[]
}

export default function AdminUsuariosManager({ 
  perfiles: initialPerfiles, 
  grupos 
}: AdminUsuariosManagerProps) {
  const [perfiles, setPerfiles] = useState(initialPerfiles)
  const [showModal, setShowModal] = useState(false)
  const [editingPerfil, setEditingPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRol, setFilterRol] = useState<'all' | 'administrador' | 'usuario'>('all')
  
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    fecha_nacimiento: '',
    rol: 'usuario' as 'administrador' | 'usuario',
    grupo_id: '',
    activo: true,
  })

  const filteredPerfiles = perfiles.filter((perfil) => {
    const rolMatch = filterRol === 'all' || perfil.rol === filterRol
    const searchMatch = searchTerm === '' || 
      perfil.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perfil.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perfil.email.toLowerCase().includes(searchTerm.toLowerCase())
    return rolMatch && searchMatch
  })

  const openCreateModal = () => {
    setEditingPerfil(null)
    setFormData({
      nombre: '',
      apellidos: '',
      email: '',
      password: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      codigo_postal: '',
      fecha_nacimiento: '',
      rol: 'usuario',
      grupo_id: '',
      activo: true,
    })
    setShowModal(true)
  }

  const openEditModal = (perfil: any) => {
    setEditingPerfil(perfil)
    setFormData({
      nombre: perfil.nombre,
      apellidos: perfil.apellidos || '',
      email: perfil.email,
      password: '',
      telefono: perfil.telefono || '',
      direccion: perfil.direccion || '',
      ciudad: perfil.ciudad || '',
      codigo_postal: perfil.codigo_postal || '',
      fecha_nacimiento: perfil.fecha_nacimiento || '',
      rol: perfil.rol,
      grupo_id: perfil.grupo_id || '',
      activo: perfil.activo,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingPerfil) {
        // Editar usuario existente
        const updateData: any = {
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          telefono: formData.telefono,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          codigo_postal: formData.codigo_postal,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          rol: formData.rol,
          grupo_id: formData.grupo_id || null,
          activo: formData.activo,
        }

        const { error } = await supabase
          .from('perfiles')
          .update(updateData)
          .eq('id', editingPerfil.id)

        if (error) throw error

        // Si cambió la contraseña, actualizarla
        if (formData.password) {
          // Nota: Esto requiere privilegios de admin en Supabase
          alert('Para cambiar la contraseña, hazlo desde el panel de Supabase Auth')
        }
      } else {
        // Crear nuevo usuario
        if (!formData.password || formData.password.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres')
          setLoading(false)
          return
        }

        // Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nombre: formData.nombre,
              rol: formData.rol,
            },
            emailRedirectTo: undefined,
          },
        })

        if (authError) throw authError

        if (authData.user) {
          // Actualizar perfil con datos completos
          const { error: perfilError } = await supabase
            .from('perfiles')
            .update({
              apellidos: formData.apellidos,
              telefono: formData.telefono,
              direccion: formData.direccion,
              ciudad: formData.ciudad,
              codigo_postal: formData.codigo_postal,
              fecha_nacimiento: formData.fecha_nacimiento || null,
              grupo_id: formData.grupo_id || null,
              activo: formData.activo,
            })
            .eq('id', authData.user.id)

          if (perfilError) throw perfilError
        }
      }

      setShowModal(false)
      router.refresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (perfil: any) => {
    if (!confirm(`¿Estás seguro de eliminar el usuario "${perfil.nombre} ${perfil.apellidos}"?`)) return

    try {
      // Nota: Eliminar usuario de Auth requiere admin API
      // Por ahora solo desactivamos
      const { error } = await supabase
        .from('perfiles')
        .update({ activo: false })
        .eq('id', perfil.id)

      if (error) throw error

      alert('Usuario desactivado. Para eliminarlo completamente, hazlo desde el panel de Supabase Auth')
      router.refresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Buscar</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
              placeholder="Nombre, apellidos o email..."
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="label">Rol</label>
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value as any)}
            className="input"
          >
            <option value="all">Todos</option>
            <option value="administrador">Administradores</option>
            <option value="usuario">Usuarios</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Grupo</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPerfiles.map((perfil) => (
              <tr key={perfil.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {perfil.rol === 'administrador' ? (
                      <Shield className="w-5 h-5 text-primary-600 mr-2" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {perfil.nombre} {perfil.apellidos}
                      </div>
                      {perfil.telefono && (
                        <div className="text-sm text-gray-500">{perfil.telefono}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{perfil.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    perfil.rol === 'administrador' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {perfil.rol}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {perfil.grupos ? perfil.grupos.nombre : 'Sin grupo'}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    perfil.activo 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {perfil.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(perfil)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(perfil)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingPerfil ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Apellidos</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                  disabled={!!editingPerfil}
                />
              </div>

              {!editingPerfil && (
                <div>
                  <label className="label">Contraseña * (mínimo 6 caracteres)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required={!editingPerfil}
                    minLength={6}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Rol *</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                    className="input"
                    required
                  >
                    <option value="usuario">Usuario</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="label">Grupo</label>
                  <select
                    value={formData.grupo_id}
                    onChange={(e) => setFormData({ ...formData, grupo_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Sin grupo</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Código Postal</label>
                  <input
                    type="text"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">
                  Usuario activo
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : editingPerfil ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}