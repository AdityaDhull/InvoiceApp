import type { InvoiceItem } from '../types/invoice'

export function lineTotal(item: InvoiceItem): number {
  return Math.round(item.qty * item.price * 100) / 100
}

export function subtotalFromItems(items: InvoiceItem[]): number {
  const sum = items.reduce((acc, it) => acc + lineTotal(it), 0)
  return Math.round(sum * 100) / 100
}
