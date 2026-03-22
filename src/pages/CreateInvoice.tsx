import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { createInvoice } from '../lib/invoices'
import { lineTotal, subtotalFromItems } from '../lib/calc'
import type { InvoiceItem } from '../types/invoice'

export function CreateInvoice() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { name: '', qty: 1, price: 0 },
  ])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const subtotal = useMemo(() => subtotalFromItems(items), [items])
  const total = subtotal

  function updateItem(idx: number, patch: Partial<InvoiceItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    )
  }

  function addRow() {
    setItems((prev) => [...prev, { name: '', qty: 1, price: 0 }])
  }

  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)

    const trimmed = items
      .map((it) => ({
        name: it.name.trim(),
        qty: Number(it.qty),
        price: Number(it.price),
      }))
      .filter((it) => it.name.length > 0 && it.qty > 0 && it.price >= 0)

    if (!customerName.trim()) {
      setError('Enter a customer name.')
      return
    }
    if (trimmed.length === 0) {
      setError('Add at least one line item with a name, quantity, and price.')
      return
    }

    const st = subtotalFromItems(trimmed)
    setSaving(true)
    try {
      await createInvoice(user.uid, {
        customerName: customerName.trim(),
        items: trimmed,
        subtotal: st,
        total: st,
      })
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save invoice.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <h1>New invoice</h1>
      <p className="muted">Customer and line items.</p>

      <form onSubmit={onSubmit} className="invoice-form stack">
        <label className="field">
          <span>Customer name</span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Acme Co."
            required
          />
        </label>

        <div className="line-items">
          <div className="line-items-head">
            <span>Items</span>
            <button type="button" className="btn ghost small" onClick={addRow}>
              Add line
            </button>
          </div>

          <div className="line-list">
            {items.map((it, idx) => (
              <div key={idx} className="line-card">
                <div className="line-card-fields">
                  <label className="field tight">
                    <span>Description</span>
                    <input
                      value={it.name}
                      onChange={(e) =>
                        updateItem(idx, { name: e.target.value })
                      }
                      placeholder="Service or product"
                    />
                  </label>
                  <div className="line-card-row">
                    <label className="field tight">
                      <span>Qty</span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={it.qty}
                        onChange={(e) =>
                          updateItem(idx, { qty: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label className="field tight">
                      <span>Price</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.price}
                        onChange={(e) =>
                          updateItem(idx, { price: Number(e.target.value) })
                        }
                      />
                    </label>
                    <div className="field tight line-sum-wrap">
                      <span>Line</span>
                      <span className="line-sum">
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: 'USD',
                        }).format(lineTotal(it))}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn ghost small line-remove"
                  onClick={() => removeRow(idx)}
                  disabled={items.length <= 1}
                  aria-label="Remove line"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="totals">
          <div className="totals-row">
            <span>Subtotal</span>
            <strong>
              {new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD',
              }).format(subtotal)}
            </strong>
          </div>
          <div className="totals-row total">
            <span>Total</span>
            <strong>
              {new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD',
              }).format(total)}
            </strong>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
