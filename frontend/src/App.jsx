import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import RecordTable from "./components/RecordTable";
import RecordFormModal from "./components/RecordFormModal";

const OBJECTS = [
  { value: "Account", label: "Accounts" },
  { value: "Opportunity", label: "Opportunities" },
  { value: "Lead", label: "Leads" },
  { value: "Contact", label: "Contacts" },
  { value: "Case", label: "Cases" },
];

const PAGE_SIZE = 20;

export default function App() {
  const [loggedIn, setLoggedIn] = useState(null); // null = unknown/checking
  const [authError, setAuthError] = useState(null);

  const [objectName, setObjectName] = useState("Account");
  const [describeData, setDescribeData] = useState(null);
  const [records, setRecords] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState(null); // { mode, record } | null

  // Check login status on load, and read query params set by the OAuth redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_error")) setAuthError(params.get("auth_error"));
    if (params.get("login") || params.get("auth_error")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    api.authStatus().then((s) => setLoggedIn(s.loggedIn)).catch(() => setLoggedIn(false));
  }, []);

  const loadObject = useCallback(async (obj) => {
    setLoading(true);
    setError(null);
    try {
      const desc = await api.describe(obj);
      setDescribeData(desc);
      const page = await api.listRecords(obj, 0, PAGE_SIZE);
      setRecords(page.records);
      setHasMore(page.hasMore);
      setOffset(page.records.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) loadObject(objectName);
  }, [loggedIn, objectName, loadObject]);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const page = await api.listRecords(objectName, offset, PAGE_SIZE);
      setRecords((prev) => [...prev, ...page.records]);
      setHasMore(page.hasMore);
      setOffset((prev) => prev + page.records.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(record) {
    if (!window.confirm(`Delete this ${describeData.label}? This can't be undone.`)) return;
    try {
      await api.deleteRecord(objectName, record.Id);
      setRecords((prev) => prev.filter((r) => r.Id !== record.Id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleModalSubmit(payload) {
    if (modal.mode === "create") {
      const created = await api.createRecord(objectName, payload);
      setRecords((prev) => [{ Id: created.id, ...payload }, ...prev]);
    } else if (modal.mode === "edit") {
      await api.updateRecord(objectName, modal.record.Id, payload);
      setRecords((prev) =>
        prev.map((r) => (r.Id === modal.record.Id ? { ...r, ...payload } : r))
      );
    }
    setModal(null);
  }

  async function handleLogout() {
    await api.logout();
    setLoggedIn(false);
    setRecords([]);
    setDescribeData(null);
  }

  if (loggedIn === null) {
    return <div className="app-shell"><div className="landing"><p>Checking session…</p></div></div>;
  }

  if (!loggedIn) {
    return (
      <div className="app-shell">
        <div className="landing">
          <span className="brand-mark">SF · CONSOLE</span>
          <h1>Salesforce Data Console</h1>
          <p>
            Log in with your Salesforce org to browse, create, edit, and delete Account,
            Opportunity, Lead, Contact, and Case records — no native Salesforce UI required.
          </p>
          {authError && <div className="error-banner">Login failed: {authError}</div>}
          <a className="btn btn-primary" href={api.loginUrl()}>Log in with Salesforce</a>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">SF · CONSOLE</span>
          <span className="brand-title">Salesforce Data Console</span>
        </div>
        <div className="status-line">
          <span className="status-dot online" />
          Connected
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div className="console">
        <div className="toolbar">
          <select
            className="object-select"
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
          >
            {OBJECTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="record-count">{records.length} loaded{hasMore ? " · scroll for more" : ""}</span>
          <div className="spacer" />
          <button
            className="btn btn-primary"
            disabled={!describeData}
            onClick={() => setModal({ mode: "create", record: null })}
          >
            + New record
          </button>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}

        {describeData && (
          <RecordTable
            fields={describeData.fields}
            records={records}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onView={(r) => setModal({ mode: "view", record: r })}
            onEdit={(r) => setModal({ mode: "edit", record: r })}
            onDelete={handleDelete}
          />
        )}
      </div>

      {modal && describeData && (
        <RecordFormModal
          objectLabel={describeData.label}
          fields={describeData.fields}
          record={modal.record}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
