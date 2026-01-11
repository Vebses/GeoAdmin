# GeoAdmin

Medical Assistance Case Management Platform for Georgia.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + Radix UI
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **PDF**: @react-pdf/renderer
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/geoadmin.git
cd geoadmin
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all required variables.

### Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `RESEND_API_KEY` - Resend API key for emails

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, etc.)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── ...               # Feature components
├── lib/                   # Utilities and configs
│   ├── supabase/         # Supabase clients
│   └── utils/            # Helper functions
├── hooks/                 # Custom React hooks
├── stores/               # Zustand stores
├── types/                # TypeScript types
└── config/               # App configuration
```

## Development Phases

- [x] Phase 1: Project Setup
- [ ] Phase 2: Database & Authentication
- [ ] Phase 3: Layout & Navigation
- [ ] Phase 4: Partners & Categories
- [ ] Phase 5: Cases - Core
- [ ] Phase 6: Cases - Advanced
- [ ] Phase 7: Invoices - Core
- [ ] Phase 8: Invoices - PDF & Email
- [ ] Phase 9: Dashboard & Profile
- [ ] Phase 10: Polish & Features

## License

Private - All rights reserved
