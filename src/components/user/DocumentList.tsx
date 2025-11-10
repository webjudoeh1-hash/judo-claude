'use client'

import { useState } from 'react'
import { Documento } from '@/types/database.types'
import { formatDate, formatBytes } from '@/lib/utils'
import { Download, FileText, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DocumentListProps {
  documentos: any[]
}

export default function DocumentList({ documentos }: DocumentListProps) {
  const [filterType, setFilterType] = useState<'all' | 'documento' | 'imagen'>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const supabase = createClient()

  const filteredDocumentos = documentos.filter((doc) => {
    const typeMatch = filterType === 'all' || doc.tipo === filterType
    const groupMatch = filterGroup === 'all' || 
      (filterGroup === 'sin-grupo' && !doc.grupo_id) ||
      (doc.grupo_id === filterGroup)
    return typeMatch && groupMatch
  })

  // Obtener lista única de grupos
  const gruposSet = new Set<string>()
  documentos.forEach((d) => {
    if (d.grupos?.nombre) {
      gruposSet.add(d.grupos.nombre)
    }
  })
  const grupos = Array.from(gruposSet)

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documentos-judo')
        .download(doc.url)

      if (error) throw error

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
    } catch (error) {
      console.error('Error al descargar:', error)
      alert('Error al descargar el archivo')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4">
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
              <option key={grupo} value={grupo}>
                {grupo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredDocumentos.length === 0 ? (
        <div className="text-center py-12 card">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No hay documentos disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocumentos.map((doc) => (
            <div key={doc.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {doc.tipo === 'imagen' ? (
                    <ImageIcon className="w-8 h-8 text-primary-600" />
                  ) : (
                    <FileText className="w-8 h-8 text-primary-600" />
                  )}
                  <div className="ml-3">
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

              <button
                onClick={() => handleDownload(doc)}
                className="w-full btn-primary flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
