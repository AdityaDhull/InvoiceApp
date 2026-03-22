import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { lineTotal } from './calc'
import type { InvoiceDoc } from '../types/invoice'

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(n)
}

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

export function downloadInvoicePdf(inv: InvoiceDoc): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Invoice', margin, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Bill to: ${inv.customerName}`, margin, y)
  y += 6

  const created = inv.createdAt
    ? inv.createdAt.toDate().toLocaleString(undefined, {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : '—'
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text(`Date: ${created}`, margin, y)
  doc.setTextColor(0, 0, 0)
  y += 12

  const body = inv.items.map((it) => [
    it.name,
    String(it.qty),
    formatMoney(it.price),
    formatMoney(lineTotal(it)),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Unit price', 'Amount']],
    body,
    theme: 'striped',
    headStyles: { fillColor: [41, 50, 65] },
    styles: { fontSize: 10, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: pageW - margin * 2 - 55 },
      1: { halign: 'right', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  })

  const d = doc as DocWithTable
  let afterTable = d.lastAutoTable?.finalY ?? y + 40
  afterTable += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Subtotal', pageW - margin - 40, afterTable, { align: 'right' })
  doc.text(formatMoney(inv.subtotal), pageW - margin, afterTable, {
    align: 'right',
  })
  afterTable += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Total', pageW - margin - 40, afterTable, { align: 'right' })
  doc.text(formatMoney(inv.total), pageW - margin, afterTable, {
    align: 'right',
  })

  const safeName = inv.customerName
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
  const file = `invoice-${safeName || 'invoice'}-${inv.id.slice(0, 8)}.pdf`
  doc.save(file)
}
