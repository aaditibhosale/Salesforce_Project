import { useState } from "react";

// mode: "view" | "create" | "edit"
export default function RecordFormModal({ objectLabel, fields, record, mode, onClose, onSubmit }) {
  const isView = mode === "view";
  const [values, setValues] = useState(() => {
    const initial = {};
    fields.forEach((f) => {
      initial[f.name] = record?.[f.name] ?? "";
    });
    return initial;
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setValue = (name, val) => setValues((v) => ({ ...v, [name]: val }));

  const editableFields = fields.filter((f) =>
    mode === "create" ? f.createable : mode === "edit" ? f.updateable : true
  );
  const readonlyFields = mode === "edit" ? fields.filter((f) => !f.updateable) : [];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {};
      editableFields.forEach((f) => {
        let v = values[f.name];
        if (v === "") v = null;
        if (v !== null && (f.type === "double" || f.type === "currency" || f.type === "percent" || f.type === "int")) {
          v = Number(v);
        }
        payload[f.name] = v;
      });
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function renderInput(f, disabled) {
    const val = values[f.name] ?? "";
    if (f.type === "picklist" && f.picklistValues?.length) {
      return (
        <select disabled={disabled} value={val} onChange={(e) => setValue(f.name, e.target.value)}>
          <option value="">-- select --</option>
          {f.picklistValues.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      );
    }
    if (f.type === "textarea") {
      return <textarea disabled={disabled} value={val} onChange={(e) => setValue(f.name, e.target.value)} />;
    }
    if (f.type === "date") {
      return <input type="date" disabled={disabled} value={val} onChange={(e) => setValue(f.name, e.target.value)} />;
    }
    if (["double", "currency", "percent", "int"].includes(f.type)) {
      return <input type="number" disabled={disabled} value={val} onChange={(e) => setValue(f.name, e.target.value)} />;
    }
    return <input type="text" disabled={disabled} value={val} onChange={(e) => setValue(f.name, e.target.value)} />;
  }

  const title = { view: "View", create: "New", edit: "Edit" }[mode] + " " + objectLabel;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}
            {fields.map((f) => {
              const disabled = isView || (mode === "edit" && !f.updateable);
              return (
                <div className={`field-group ${disabled ? "readonly" : ""}`} key={f.name}>
                  <label>{f.label}{!f.nillable && !disabled ? " *" : ""}</label>
                  {renderInput(f, disabled)}
                </div>
              );
            })}
          </div>
          {!isView && (
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : mode === "create" ? "Create record" : "Save changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
