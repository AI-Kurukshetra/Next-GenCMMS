# Roadmap - Product Delivery

## 1. Delivery Phases
**Target Go-Live**: Q2 2026 (June 2026)

### Phase 0 - Foundation (Target: 2026-03-21)
**Duration**: 2 weeks | **Team Size**: 2 engineers
- Next.js 14 project baseline with TypeScript + Tailwind.
- Supabase project setup (auth, db, storage, realtime).
- Environment configuration for local/staging/production.
- CI/CD pipeline (typecheck, lint, unit test) and Vercel deployment.
- Database schema with RLS policies.
- Error tracking integration (Sentry setup).

Exit criteria:
- App deploys to Vercel successfully.
- Auth flow works end-to-end with role-based redirects.
- Database migrations run cleanly on all environments.

### Phase 1 - MVP Core (Target: 2026-05-02)
**Duration**: 6 weeks | **Team Size**: 3 engineers
- Multi-tenant org/location model with RLS enforcement.
- Asset management module (CRUD, hierarchy, documents).
- Work order lifecycle (status transitions, assignments, closure).
- Preventive scheduling (calendar recurring rules + auto work order generation).
- Inventory management basics (parts catalog, stock, thresholds).
- Notifications (in-app + email delivery).
- Dashboard KPIs v1 (open WOs, completion rate, uptime, costs).
- Global search (assets, work orders, vendors).
- Mobile-responsive technician interface.

Exit criteria:
- All MVP user stories from PRD meet acceptance criteria.
- Security tests pass (RLS, auth enforcement).
- UAT sign-off from product owner.
- Test coverage >= 85% on critical paths.

### Phase 2 - Operational Hardening (Target: 2026-05-23)
**Duration**: 3 weeks | **Team Size**: 2 engineers
- Performance optimization (p95 latency targets, query tuning).
- Audit logging implementation for compliance.
- Equipment meters and sensor data ingestion.
- Backup/restore drill procedures and runbooks.
- Expanded reporting (export to CSV/PDF).
- Production monitoring and alerting setup.
- Incident response documentation.

Exit criteria:
- All non-functional requirements met.
- Load testing validates p95 <= 1.5s targets.
- Production readiness review approved.
- Backup/restore tested successfully.

### Phase 3 - Advanced Capabilities (Target: 2026-06-30 and Beyond)
**Duration**: Ongoing | **Team Size**: 1-2 engineers
- Offline mode improvements.
- Calendar integrations.
- Public API.
- AI/IoT features.

## 2. Milestones
- **M1** (2026-03-14): Architecture + schema + baseline setup complete.
- **M2** (2026-03-28): Auth, RBAC, and multi-tenant model ready.
- **M3** (2026-04-11): Asset + work order + PM modules feature-complete.
- **M4** (2026-04-25): Inventory, notifications, dashboard complete.
- **M5** (2026-05-09): UAT phase, bug fixes, optimization.
- **M6** (2026-05-16): Security and performance sign-off.
- **M7** (2026-05-30): Production go-live on Vercel.

## 3. Dependencies
- Product decisions on MVP boundaries and role permissions.
- Supabase production project and credentials.
- Email provider configuration for notifications.
- Stakeholder availability for UAT windows.

## 4. Risks and Mitigations
- Risk: Scope expansion before MVP freeze.
  - Mitigation: strict change control and phase gating.
- Risk: RLS misconfiguration.
  - Mitigation: policy test suite and staged penetration checks.
- Risk: performance degradation with large asset/work-order volumes.
  - Mitigation: indexed queries, pagination, and profiling before launch.

## 5. Go-Live Checklist
- All high/critical defects closed.
- Migration scripts validated on staging.
- Monitoring and alerting configured.
- Backup and restore tested.
- Runbooks and on-call ownership assigned.
