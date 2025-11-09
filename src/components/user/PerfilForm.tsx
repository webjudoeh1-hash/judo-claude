'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Perfil } from '@/types/database.types'
import { formatDate } from '@/lib/utils'

interface PerfilFormProps {
  perfil: any
}

export default function PerfilForm({ perfil }: PerfilFormProps) {
  const [formData, setFormData] = useState({
    nombre: perfil.nombre || '',
    apellidos: perfil.apellidos || '',
    telefono: perfil.telefono || '',
    direccion: perfil.direccion || '',
    ciudad: perfil.ciudad || '',
    codigo_postal: perfil.codigo_postal || '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('perfiles')
        .update(formData)
        .eq('id', perfil.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Información General</h2>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-600">{perfil.email}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Rol:</span>
            <span className="ml-2 text-gray-600 capitalize">{perfil.rol}</span>
          </div>
          {perfil.grupos && (
            <div>
              <span className="font-medium text-gray-700">Grupo:</span>
              <span className="ml-2 text-gray-600">{perfil.grupos.nombre}</span>
            </div>
          )}
          {perfil.fecha_nacimiento && (
            <div>
              <span className="font-medium text-gray-700">Fecha de nacimiento:</span>
              <span className="ml-2 text-gray-600">{formatDate(perfil.fecha_nacimiento)}</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-xl font-semibold">Datos Personales</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre</label>
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

        {message.text && (
          <div
            className={`px-4 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  )
}