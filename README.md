# King's Pavilion Intimacy Prayer Bootcamp

> **12 Hours Prayer Bootcamp** — Official website and complete Content Management System for King's Pavilion Intimacy Prayer Bootcamp 2026.

---

## Overview

This is the full-stack web application and admin CMS for the **King's Pavilion Intimacy 12 Hours Prayer Bootcamp**. It provides a public-facing bootcamp website and a comprehensive admin dashboard for managing all website content, attendees, volunteers, check-ins, media, and more — without touching source code.

**Tech Stack:**
- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/) (PostgreSQL database + Auth)
- [Tailwind CSS](https://tailwindcss.com/)
- [Resend](https://resend.com/) (transactional email)

---

## Features

### Public Website
- **Homepage** — Hero section, event details, ministers showcase, testimonies, FAQs, volunteer callout
- **Ministers Page** — Full minister profiles with photos and biographies
- **Testimonies** — Public testimony listing with individual detail pages
- **Registration** — Attendee registration with email confirmation
- **Volunteer Application** — Volunteer sign-up form
- **Check-In Kiosk** — QR-code-based event check-in portal

### Admin CMS (`/admin`)
A complete website management system accessible to the Main Administrator:

| Section | Capability |
|---|---|
| **Dashboard Overview** | Live stats: registrations, volunteers, check-ins, testimonies |
| **Homepage Editor** | Edit all homepage sections, headings, paragraphs, buttons and links |
| **About the Bootcamp** | Edit event description, venue, dates and details |
| **Ministers Management** | Add, edit, reorder, publish/unpublish and delete minister profiles |
| **FAQs Management** | Create, edit, publish/unpublish and delete FAQ entries |
| **Announcements** | Scheduled publishing and auto-expiry of announcements |
| **Testimonies Management** | Review, approve, reject, edit and delete testimonies |
| **Media Management** | Full media library: upload, replace, rename, assign and delete assets |
| **Visual Asset Assignment** | Map each website section to a specific media asset |
| **SEO Management** | Edit page titles, meta descriptions, Open Graph data and social images |
| **Analytics** | Registration, attendance and engagement reports |
| **Attendees** | View, search and export attendee records |
| **Volunteers** | Review and manage volunteer applications |
| **Check-In Management** | Manage event check-ins; view kiosk stats |
| **Administration & Accounts** | Manage admin and operator accounts, roles and permissions |
| **Website Settings** | Edit contact information, social media links and global settings |
| **Revision History** | View and restore previous content revisions |
| **Audit Logs** | Complete administrator activity log |
| **Backup & Recovery** | Database and media backup with restore support |
| **Production Diagnostics** | Security, performance, accessibility, email and broken-link checks |
| **Preview** | Full website preview across desktop, tablet and mobile |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com/) project (free tier works)
- A [Resend](https://resend.com/) account for email delivery

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/kings-pavilion.git
cd kings-pavilion
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and provide:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ADMIN_JWT_SECRET` | A strong random secret for admin JWT signing |
| `RESEND_API_KEY` | Resend API key for email delivery |
| `RESEND_FROM_EMAIL` | Verified sender email address |
| `NEXT_PUBLIC_SITE_URL` | The public URL of your deployment |

> **Never commit `.env.local`.** It is listed in `.gitignore`.

### 4. Set Up the Database

Apply the Supabase migrations:

```bash
# Using the Supabase CLI (recommended)
supabase db push

# Or apply migration files manually in the Supabase SQL editor:
# supabase/migrations/
```

The migrations create all required tables, row-level security policies and stored procedures.

### 5. Create the Main Admin Account

```bash
node scripts/provision-main-admin.mjs YOUR_EMAIL YOUR_SECURE_PASSWORD
```

This creates the main administrator account with full CMS access.

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public website.  
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

---

## Project Structure

```
kings-pavilion/
├── src/
│   ├── app/                  # Next.js App Router pages and API routes
│   │   ├── admin/            # Admin dashboard (single-page CMS)
│   │   ├── api/              # API route handlers
│   │   ├── ministers/        # Ministers public page
│   │   ├── register/         # Attendee registration
│   │   ├── testimonies/      # Testimonies listing and detail pages
│   │   └── volunteer/        # Volunteer application
│   ├── components/           # Shared React components
│   ├── data/                 # JSON data stores (content, media registry, assignments)
│   ├── lib/                  # Server utilities (auth, DB, services)
│   └── types/                # TypeScript type definitions
├── public/
│   ├── assets/               # Static website images and media (committed)
│   └── uploads/              # Runtime admin uploads (gitignored; auto-created)
├── supabase/
│   └── migrations/           # Database migration SQL files
├── scripts/                  # Admin provisioning and maintenance scripts
├── tests/                    # Automated test suites
├── .env.example              # Environment variable template
└── README.md
```

---

## Media Uploads

The `public/uploads/` directory is **gitignored** because it stores files uploaded by the admin at runtime. It is **not part of the source code**.

- On a fresh clone, only `public/uploads/.gitkeep` exists (to preserve the directory).
- The server creates this directory automatically when the first file is uploaded.
- The default asset assignments (`src/data/assetAssignments.json`) point to `/assets/` paths that are committed to the repository.

After deploying, the Main Administrator can upload new images and re-assign them through **Admin → Media Management**.

---

## Supabase Migrations

Database migrations are stored in `supabase/migrations/`. Apply them in order using the Supabase CLI:

```bash
supabase db push
```

Each migration file is timestamped and idempotent where possible.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

---

## Security Notes

- `.env.local` and all environment files containing real credentials are gitignored.
- The admin dashboard requires JWT authentication on every request.
- All admin API routes enforce role-based access control.
- Media uploads validate file type and enforce size limits server-side.
- MFA (multi-factor authentication) is available for admin accounts.

---

## Deployment

This project is designed to deploy on [Vercel](https://vercel.com/) (recommended) or any Node.js hosting provider that supports Next.js.

1. Push to GitHub (private repository).
2. Connect the repository to Vercel.
3. Add all environment variables in the Vercel project settings.
4. Deploy.

After deployment, run `node scripts/provision-main-admin.mjs` with your credentials to create the admin account.

---

## License

Private. All rights reserved. King's Pavilion Intimacy Prayer Bootcamp 2026.
