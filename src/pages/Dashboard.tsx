import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { formatFirestoreError } from '../lib/firestoreErrors'
import { listInvoices } from '../lib/invoices'
import type { InvoiceDoc } from '../types/invoice'

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(n)
}

function formatWhen(inv: InvoiceDoc) {
  if (!inv.createdAt) return '—'
  const d = inv.createdAt.toDate()
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function Dashboard() {
  const { user } = useAuth()
  const [rows, setRows] = useState<InvoiceDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      setLoading(true)
      setError(null)
      try {
        const list = await listInvoices(user.uid)
        if (!cancelled) setRows(list)
      } catch (e: unknown) {
        if (!cancelled)
          setError(formatFirestoreError('Failed to load invoices', e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Invoices</h1>
          <p className="muted">Your saved invoices.</p>
        </div>
        <Link to="/invoices/new" className="btn primary">
          New invoice
        </Link>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="empty">
          <p>No invoices yet.</p>
          <Link to="/invoices/new" className="btn primary">
            Create your first invoice
          </Link>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Total</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.customerName}</td>
                  <td>{formatMoney(inv.total)}</td>
                  <td className="muted">{formatWhen(inv)}</td>
                  <td className="actions">
                    <Link to={`/invoices/${inv.id}`} className="link">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
