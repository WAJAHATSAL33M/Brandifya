"use client";
import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import type { AdminApi, Row } from "./workspace-utils";
import { date, downloadCsv } from "./workspace-utils";
export default function CustomerManager({ api }: { api: AdminApi }) {
  const [rows, setRows] = useState<Row[]>([]),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api("/api/admin/customers?offset=" + page * 100)
      .then((d) => {
        if (active) setRows(d.customers);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, page]);
  const filtered = rows.filter((c) =>
    `${c.name} ${c.email} ${c.phone} ${c.city}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="admin-module">
      <div className="console-section-tools">
        <label className="console-search">
          <Search size={16} />
          <input
            aria-label="Search customer page"
            placeholder="Search this customer page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          onClick={() =>
            downloadCsv(
              "brande-customers-page-" + (page + 1) + ".csv",
              filtered,
            )
          }
        >
          Export this page
        </button>
      </div>
      {error && (
        <p role="alert" className="management-alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading customers…</p>
      ) : (
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <details>
                      <summary>
                        <strong>{c.name}</strong>
                        <small>{c.email}</small>
                      </summary>
                      <p>
                        {c.address} · {c.city} {c.postal_code} · {c.country}
                      </p>
                    </details>
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.city || "—"}</td>
                  <td>{c.order_count}</td>
                  <td>{date(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="console-empty">
              <Users size={34} />
              <h3>No customer accounts found</h3>
              <p>Guest delivery information is available in Orders.</p>
            </div>
          )}
        </div>
      )}
      <div className="admin-pagination">
        <button
          disabled={loading || page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>Page {page + 1} · Search covers this page</span>
        <button
          disabled={loading || rows.length < 100}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
