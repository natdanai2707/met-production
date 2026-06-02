import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Order = {
  id: string
  customer: string
  account: string | null
  channel: string
  product: string
  size: string | null
  qty: number
  start_date: string | null
  due_date: string | null
  delivery: string | null
  image_url: string | null
  stage: number
  materials: Material[]
  equipment: Equipment[]
  total_price: number
  deposit: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type Material = {
  material: string
  thickness: string
  qty: number
}

export type Equipment = {
  name: string
  unit: string
  qty: number
}

export const STAGES = [
  'รับออร์เดอร์',
  'สั่งวัสดุ',
  'ตัด / เจาะ',
  'ขัดผิว / พับ',
  'Packaging',
  'พร้อมส่ง',
  'ส่งแล้ว',
]

export const CHANNELS = ['Facebook', 'Instagram', 'LINE', 'Shopee', 'Walk-in', 'Referral', 'Other']
export const MAT_OPTIONS = ['5052 Aluminum', '304 Stainless', 'Mild Steel', 'Copper']
export const UNIT_OPTIONS = ['ตัว', 'อัน', 'เส้น', 'ชิ้น', 'ชุด', 'เมตร', 'แผ่น']
