# Architecture - Next.js 14 + Supabase + Vercel

## 1. Architecture Principles
- Use Next.js App Router with Server Components by default.
- Perform writes through Server Actions (or Route Handlers where needed).
- Use Supabase as single backend platform (DB/Auth/Storage/Realtime).
- Enforce tenant isolation and authorization through Supabase RLS.
- Keep UI modular and strongly typed with TypeScript.

## 2. System Topology
- Client: Browser/mobile web UI (responsive Tailwind).
- App: Next.js on Vercel.
- Data/Auth/Files: Supabase.
- Notifications: In-app notification table + email delivery integration.

No custom backend server outside Next.js + Supabase.

## 3. Next.js Application Structure
Recommended structure:
- `app/(marketing)` public pages
- `app/(auth)` login/signup/forgot password
- `app/(dashboard)` authenticated product
- `app/api/*` route handlers for controlled integrations/webhooks
- `components/*` reusable UI components
- `lib/supabase/*` server and client helpers
- `lib/auth/*` role checks and guards
- `lib/domain/*` typed domain services
- `actions/*` server actions for mutations

## 4. Rendering Strategy
- Server Components for dashboards, tables, and detail pages.
- Client Components only for interactive UI (forms, scanner, drag/drop).
- Use Suspense boundaries for large dashboards.
- Cache read-heavy views where safe; bypass cache for role-sensitive data.

## 5. Auth and Authorization
- Supabase Auth for session management.
- User profile table maps `auth.users.id` to organization and role.
- Middleware validates auth and protects dashboard routes.
- Authorization model:
  - App-level role checks in server code.
  - DB-level enforcement with RLS as source of truth.

## 6. Data Access Pattern
- Reads: Server Components call typed query helpers.
- Writes: Server Actions perform validation and call Supabase.
- All mutations run with user context to respect RLS.
- Use transactions for stock updates and status transitions requiring consistency.

## 7. Storage Design
- Supabase Storage buckets:
  - `asset-documents`
  - `work-order-media`
  - `compliance-documents`
- Path convention: `org/{org_id}/{entity}/{entity_id}/{filename}`
- Access:
  - Private buckets with signed URLs for retrieval.
  - RLS policies on storage objects by org and role.

## 8. Notifications
- **In-App Notifications**: Stored in `notifications` table with user-specific visibility. Real-time via Supabase Realtime.
- **Email Notifications**: Triggered on:
  - Work order assignment
  - Preventive maintenance reminders (24h before due)
  - Overdue work orders (daily)
  - Low inventory alerts
  - Compliance inspection due
- **Email Provider**: Configure SendGrid, AWS SES, or Mailgun via environment variables.
- **Delivery Tracking**: Log delivery events and failures in `notification_delivery_logs` for auditing.
- **Templates**: Store HTML email templates in code or Supabase Storage with variable substitution.

## 9. Observability and Ops
- **Logging**: Vercel logs and analytics for request-level visibility. Use structured logging in server actions.
- **Error Tracking**: Integrate Sentry (recommended) or similar for frontend/server exception tracking and alerting.
- **Database Monitoring**: Supabase dashboard for query performance, connection health, and storage usage.
- **Health Checks**: Implement `/health` endpoint for monitoring scheduled jobs and notification pipeline.
- **Metrics**: Track request latency, error rates, and job execution times.
- **Alerts**: Configure alerts for critical errors, high latency, and failed notification delivery.

## 10. Deployment Model
- Environments:
  - `local`
  - `staging`
  - `production`
- Vercel project for frontend/backend runtime.
- Separate Supabase project per environment.
- CI pipeline:
  - Type check
  - Lint
  - Unit/integration tests
  - Migration verification
  - Deploy

## 11. Error Handling and Validation
- **Input Validation**: Validate all user inputs in Server Actions using schema libraries (e.g., Zod, io-ts).
- **Error Response**: Return structured errors with actionable messages to frontend. Log full errors server-side.
- **Graceful Degradation**: Non-critical features (reports, exports) fail safely without breaking core workflows.
- **Retry Logic**: Implement exponential backoff for transient DB and external API failures.
- **User Feedback**: Show toast/modal errors for failed actions; preserve user input for retry.

## 12. Security Baseline
- RLS enabled on all tenant tables with explicit policy enforcement.
- Least-privilege access with role checks at app and DB layers.
- Input validation and sanitization on all Server Actions using type guards.
- Signed URLs and bucket policies for sensitive file access.
- Audit logs for critical operations (status changes, inventory adjustments, role updates).
- CSRF protection via Supabase Auth session tokens.
- Rate limiting on API routes to prevent abuse.
- Environment secrets (API keys, DB credentials) never logged or exposed client-side.
