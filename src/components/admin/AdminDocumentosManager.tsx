'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Documento, Grupo } from '@/types/database.types'
import { formatDate, formatBytes } from '@/lib/utils'
import { Plus, Edit, Trash2, Download, FileText, Image as ImageIcon, X, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminDocumentosManagerProps {
  documentos: any[]
  grupos: Grupo[]
  userId: string
}

export default function AdminDocumentosManager({ 
  documentos: initialDocumentos, 
  grupos,
  userId 
}: AdminDocumentosManagerProps) {
  const [documentos, setDocumentos] = useState(initialDocumentos)
  const [showModal, setShowModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)
  const [filterType, setFilterType] = useState<'all' | 'documento' | 'imagen'>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'documento' as 'documento' | 'imagen',
    grupo_id: '',
  })
  const [file, setFile] = useState<File | null>(null)

  const filteredDocumentos = documentos.filter((doc) => {
    const typeMatch = filterType === 'all' || doc.tipo === filterType
    const groupMatch = filterGroup === 'all' || 
      (filterGroup === 'sin-grupo' && !doc.grupo_id) ||
      (doc.grupo_id === filterGroup)
    return typeMatch && groupMatch
  })

  const openCreateModal = () => {
    setEditingDoc(null)
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'documento',
      grupo_id: '',
    })
    setFile(null)
    setShowModal(true)
  }

  const openEditModal = (doc: any) => {
    setEditingDoc(doc)
    setFormData({
      titulo: doc.titulo,
      descripcion: doc.descripcion || '',
      tipo: doc.tipo,
      grupo_id: doc.grupo_id || '',
    })
    setFile(null)
    setShowModal(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Auto-detectar tipo
      if (selectedFile.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, tipo: 'imagen' }))
      } else {
        setFormData(prev => ({ ...prev, tipo: 'documento' }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingDoc) {
        // Editar documento existente
        const updateData: any = {
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          grupo_id: formData.grupo_id || null,
        }

        // Si hay nuevo archivo, subirlo
        if (file) {
          // Eliminar archivo anterior
          await supabase.storage
            .from('documentos-judo')
            .remove([editingDoc.url])

          // Subir nuevo archivo
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('documentos-judo')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          updateData.url = fileName
          updateData.nombre_archivo = file.name
          updateData.tamano = file.size
        }

        const { error } = await supabase
          .from('documentos')
          .update(updateData)
          .eq('id', editingDoc.id)

        if (error) throw error
      } else {
        // Crear nuevo documento
        if (!file) {
          alert('Por favor selecciona un archivo')
          setLoading(false)
          return
        }

        setUploading(true)

        // Subir archivo
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('documentos-judo')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Crear registro en BD
        const { error } = await supabase
          .from('documentos')
          .insert({
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            tipo: formData.tipo,
            url: fileName,
            nombre_archivo: file.name,
            tamano: file.size,
            grupo_id: formData.grupo_id || null,
            subido_por: userId,
          })

        if (error) throw error
      }

      setShowModal(false)
      router.refresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const handleDelete = async (doc: any) => {
    if (!confirm(`¿Estás seguro de eliminar "${doc.titulo}"?`)) return

    try {
      // Eliminar archivo de storage
      await supabase.storage
        .from('documentos-judo')
        .remove([doc.url])

      // Eliminar registro de BD
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', doc.id)

      if (error) throw error

      setDocumentos(documentos.filter(d => d.id !== doc.id))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleDownload = async (doc: any) => {
    const { data } = await supabase.storage
      .from('documentos-judo')
      .download(doc.url)

    if (data) {
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nombre_archivo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">Tipo</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="input"
          >
            <option value="all">Todos</option>
            <option value="documento">Documentos</option>
            <option value="imagen">Imágenes</option>
          </select>
        </div>

        <div>
          <label className="label">Grupo</label>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="input"
          >
            <option value="all">Todos</option>
            <option value="sin-grupo">Sin grupo</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Documento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocumentos.map((doc) => (
          <div key={doc.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center flex-1">
                {doc.tipo === 'imagen' ? (
                  <ImageIcon className="w-8 h-8 text-primary-600" />
                ) : (
                  <FileText className="w-8 h-8 text-primary-600" />
                )}
                <div className="ml-3 flex-1">
                  <h3 className="font-semibold text-gray-900">{doc.titulo}</h3>
                  {doc.grupos && (
                    <span className="text-xs text-gray-500">
                      Grupo: {doc.grupos.nombre}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {doc.descripcion && (
              <p className="text-sm text-gray-600 mb-4">{doc.descripcion}</p>
            )}

            <div className="text-xs text-gray-500 space-y-1 mb-4">
              <p>Archivo: {doc.nombre_archivo}</p>
              {doc.tamano && <p>Tamaño: {formatBytes(doc.tamano)}</p>}
              <p>Subido: {formatDate(doc.created_at)}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(doc)}
                className="flex-1 btn-secondary flex items-center justify-center text-sm py-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </button>
              <button
                onClick={() => handleDownload(doc)}
                className="flex-1 btn-primary flex items-center justify-center text-sm py-1"
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </button>
              <button
                onClick={() => handleDelete(doc)}
                className="btn-danger flex items-center justify-center text-sm py-1 px-3"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingDoc ? 'Editar Documento' : 'Nuevo Documento'}
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
                <label className="label">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
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

              <div>
                <label className="label">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="documento">Documento</option>
                  <option value="imagen">Imagen</option>
                </select>
              </div>

              <div>
                <label className="label">Grupo</label>
                <select
                  value={formData.grupo_id}
                  onChange={(e) => setFormData({ ...formData, grupo_id: e.target.value })}
                  className="input"
                >
                  <option value="">Sin grupo (visible para todos)</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Archivo {!editingDoc && '*'}
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="input"
                  required={!editingDoc}
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-1">
                    {file.name} ({formatBytes(file.size)})
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={loading || uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary disabled:opacity-50"
                  disabled={loading || uploading}
                >
                  {uploading ? 'Subiendo...' : loading ? 'Guardando...' : editingDoc ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}