export type FeatureItem = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  whyItMatters: string;
  requirements: string[];
  staticPreview: {
    kpis: Array<{ label: string; value: string }>;
    columns: string[];
    rows: string[][];
  };
};

export const productFeatures: FeatureItem[] = [
  {
    slug: "asset-management",
    title: "Asset Management & Registry",
    category: "Must-have",
    summary:
      "Comprehensive equipment database with hierarchy, location mapping, specs, serials, and lifecycle status.",
    whyItMatters:
      "A complete asset registry reduces downtime by giving teams one source of truth before failures occur.",
    requirements: [
      "Asset creation, editing, hierarchy, and location assignment",
      "Model, manufacturer, serial, purchase date, warranty expiry",
      "Asset status tracking and maintenance history linkage",
    ],
    staticPreview: {
      kpis: [
        { label: "Total Assets", value: "139" },
        { label: "Active", value: "124" },
        { label: "Under Maintenance", value: "9" },
      ],
      columns: ["Asset", "Location", "Status", "Warranty"],
      rows: [
        ["Press A12", "Plant 1", "Active", "2028-09-30"],
        ["Conveyor C8", "Plant 1", "Under Maintenance", "2027-04-12"],
        ["Boiler B3", "Plant 2", "Active", "2029-01-18"],
      ],
    },
  },
  {
    slug: "work-order-management",
    title: "Work Order Management",
    category: "Must-have",
    summary:
      "Create, assign, prioritize, track, and close maintenance work with technician accountability.",
    whyItMatters:
      "Structured work order flow improves response speed, completion quality, and labor visibility.",
    requirements: [
      "Statuses: Open, Assigned, In Progress, Completed, Cancelled",
      "Priority, assignee, due date, notes, closure details",
      "Time logs and parts usage captured per work order",
    ],
    staticPreview: {
      kpis: [
        { label: "Open", value: "52" },
        { label: "In Progress", value: "18" },
        { label: "Completed", value: "130" },
      ],
      columns: ["WO #", "Title", "Priority", "Status"],
      rows: [
        ["WO-300", "Hydraulic Leak Repair", "Critical", "Assigned"],
        ["WO-301", "Compressor PM", "Medium", "In Progress"],
        ["WO-302", "Conveyor Sensor Check", "High", "Open"],
      ],
    },
  },
  {
    slug: "preventive-maintenance",
    title: "Preventive Maintenance Scheduling",
    category: "Must-have",
    summary:
      "Recurring PM schedules auto-generate work orders to prevent reactive maintenance spikes.",
    whyItMatters:
      "Planning maintenance before failures lowers emergency repairs and extends asset life.",
    requirements: [
      "Calendar-based recurring schedules",
      "Automatic PM work order generation",
      "Due-date tracking and overdue visibility",
    ],
    staticPreview: {
      kpis: [
        { label: "Active PM Rules", value: "41" },
        { label: "Due This Week", value: "11" },
        { label: "Overdue", value: "2" },
      ],
      columns: ["Schedule", "Asset", "Interval", "Next Due"],
      rows: [
        ["Lubrication", "Conveyor C8", "30 days", "2026-03-18"],
        ["Inspection", "Boiler B3", "14 days", "2026-03-16"],
        ["Filter Replace", "Pump P7", "45 days", "2026-03-21"],
      ],
    },
  },
  {
    slug: "inventory-management",
    title: "Inventory Management",
    category: "Must-have",
    summary:
      "Track spare parts, stock levels, reorder thresholds, and consumption from work orders.",
    whyItMatters:
      "Parts visibility avoids downtime caused by stockouts and prevents over-purchasing.",
    requirements: [
      "Parts catalog and quantity on hand",
      "Reorder threshold tracking",
      "Usage linked to work orders",
    ],
    staticPreview: {
      kpis: [
        { label: "Parts", value: "268" },
        { label: "Low Stock", value: "7" },
        { label: "Monthly Usage", value: "413 units" },
      ],
      columns: ["Part", "Stock", "Reorder At", "Status"],
      rows: [
        ["Bearing B220", "6", "10", "Low"],
        ["Hydraulic Seal Kit", "48", "20", "Healthy"],
        ["Drive Chain 12mm", "12", "15", "Low"],
      ],
    },
  },
  {
    slug: "reporting-dashboard",
    title: "Basic Reporting Dashboard",
    category: "Must-have",
    summary:
      "KPI dashboard for uptime, completion rate, open work, and maintenance cost trends.",
    whyItMatters:
      "Leaders need performance visibility to make proactive maintenance and staffing decisions.",
    requirements: [
      "Asset uptime KPI",
      "Work order completion rate",
      "Open work and backlog trends",
    ],
    staticPreview: {
      kpis: [
        { label: "Asset Uptime", value: "96.4%" },
        { label: "Completion Rate", value: "88%" },
        { label: "Open Work", value: "52" },
      ],
      columns: ["Metric", "Current", "Target", "Trend"],
      rows: [
        ["MTTR", "4.2h", "<5h", "Improving"],
        ["PM Compliance", "91%", ">90%", "Stable"],
        ["Reactive Ratio", "23%", "<25%", "Improving"],
      ],
    },
  },
  {
    slug: "user-permissions",
    title: "User Management & Permissions",
    category: "Must-have",
    summary:
      "Role-based access for Admin, Maintenance Manager, and Technician with scoped data access.",
    whyItMatters:
      "Permission boundaries protect data quality and ensure each team sees the right tasks.",
    requirements: [
      "Role-based access control by module",
      "Organization and location scoping",
      "Protected settings and sensitive actions",
    ],
    staticPreview: {
      kpis: [
        { label: "Users", value: "38" },
        { label: "Admins", value: "3" },
        { label: "Technicians", value: "24" },
      ],
      columns: ["Role", "Asset Access", "WO Actions", "Reports"],
      rows: [
        ["Admin", "Full", "Full", "Full"],
        ["Manager", "Scoped", "Create/Assign/Close", "Scoped"],
        ["Technician", "Assigned Assets", "Update Assigned", "View Own"],
      ],
    },
  },
];

export function getFeatureBySlug(slug: string) {
  return productFeatures.find((item) => item.slug === slug);
}
