# TravelDoc AI

AI-powered doctor finder for travelers and new city residents. Search by city, specialty, and language — get a personalized match in seconds.

## Features

- **Global Search** — Find doctors in any city worldwide using Google Places API
- **AI Recommendations** — Describe your symptoms and Gemini AI ranks the best doctors for your needs
- **Doctor Profiles** — View ratings, reviews, opening hours, and contact info
- **Appointment Booking** — Request appointments directly from the app
- **Auth** — Sign up / sign in with Supabase Auth

## Tech Stack

- [Next.js 15](https://nextjs.org/) — App Router, Server Components
- [Supabase](https://supabase.com/) — PostgreSQL database + Auth
- [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/overview) — Real-time doctor data
- [Google Gemini 1.5 Flash](https://aistudio.google.com/) — AI recommendations
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Vercel](https://vercel.com/) — Deployment

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/kuldeep088-hub/traveldoc.ai.git
cd traveldoc.ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GOOGLE_PLACES_API_KEY` | Google Places API (New) key |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in dev |

### 4. Set up the database

Run the migration in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── doctors/search/     # Google Places search
│   │   ├── doctors/recommend/  # Gemini AI ranking
│   │   └── appointments/       # Appointments CRUD
│   ├── search/                 # Search results page
│   ├── doctor/[id]/            # Doctor profile page
│   ├── recommend/              # AI recommendation wizard
│   ├── appointments/           # User appointments dashboard
│   └── auth/                   # Login & signup
├── components/
│   ├── navbar.tsx
│   ├── search-form.tsx
│   └── doctor-card.tsx
└── lib/
    ├── supabase/               # Supabase client (browser + server)
    └── types.ts                # TypeScript types
```

## Deployment

This app is deployed on Vercel. To deploy your own:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel deployment URL
5. Deploy

## License

MIT
