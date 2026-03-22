import { FirebaseError } from 'firebase/app'

/**
 * Logs the raw error (so DevTools Console is never empty) and returns UI text.
 */
export function formatFirestoreError(context: string, e: unknown): string {
  console.error(`[invoices] ${context}`, e)

  if (e instanceof FirebaseError) {
    if (e.code === 'permission-denied') {
      return 'Firestore permission denied. Open Firebase Console → Firestore → Rules, paste in the contents of firestore.rules from this project, then click Publish. Until rules allow reads for your userId, the dashboard cannot load.'
    }
    if (e.code === 'failed-precondition') {
      return `${e.message} If you see a URL above, open it once to create the required index.`
    }
    return e.message
  }
  if (e instanceof Error) return e.message
  return 'Request failed. Check the browser console (Console tab) for details.'
}
