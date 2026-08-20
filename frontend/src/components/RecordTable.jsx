import { useEffect, useRef } from "react";

export default function RecordTable({ fields, records, loading, hasMore, onLoadMore, onView, onEdit, onDelete }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { root: el.closest(".table-wrap"), rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!loading && records.length === 0) {
    return <div className="empty-state">No records found. Create the first one with "New record".</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-grid">
        <thead>
          <tr>
            <th className="col-idx">#</th>
            {fields.map((f) => (
              <th key={f.name}>{f.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.Id}>
              <td className="col-idx">{i + 1}</td>
              {fields.map((f) => (
                <td key={f.name} title={String(r[f.name] ?? "")}>
                  {formatValue(r[f.name])}
                </td>
              ))}
              <td>
                <div className="row-actions">
                  <button onClick={() => onView(r)}>View</button>
                  <button onClick={() => onEdit(r)}>Edit</button>
                  <button className="delete" onClick={() => onDelete(r)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          <tr ref={sentinelRef}>
            <td className="loader-row" colSpan={fields.length + 2}>
              {loading ? "Loading more records..." : hasMore ? "" : records.length > 0 ? "End of results" : ""}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function formatValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
