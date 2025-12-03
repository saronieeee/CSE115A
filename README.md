# Dress to Impress

Dress to Impress is a fullstack Supabase + React experience for managing a digital wardrobe. It lets users catalog every closet item, build outfits, log wear history, and even generate AI outfit visualization from their clothes.

The backend exposes a TypeScript Express API while the frontend provides a React interface for both manual outfit building and AI-assisted styling.

## Highlights

- **Closet management** – Upload items with categories, colors, and photos
- **Outfit tracking** – Combine items into outfits, record wear counts, and review last worn dates
- **AI inspiration** – Send your wardrobe context to the AI tab to get images visualizing the clothes on yourself
- **Profile statistics** - Review your personal style and see lost items
- **Supabase auth** – Email/password flows handled via Supabase with secure token handoff to the Express API

## Tech Stack

- Frontend: React 19 + React Router
- Backend: Node.js/Express with TypeScript and Supabase SDK
- Auth & data: Supabase (auth, storage, database) + optional OpenAI + remove.bg integrations

## Prerequisites

- Node.js **18+** and npm
- Supabase project with:
  - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` for the backend
  - `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` for the frontend
- Optional keys depending on which integrations you enable:
  - `OPENAI_API_KEY` (AI outfit generation & garment descriptions)
  - `REMOVE_BG_API_KEY` (background removal on uploads)

## Repo Structure

```
backend/   # Express API, Supabase + AI helpers
frontend/  # React SPA for wardrobe + AI tooling
```

## Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url>
   cd CSE115A
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure environment variables**

   - Create `backend/.env` with at least:
     ```bash
     PORT=4000
     ORIGIN=http://localhost:3000
     SUPABASE_URL=<your-supabase-url>
     SUPABASE_SERVICE_ROLE=<service-role-key>
     OPENAI_API_KEY=<optional>
     REMOVE_BG_API_KEY=<optional>
     ```
   - Create `frontend/.env` with:
     ```bash
     REACT_APP_API_URL=http://localhost:4000
     REACT_APP_SUPABASE_URL=<your-supabase-url>
     REACT_APP_SUPABASE_ANON_KEY=<anon-key>
     ```

3. **Run the services**

   - **Backend**
     ```bash
     cd backend
     npm run dev
     # or npm run build && npm start for production
     ```
   - **Frontend**
     ```bash
     cd frontend
     npm start          # launches server on :3000
     ```

## Using the App

1. Sign up or sign in via Supabase auth (email/password).
2. Build your closet from the Wardrobe tab by uploading items, tagging them, and assigning categories/colors.
3. Create outfits by mixing closet items, then track wears directly from the Outfits tab.
4. Visit the AI tab to request outfit visualizations (requires OpenAI key configured on the backend).
5. Save AI outfits, view details, and delete or mark real outfits as worn as your closet changes.
