# Setup Guide for BacancyAssetOps

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

## Environment Configuration

### 1. Create `.env.local` file

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 2. Get Supabase Credentials

1. **NEXT_PUBLIC_SUPABASE_URL**: Go to Supabase dashboard → Settings → API → Project URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Go to Supabase dashboard → Settings → API → Anon public key
3. **SUPABASE_SERVICE_ROLE_KEY**: Go to Supabase dashboard → Settings → API → Service Role key

⚠️ **IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` is sensitive and should **NEVER** be committed to git. It's only used on the server side and allows unrestricted database access. Add `.env.local` to your `.gitignore` (already done).

### 3. Fill in `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Setup

### 1. Apply Migrations

Run all migrations in Supabase SQL editor in order:

1. `supabase/migrations/202603141020_init.sql` (Core schema)
2. `supabase/migrations/202603141030_extend.sql` (Extended tables and columns)
3. `supabase/migrations/202603141145_fix_rls_recursion.sql` (RLS fixes)

Copy each file's contents and execute in Supabase dashboard → SQL Editor.

### 2. Verify RLS is Enabled

All tables should have Row-Level Security (RLS) enabled. This is crucial for multi-tenant data isolation.

## Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Test the Flow

1. Go to `/signup` - Create a new account
2. Enter company information (this will be your organization)
3. Complete onboarding by entering org name and first location
4. You'll be redirected to the dashboard
5. Explore the dashboard features

## Why the Service Role Key is Needed

During the onboarding flow:
- A new user creates an account (stored in Supabase Auth)
- They then need to create an organization
- The organization must be created before the user profile is linked to it
- This creates a circular dependency with RLS policies

The service role key allows the server to create the organization without RLS restrictions during this initial setup. After the organization and profile are created, all subsequent operations use the regular authenticated client, which respects RLS policies.

## Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY environment variables"

Make sure you've added all three environment variables to `.env.local` and restarted the development server.

### "row violates row-level security policy"

This usually indicates:
1. The service role key is not set or invalid
2. The migrations weren't applied in the correct order
3. RLS policies are too restrictive

Check the browser console and server logs for the exact error message.

### Database Migrations Fail

- Make sure you're logged into Supabase as a project admin
- Run migrations in the correct order (init → extend → fix_rls_recursion)
- Check for any SQL syntax errors in the console

## Project Structure

```
.
├── app/                      # Next.js 14 App Router
│   ├── page.tsx             # Landing page
│   ├── login/               # Login flow
│   ├── signup/              # Registration flow
│   ├── onboarding/          # Workspace setup
│   └── dashboard/           # Main application
├── components/              # Reusable components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── auth.ts             # Auth utilities
│   └── utils.ts            # Helper functions
├── supabase/migrations/     # Database migrations
└── public/                  # Static assets
```

## Next Steps

1. ✅ Setup complete - You can now log in
2. Create assets and locations for your organization
3. Create work orders and assign to team members
4. Set up preventive maintenance schedules
5. Invite team members with different roles

## Support

For issues or questions:
1. Check the logs: `npm run dev` (watch for errors)
2. Review the database schema in Supabase SQL Editor
3. Verify all migrations were applied correctly
