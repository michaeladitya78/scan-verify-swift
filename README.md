# Customs Verification — Field Scanner

This repository contains a React + TypeScript web application (Vite) designed as a field officer portal for customs product verification. It provides a mobile-first UI for capturing product images using the device camera, verifying product details (serial number, HSN code) using AI-powered OCR technology, checking authenticity via Google Gemini Pro, and logging audit records to a Firebase backend.

## Architecture & Tech Stack

- **Framework**: Vite + React + TypeScript
- **UI & Styling**: Tailwind CSS + Radix UI (shadcn-ui components) + Lucide Icons
- **Backend Services**: Firebase (Authentication, Firestore Database, Cloud Storage)
- **AI Processing**: Google Gemini API (Content Generation & Verification)
- **OCR Engine**: AI-powered text extraction helper utilities

## Key Files

- `src/main.tsx` — App entry point that mounts React
- `src/App.tsx` — Top-level providers, routing, and page mapping
- `src/pages/` — Page components:
  - `Index.tsx` — Home landing page (routes authenticated users to scanner)
  - `Auth.tsx` — Firebase email/password login and sign up
  - `Scanner.tsx` — Camera scanning UI with viewfinder and verification checks
  - `ManualEntry.tsx` — Manual fallback verification form
  - `History.tsx` — Log viewer with CSV exporting utility
- `src/integrations/firebase/client.ts` — Firebase client configuration and instance creation
- `src/services/ocr.ts` — Text extraction helper utilities

## Local Development

### Prerequisites

- Node.js (version 18 or above recommended)
- npm

### Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   The Firebase config is pre-configured in `src/integrations/firebase/client.ts`. Ensure your Firebase project is set up with:
   - Authentication (Email/Password provider enabled)
   - Firestore (with `products` and `verification_logs` collections)
   - Storage (with a `verification-images` folder/bucket configuration)

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) in your browser.

4. **Product Seeding** (Optional):
   To seed the Firestore database with sample products for testing:
   ```bash
   npm run seed
   ```

## Environment Variables for Vercel / GitHub Actions

This project uses pre-configured Firebase config and Gemini API keys inside client-side modules to allow immediate demonstration. 
For production environments, ensure you secure these keys appropriately by configuring them as client-side environment variables prefixed with `VITE_` if you decide to transition to dynamic loading (e.g., `VITE_FIREBASE_API_KEY`, `VITE_GEMINI_API_KEY`).

- **Vercel**: No special build-time environment variables are strictly required for the current codebase since configuration is embedded, but you can override configurations if you customize the client integration.
- **GitHub Actions**: The repository includes a GitHub Pages deploy workflow under `.github/workflows/deploy.yml`. When deploying, verify that the repository settings permit writing to pages and that the workflow has appropriate permissions.
