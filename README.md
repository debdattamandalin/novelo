# Novelo

A clean, modern web novel catalog, reader, and publishing platform built with Next.js 15, React 19, and Supabase.

![Novelo Screenshot](https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1200)

## Features

- **Public Novel Directory**: Minimalist catalog with real-time keyword search, author lookup, volume badges, verified translation badges, and responsive multi-column layouts.
- **In-Page Chapter Reader**: Clean reading experience with custom font options, dark/light tones, volume chapters dropdown, previous/next buttons, and auto-transition to the **Next Volume**.
- **Per-Volume Scoped Numbering**: Chapters cleanly restart numbering from Chapter 1 within every volume.
- **Reading Progress Sync**: Live tracking and syncing of user reading progress directly to Supabase (`reading_progress` table) with offline fallback.
- **Admin Management Portal**:
  - Direct URL: `/admin`
  - Folder-based hierarchy: **Novel Folder** -> **Volume Folders** -> **Chapters**.
  - Database-first creation: publish new novels, add volumes, and write chapters with live word count calculation.
  - Live side-by-side chapter preview and editing.
  - Cascading deletion across novels, volumes, and chapters.
- **Database-First Architecture**: Connected to PostgreSQL via Supabase with tables for `novels`, `volumes`, `chapters`, and `reading_progress`.
- **Responsive Design**: Fluidly adapts across ultra-wide monitors, standard desktops, laptops, tablets, and smartphones.

## Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Database**: [Supabase / PostgreSQL](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: Plus Jakarta Sans, JetBrains Mono, Roboto

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/debdattamandalin/novelo.git
cd novelo
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. Database Schema
Execute the schema in Supabase SQL editor:
```sql
CREATE TABLE IF NOT EXISTS public.novels (
  id TEXT PRIMARY KEY,
  badge TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  rating NUMERIC DEFAULT 4.5,
  review_count TEXT DEFAULT '0',
  volumes INTEGER DEFAULT 1,
  total_chapters INTEGER DEFAULT 0,
  format_badge TEXT,
  aspect_subtitle TEXT,
  status TEXT DEFAULT 'Ongoing',
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  editions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.volumes (
  id TEXT PRIMARY KEY,
  novel_id TEXT REFERENCES public.novels(id) ON DELETE CASCADE,
  volume_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  chapter_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chapters (
  id TEXT PRIMARY KEY,
  novel_id TEXT REFERENCES public.novels(id) ON DELETE CASCADE,
  volume_id TEXT REFERENCES public.volumes(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  release_date TEXT,
  word_count TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id TEXT REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id TEXT,
  chapter_number INTEGER NOT NULL,
  chapter_title TEXT,
  volume_number INTEGER NOT NULL DEFAULT 1,
  user_identifier TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_novel_user UNIQUE (novel_id, user_identifier)
);
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or port configured) to view the application.

## Admin Access
Visit `/admin` on your local instance to manage novels and publish chapters.

## License
MIT
