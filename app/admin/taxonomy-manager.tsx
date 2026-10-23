"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Shapes, Award, Tags, FolderInput } from "lucide-react";
import type { AdminApi, Row } from "./workspace-utils";
export default function TaxonomyManager({
  api,
  kind,
}: {
  api: AdminApi;
  kind: string;
}) {
  const [terms, setTerms] = useState<Row[]>([]),
    [query, setQuery] = useState(""),
    [draft, setDraft] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const label =
      kind === "category" ? "category" : kind === "brand" ? "brand" : "tag",
    plural =
      kind === "category" ? "Categories" : kind === "brand" ? "Brands" : "Tags",
    Icon = kind === "category" ? Shapes : kind === "brand" ? Award : Tags;
  async function load() {
    try {
      setTerms((await api("/api/admin/taxonomy")).terms);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [api]);
  const rows = terms.filter(
    (t) =>
      t.kind === kind &&
      `${t.name} ${t.slug}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function remove(id: number) {
    if (
      !confirm(
        "Delete this unused " +
          label +
          "? Assigned records must be reassigned first.",
      )
    )
      return;
    setBusy(true);
    try {
      await api("/api/admin/taxonomy", "DELETE", { id });
      await load();
      setMessage("Record deleted.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-module">
      <div className="console-section-tools">
        <label className="console-search">
          <Search size={16} />
          <input
            aria-label={"Search " + plural}
            placeholder={"Search " + plural.toLowerCase() + "…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="admin-inline-actions">
          {kind === "category" && (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api("/api/admin/taxonomy", "POST", {
                    action: "importCategories",
                  });
                  await load();
                  setMessage(
                    "Existing product categories are now manageable here.",
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <FolderInput size={15} /> Import existing categories
            </button>
          )}
          <button
            className="console-primary"
            onClick={() =>
              setDraft({
                name: "",
                slug: "",
                description: "",
                image: "",
                active: true,
              })
            }
          >
            <Plus size={16} /> Add {label}
          </button>
        </div>
      </div>
      {error && (
        <p className="management-alert" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="management-message" role="status">
          {message}
        </p>
      )}
      {draft && (
        <section className="management-panel">
          <div className="console-card-title">
            <Icon size={18} />
            <h2>
              {draft.id ? "Edit" : "Add"} {label}
            </h2>
          </div>
          <form
            className="management-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("/api/admin/taxonomy", "POST", { ...draft, kind });
                setDraft(null);
                await load();
                setMessage("Saved successfully.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="console-two-cols">
              <label>
                Name
                <input
                  required
                  maxLength={100}
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value,
                      ...(!draft.id
                        ? {
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, ""),
                          }
                        : {}),
                    })
                  }
                />
              </label>
              <label>
                Slug
                <input
                  required
                  maxLength={140}
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
              </label>
            </div>
            {kind !== "tag" && (
              <>
                <label>
                  Description
                  <textarea
                    rows={3}
                    maxLength={4000}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                </label>
                <label>
                  Image URL
                  <input
                    value={draft.image}
                    onChange={(e) =>
                      setDraft({ ...draft, image: e.target.value })
                    }
                    placeholder="https:// or /path/to/image"
                  />
                </label>
                {draft.image && (
                  <img
                    className="console-taxonomy-preview"
                    src={draft.image}
                    alt="Category or brand preview"
                  />
                )}
                <label className="admin-upload-button">
                  Upload image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      setBusy(true);
                      setError("");
                      try {
                        const f = new FormData();
                        f.set("file", file);
                        const r = await fetch("/api/admin/media", {
                            method: "POST",
                            body: f,
                          }),
                          d = await r.json();
                        if (!r.ok) throw Error(d.error || "Upload failed.");
                        setDraft((p) => (p ? { ...p, image: d.url } : p));
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
              </>
            )}
            <label className="console-checkbox">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.checked })
                }
              />{" "}
              Available for product assignment
            </label>
            <div className="admin-inline-actions">
              <button type="submit" className="console-primary" disabled={busy}>
                Save {label}
              </button>
              <button type="button" onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="management-table-wrap">
        <table className="management-table">
          <thead>
            <tr>
              <th>{plural}</th>
              <th>Products</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="console-taxonomy-name">
                    {t.image ? (
                      <img src={t.image} alt="" />
                    ) : (
                      <span>
                        <Icon size={18} />
                      </span>
                    )}
                    <div>
                      <strong>{t.name}</strong>
                      <small>{t.slug}</small>
                    </div>
                  </div>
                </td>
                <td>{t.product_count}</td>
                <td>
                  <span
                    className={"admin-pill " + (t.active ? "healthy" : "draft")}
                  >
                    {t.active ? "Active" : "Archived"}
                  </span>
                </td>
                <td>
                  <div className="admin-inline-actions">
                    <button onClick={() => setDraft(t)}>Edit</button>
                    <button
                      disabled={busy || Number(t.product_count) > 0}
                      onClick={() => remove(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="console-empty">
            <Icon size={32} />
            <h3>Give your catalog some structure</h3>
            <p>
              Add your first {label}
              {kind === "category"
                ? " or import categories from existing products"
                : ""}
              , then assign it in the product editor.
            </p>
          </div>
        )}
      </div>
      <p className="console-help">
        Archiving hides a record from new assignments. Products and their
        history are retained. Categories can be renamed without editing products
        one by one.
      </p>
    </section>
  );
}
