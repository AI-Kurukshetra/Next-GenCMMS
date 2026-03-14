"use client";

export function CSVExportButton({
  data,
  filename,
  columns,
}: {
  data: Record<string, any>[];
  filename: string;
  columns: string[];
}) {
  const handleExport = () => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    // Build CSV header
    const header = columns.join(",");

    // Build CSV rows
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value = row[col] ?? "";
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(",")
    );

    // Combine header and rows
    const csv = [header, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      📥 Export CSV
    </button>
  );
}
