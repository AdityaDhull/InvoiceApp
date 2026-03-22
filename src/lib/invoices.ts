import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { InvoiceDoc, InvoicePayload } from '../types/invoice'

export function createInvoice(uid: string, data: InvoicePayload) {
  return addDoc(collection(db, 'invoices'), {
    userId: uid,
    customerName: data.customerName,
    items: data.items,
    subtotal: data.subtotal,
    total: data.total,
    createdAt: serverTimestamp(),
  })
}

function createdAtMillis(inv: InvoiceDoc): number {
  const ts = inv.createdAt
  if (!ts) return 0
  return ts.toMillis()
}

/** Equality-only query — no composite index. Newest first is done in memory. */
export async function listInvoices(uid: string): Promise<InvoiceDoc[]> {
  const q = query(collection(db, 'invoices'), where('userId', '==', uid))
  const snap = await getDocs(q)
  const rows: InvoiceDoc[] = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      userId: data.userId as string,
      customerName: data.customerName as string,
      items: data.items as InvoiceDoc['items'],
      subtotal: data.subtotal as number,
      total: data.total as number,
      createdAt: data.createdAt ?? null,
    }
  })
  return rows.sort((a, b) => createdAtMillis(b) - createdAtMillis(a))
}

export async function getInvoice(
  uid: string,
  invoiceId: string,
): Promise<InvoiceDoc | null> {
  const ref = doc(db, 'invoices', invoiceId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.userId !== uid) return null
  return {
    id: snap.id,
    userId: data.userId as string,
    customerName: data.customerName as string,
    items: data.items as InvoiceDoc['items'],
    subtotal: data.subtotal as number,
    total: data.total as number,
    createdAt: data.createdAt ?? null,
  }
}
