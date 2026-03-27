export interface NoticeAttributes {
  id?: string

  title: string
  description: string

  notice_date: Date

  document_url?: string
  class_name?: string

  client_id: string
  created_by: string
  updated_by?: string

  role: 'student' | 'teacher' | 'all'

  is_active?: boolean

  created_at?: Date
  updated_at?: Date
}