import type { Timestamp } from 'firebase/firestore'

export type InvoiceItem = {
  name: string
  qty: number
  price: number
}

export type InvoicePayload = {
  customerName: string
  items: InvoiceItem[]
  subtotal: number
  total: number
}

export type InvoiceDoc = InvoicePayload & {
  id: string
  userId: string
  createdAt: Timestamp | null
}
