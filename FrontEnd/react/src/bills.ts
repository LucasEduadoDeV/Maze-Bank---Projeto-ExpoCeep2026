export type BillCategory = 'energia' | 'internet' | 'agua' | 'other'
export type BillStatus = 'EM_ABERTO' | 'PAGO' | 'CANCELADO' | 'FATURADO'

export interface Bill {
  id: string
  category: BillCategory
  title: string
  company: string
  description: string
  amount: number
  dueDate: string
  status: BillStatus
  barcode?: string
}
