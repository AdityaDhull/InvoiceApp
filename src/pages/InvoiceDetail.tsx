import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { formatFirestoreError } from '../lib/firestoreErrors'
import { getInvoice } from '../lib/invoices'
import { lineTotal } from '../lib/calc'
import type { InvoiceDoc } from '../types/invoice'

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(n)
}

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [inv, setInv] = useState<InvoiceDoc | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user) return
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      setLoading(true)
      setInv(null)
      setError(null)
      try {
        const doc = await getInvoice(user.uid, id)
        if (!cancelled) setInv(doc)
      } catch (e: unknown) {
        if (!cancelled)
          setError(formatFirestoreError('Failed to load invoice', e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, id])

  const [pdfBusy, setPdfBusy] = useState(false)

  const handleDownloadPdf = useCallback(async () => {
    if (!inv) return
    setPdfBusy(true)
    try {
      const { downloadInvoicePdf } = await import('../lib/invoicePdf')
      downloadInvoicePdf(inv)
    } finally {
      setPdfBusy(false)
    }
  }, [inv])

  if (!id) {
    return (
      <div className="page">
        <p className="error">Invoice not found.</p>
        <button type="button" className="btn ghost" onClick={() => navigate('/')}>
          Back to dashboard
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (error || !inv) {
    return (
      <div className="page">
        <p className="error">{error ?? 'Invoice not found.'}</p>
        <button type="button" className="btn ghost" onClick={() => navigate('/')}>
          Back to dashboard
        </button>
      </div>
    )
  }

  const created = inv.createdAt
    ? inv.createdAt.toDate().toLocaleString(undefined, {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : '—'

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="muted small">
            <Link to="/">Dashboard</Link>
          </p>
          <h1>{inv.customerName}</h1>
          <p className="muted">Created {created}</p>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => void handleDownloadPdf()}
          disabled={pdfBusy}
        >
          {pdfBusy ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i}>
                <td>{it.name}</td>
                <td>{it.qty}</td>
                <td>{formatMoney(it.price)}</td>
                <td>{formatMoney(lineTotal(it))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="totals detail-totals">
        <div className="totals-row">
          <span>Subtotal</span>
          <strong>{formatMoney(inv.subtotal)}</strong>
        </div>
        <div className="totals-row total">
          <span>Total</span>
          <strong>{formatMoney(inv.total)}</strong>
        </div>
      </div>
    </div>
  )
}
