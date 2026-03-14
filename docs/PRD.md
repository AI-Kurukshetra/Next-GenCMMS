# PRD - Next-Gen CMMS (Manufacturing)

## 1. Product Summary
Next-Gen CMMS is a SaaS platform for manufacturing maintenance teams to manage assets, preventive maintenance, work orders, inventory, and operational visibility across multiple facilities.

Mandatory technology baseline:
- Next.js 14 (App Router) + TypeScript + TailwindCSS
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Vercel deployment

## 2. Business Goals
- Reduce equipment downtime and unplanned failures.
- Improve preventive maintenance compliance.
- Lower maintenance operating cost.
- Increase technician productivity and data quality.

## 3. Primary Users
- Admin: Organization owner and platform administrator.
- Maintenance Manager: Plans and monitors maintenance operations.
- Technician: Executes assigned work orders in mobile-first UI.
- Operations/Plant Manager: Views KPIs and compliance outcomes.

## 4. MVP Scope
In scope for MVP:
- Auth, RBAC, organization + location scoping.
- Asset registry with hierarchy, specifications, and documents.
- Work order full lifecycle with assignees, notes, media, and closure.
- Preventive maintenance recurring schedules and auto-generated work orders.
- Inventory parts catalog, stock, thresholds, and work-order part consumption.
- Core dashboards and in-app/email notifications.
- Mobile-responsive workflows for technicians.

Out of scope for MVP:
- Advanced offline conflict resolution.
- External calendar sync (Google/Outlook).
- AI predictive maintenance and intelligent routing.
- IoT high-volume streaming.
- Public API for third-party ecosystem.

## 5. User Stories and Acceptance Criteria

### US-01 Asset Management
As a maintenance manager, I can create and update assets so maintenance can be tracked per machine.

Acceptance criteria:
- Required fields: `name`, `status`, `location_id`.
- Optional fields include model, serial, manufacturer, purchase and warranty dates.
- Asset can have `parent_asset_id` for hierarchy.
- Asset detail page shows linked documents and maintenance history summary.

### US-02 Work Order Lifecycle
As a technician, I can move assigned work orders through statuses and log completion details.

Acceptance criteria:
- Allowed statuses: `open`, `assigned`, `in_progress`, `completed`, `cancelled`.
- Status transitions are validated server-side.
- Completion requires closure note and time log entry.
- Media uploads are stored in Supabase Storage and linked to work order.

### US-03 Preventive Maintenance
As a manager, I can define recurring PM schedules so routine tasks are generated automatically.

Acceptance criteria:
- Schedule types supported: calendar-based recurring.
- Scheduler creates work order when due window opens.
- Duplicate generation is prevented by schedule + due date uniqueness.
- Reminder notification is generated before due date.

### US-04 Inventory Usage
As a technician, I can record parts consumed in work orders so stock stays accurate.

Acceptance criteria:
- Part consumption reduces stock in a transaction-safe way.
- Prevent negative stock based on organization setting.
- Low-stock notification emitted when threshold crossed.

### US-05 Dashboard Visibility
As a plant manager, I can view KPIs to monitor maintenance performance.

Acceptance criteria:
- Dashboard shows open work orders, completion rate, PM vs reactive, and estimated uptime.
- Filters by location and date range.
- Data is scoped by user role and organization.

## 6. Functional Requirements
- Multi-tenant data model by organization.
- Role-based permissions (Admin, Maintenance Manager, Technician).
- Audit-friendly event logging for critical mutations.
- Search across assets, work orders, and vendors.
- Document uploads for assets and work orders.

## 7. Non-Functional Requirements
- p95 page response <= 1.5s for core list/detail screens.
- 99.5% monthly availability target for production.
- RLS enforced on all tenant tables.
- TLS in transit and encrypted storage by platform defaults.
- Backups and restore drill process documented.

## 8. Success Metrics
- 15-20% reduction in reactive maintenance within 90 days of go-live.
- PM on-time completion >= 90%.
- Work orders with complete closure logs >= 95%.
- MTTR improvement >= 20% against baseline.
- System uptime >= 99.5% monthly.
- Page load p95 latency <= 1.5s.

## 9. MVP vs Phase 2+ Feature Map
### MVP (Phase 1 Delivery)
- Asset management and hierarchy
- Work order lifecycle and assignment
- Preventive maintenance scheduling (calendar-based)
- Basic inventory management
- Dashboard KPIs
- Email and in-app notifications
- Mobile-responsive UI
- Multi-location support
- User roles (Admin, Manager, Technician)

### Phase 2+
- Equipment meters and sensor data tracking
- Purchase orders with vendor management
- Compliance and safety inspection tracking
- IoT real-time sensor integration
- AI predictive maintenance
- Offline mode with sync
- Calendar integration (Google/Outlook)
- Public API for third-party integrations
- Advanced reporting and analytics
- Custom field builders

## 10. Release Definition (MVP)
MVP is ready when:
- All MVP user stories meet acceptance criteria.
- Security checks pass (RLS + auth enforcement).
- Test plan pass rate >= 95% with zero critical defects.
- Performance targets met (p95 <= 1.5s).
- Production deployed on Vercel with Supabase configured.
- Backup/restore procedure tested.
- Runbooks documented for on-call.
