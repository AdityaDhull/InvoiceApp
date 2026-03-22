# Invoice management app

React + TypeScript + Vite frontend with **Firebase Authentication** and **Cloud Firestore** for storing invoices. Each account only sees and edits its own documents.

## Overview

- Sign up, sign in, and sign out (email + password)
- Dashboard of saved invoices
- Create invoices with line items; subtotals and totals update as you type
- Open an invoice for a full read-only view
- Download an invoice as a PDF (jsPDF + autotable; PDF code is loaded on demand)

## Tech stack

| Area | Choice |
|------|--------|
| UI | React, TypeScript, Vite |
| Routing | React Router (protected routes for signed-in users) |
| Auth | Firebase Auth |
| Data | Firestore |
| PDF | jsPDF, jspdf-autotable |

## Security

Rules in `firestore.rules` restrict the `invoices` collection so a user can only read and write documents where `userId` matches their Firebase Auth UID. Publish those rules under **Firestore → Rules** in the Firebase console.

## Architecture

```
React UI → Firebase Auth → Firestore (invoices)
```

## Data shape (`invoices` collection)

```json
{
  "userId": "abc123",
  "customerName": "John Doe",
  "items": [
    { "name": "Service", "qty": 2, "price": 100 }
  ],
  "subtotal": 200,
  "total": 200,
  "createdAt": "<Firestore server timestamp>"
}
```

User email and uid live in **Firebase Auth**, not in a separate `users` collection.

## Implementation notes

- Invoice list uses a `userId` equality query; results are sorted by `createdAt` in the app so a composite Firestore index is not required for that list.
- PDF download uses a dynamic `import()` so the PDF libraries are not part of the initial JS bundle.
- Firestore errors are normalized for clearer messages and easier debugging in the browser console.

## Local setup

```bash
git clone <your-repo-url>
cd invoice-app
npm install
cp .env.example .env
```

Fill `.env` with your Firebase web app values from the project settings (all `VITE_FIREBASE_*` variables).

Enable **Email/Password** under Authentication and create a **Firestore** database, then publish `firestore.rules`.

```bash
npm run dev
```

Default dev server: `http://localhost:5173`.

## Production build

```bash
npm run build
```

Deploy the `dist` folder to Firebase Hosting, Netlify, Vercel, or any static host. Configure the same `VITE_*` variables in the host’s environment for production builds.
