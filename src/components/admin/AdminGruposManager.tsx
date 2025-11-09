'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Grupo } from '@/types/database.types'
import { Plus, Edit, Trash2, X, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminGruposManagerProps {
  grupos: any[]
}

export default function AdminGruposManager({ grupos: initialGrupos }: AdminGruposManagerProps) {
  const [grupos, setGrupos] = useState(initialGrupos)
  const [showModal, setShowModal] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  })

  const openCreateModal = () => {
    setEditingGrupo(null)
    setFormData({
      nombre: '',
      descripcion: '',
    })
    setShowModal(true)
  }

  const openEditModal = (grupo: any) => {
    setEditingGrupo(grupo)
    setFormData({
      nombre: grupo.nombre,
      descripcion: grupo.descripcion || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingGrupo) {
        const { error } = await supabase
          .from('grupos')
          .update(formData)
          .eq('id', editingGrupo.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('grupos')
          .insert(formData)

        if (error) throw error
      }

      setShowModal(false)
      router.refresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (grupo: any) => {
    const miembrosCount = grupo.perfiles?.[0]?.count || 0
    
    if (miembrosCount > 0) {
      alert(`No se puede eliminar el grupo "${grupo.nombre}" porque tiene ${miembrosCount} miembro(s) asignado(s). Primero reasigna o elimina los miembros.`)
      return
    }

    if (!confirm(`¿Estás seguro de eliminar el grupo "${grupo.nombre}"?`)) return

    try {
      const { error } = await supabase
        .from('grupos')
        .delete()
        .eq('id', grupo.id)

      if (error) throw error

      setGrupos(grupos.filter(g => g.id !== grupo.id))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Grupo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grupos.map((grupo) => (
          <div key={grupo.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{grupo.nombre}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Users className="w-4 h-4 mr-1" />
                  {grupo.perfiles?.[0]?.count || 0} miembro(s)
                </div>
              </div>
            </div>

            {grupo.descripcion && (
              <p className="text-sm text-gray-600 mb-4">{grupo.descripcion}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(grupo)}
                className="flex-1 btn-secondary flex items-center justify-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(grupo)}
                className="btn-danger flex items-center justify-center px-4"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="label">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="input"
                  rows={3}
                />
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
                  {loading ? 'Guardando...' : editingGrupo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}