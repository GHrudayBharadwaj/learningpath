# AI Study Planner & Notes Generation Website

A production-ready full-stack academic web application designed specifically for **Vercel** serverless deployment. It enables students to upload and import Excel/CSV study schedules, track milestones across daily and interactive calendar views, ingest multi-source documents (PDF, DOCX, Web, YouTube transcripts) into a pgvector RAG pipeline, generate structured exam notes (2-mark, 5-mark, 10-mark) and verified coding practice guides, and receive automated email reminders via Vercel Cron and Resend.

---

## Architecture & Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui primitives, Lucide React icons, Recharts.
- **Backend**: Next.js Route Handlers, Server Actions, Vercel Serverless Functions. (No standalone Express or traditional backend process).
- **Database & ORM**: PostgreSQL (Neon / Vercel Postgres compatible), Drizzle ORM, pgvector for semantic retrieval.
- **Authentication**: Auth.js / NextAuth with bcrypt password hashing, secure JWT session cookies, middleware protection, and strict multi-tenant user data isolation.
- **Storage**: Vercel Blob (`@vercel/blob`) with relational metadata in PostgreSQL.
- **AI Engine**: Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`) with dynamic provider selection (OpenAI GPT-4o / Google Gemini).
- **Spreadsheet Importer**: SheetJS (`xlsx`) with heuristic column auto-mapping, data preview, validation, and duplicate detection.
- **Reminders & Cron**: Vercel Cron (`/api/cron/reminders`, `/api/cron/daily-summary`) and Resend email delivery.

---

## Project Structure

```
ai-study-planner/
├── app/
│   ├── page.tsx                      # Landing page & feature showcase
│   ├── (auth)/
│   │   ├── login/page.tsx            # Login with credentials
│   │   └── signup/page.tsx           # Registration form
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar, Navbar, Mobile bottom navigation
│   │   ├── dashboard/page.tsx        # Overview: Today's tasks, streak, study hours
│   │   ├── plans/
│   │   │   ├── page.tsx              # Study plans and task management
│   │   │   └── import/page.tsx       # SheetJS Excel/CSV import wizard
│   │   ├── calendar/page.tsx         # Interactive study calendar
│   │   ├── notes/page.tsx            # Notes repository & AI Exam Generator
│   │   ├── sources/page.tsx          # Multi-source document hub (PDF, Web, YouTube)
│   │   ├── practice/page.tsx         # Coding practice & interview preparation
│   │   ├── progress/page.tsx         # Learning analytics & Recharts dashboard
│   │   └── settings/page.tsx         # Profile, AI provider, and reminder settings
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── auth/signup/route.ts
│       ├── plans/route.ts
│       ├── tasks/route.ts
│       ├── sources/
│       │   ├── route.ts
│       │   ├── web/route.ts
│       │   ├── youtube/route.ts
│       │   └── upload/route.ts
│       ├── notes/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── generate/route.ts
│       ├── progress/route.ts
│       ├── reminders/route.ts
│       ├── search/route.ts
│       ├── user/settings/route.ts
│       └── cron/
│           ├── reminders/route.ts
│           └── daily-summary/route.ts
├── components/
│   ├── ui/                           # Button, Card, Badge, Dialog, Tabs, Input
│   ├── layout/                       # Sidebar, Navbar, MobileNav
│   ├── plans/                        # ExcelImportWizard, TaskModal
│   ├── notes/                        # NoteViewer (Markdown, KaTeX, Export PDF/MD)
│   ├── calendar/                     # StudyCalendar
│   ├── progress/                     # ProgressCharts (Recharts)
│   └── practice/                     # CodingSuite
├── lib/
│   ├── auth/                         # NextAuth config, password hashing, session helpers
│   ├── db/
│   │   ├── index.ts                  # Drizzle ORM client
│   │   ├── schema.ts                 # Relational schema (pgvector ready)
│   │   └── repo.ts                   # Database repository with resilient fallback
│   ├── ai/
│   │   ├── client.ts                 # Vercel AI SDK provider abstraction (OpenAI + Gemini)
│   │   └── prompts.ts                # Structured prompt engineering templates
│   ├── rag/
│   │   └── index.ts                  # Semantic search & chunk similarity ranking
│   ├── excel/
│   │   ├── parser.ts                 # SheetJS file parsing & schema normalization
│   │   └── mapping.ts                # Automatic column alias heuristics
│   ├── documents/
│   │   ├── pdf.ts                    # PDF text extractor
│   │   ├── docx.ts                   # Mammoth DOCX parser
│   │   └── chunker.ts                # Recursive text chunking
│   ├── youtube/
│   │   └── transcript.ts             # YouTube metadata & transcript retriever
│   ├── web/
│   │   └── scraper.ts                # Web page content scraper
│   ├── storage/
│   │   └── blob.ts                   # Vercel Blob client
│   ├── reminders/
│   │   └── email.ts                  # Resend email notification dispatcher
│   └── validation/
│       └── schemas.ts                # Zod validation schemas
├── drizzle.config.ts
├── vercel.json
└── README.md
```

---

## Step-by-Step Vercel Deployment Guide

### Step 1: Create a GitHub Repository
Push your project codebase to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit of AI Study Planner"
git remote add origin https://github.com/your-username/ai-study-planner.git
git branch -M main
git push -u origin main
```

### Step 2: Create the PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech) or create a Vercel Postgres database directly in the Vercel storage tab.
2. Enable `pgvector` extension if needed: `CREATE EXTENSION IF NOT EXISTS vector;`.
3. Copy the pooled connection string (`DATABASE_URL`).

### Step 3: Configure Auth.js
Generate a secure 32-character authentication secret:
```bash
openssl rand -base64 32
```
Set `AUTH_SECRET` in your environment variables.

### Step 4: Configure Vercel Blob
1. In the Vercel Dashboard, navigate to **Storage** -> **Create Database** -> **Blob**.
2. Connect the Blob store to your project to automatically inject `BLOB_READ_WRITE_TOKEN`.

### Step 5: Configure OpenAI & Google Gemini API Keys
1. Obtain an API key from [OpenAI Platform](https://platform.openai.com/api-keys) (`OPENAI_API_KEY`).
2. Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (`GOOGLE_GENERATIVE_AI_API_KEY`).

### Step 6: Configure Resend
1. Sign up at [Resend.com](https://resend.com) and generate an API key (`RESEND_API_KEY`).
2. Verify your domain or use `Study Planner <notifications@resend.dev>`.

### Step 7: Configure Vercel Cron
Set a secure random secret for `CRON_SECRET` to authorize the scheduled endpoints in `vercel.json`.

### Step 8-10: Import Repository into Vercel & Set Environment Variables
In the Vercel Project Settings, add the following variables:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

### Step 11: Run Database Migrations
```bash
npm run db:push
```

### Step 12: Deploy
Trigger deployment on Vercel.

### Step 13: End-to-End Verification
1. Register an account and sign in.
2. Upload `public/sample_study_plan.csv` in the Excel Importer and confirm batch insertion.
3. Test AI Note Generation with 2-mark, 5-mark, and 10-mark formats.
4. Upload a PDF/DOCX and test semantic RAG citation synthesis.
5. Verify calendar drag/edit views, coding practice problem solver, and progress analytics.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application. Demo credentials:
- **Email**: `demo@studyplanner.ai`
- **Password**: `password123`
"# learningpath" 
