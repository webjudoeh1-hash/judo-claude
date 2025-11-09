export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      grupos: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      perfiles: {
        Row: {
          id: string
          nombre: string
          apellidos: string | null
          email: string
          telefono: string | null
          direccion: string | null
          ciudad: string | null
          codigo_postal: string | null
          fecha_nacimiento: string | null
          rol: 'administrador' | 'usuario'
          grupo_id: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nombre: string
          apellidos?: string | null
          email: string
          telefono?: string | null
          direccion?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          fecha_nacimiento?: string | null
          rol?: 'administrador' | 'usuario'
          grupo_id?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          apellidos?: string | null
          email?: string
          telefono?: string | null
          direccion?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          fecha_nacimiento?: string | null
          rol?: 'administrador' | 'usuario'
          grupo_id?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      documentos: {
        Row: {
          id: string
          titulo: string
          descripcion: string | null
          tipo: 'documento' | 'imagen'
          url: string
          nombre_archivo: string
          tamano: number | null
          grupo_id: string | null
          subido_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descripcion?: string | null
          tipo: 'documento' | 'imagen'
          url: string
          nombre_archivo: string
          tamano?: number | null
          grupo_id?: string | null
          subido_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descripcion?: string | null
          tipo?: 'documento' | 'imagen'
          url?: string
          nombre_archivo?: string
          tamano?: number | null
          grupo_id?: string | null
          subido_por?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Grupo = Database['public']['Tables']['grupos']['Row']
export type Perfil = Database['public']['Tables']['perfiles']['Row']
export type Documento = Database['public']['Tables']['documentos']['Row']