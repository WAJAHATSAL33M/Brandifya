"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  ShoppingCart,
  Users,
  BookOpen,
  Tags,
  Shapes,
  Award,
  Settings,
  Menu,
  X,
  Search,
  ExternalLink,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Database,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Operations from "./operations";
import OrderWorkspace from "./order-workspace";
import ProductManager from "./product-manager";
import TaxonomyManager from "./taxonomy-manager";
import CustomerManager from "./customer-manager";
import type { Row, AdminApi } from "./workspace-utils";
import "../management.css";
import "./workspace.css";
import "./console.css";
const BlogWorkspace = dynamic(() => import("./blog-editor"), {
  ssr: false,
  loading: () => (
    <div className="console-loading" role="status">
      Opening blog editor…
    </div>
  ),
});
const sections = [
  {
    id: "overview",
    label: "Overview",
    group: "Manage",
    icon: LayoutDashboard,
    description: "Your store, at a glance.",
  },
  {
    id: "orders",
    label: "Orders",
    group: "Manage",
    icon: ShoppingCart,
    description: "Keep every order moving forward.",
  },
  {
    id: "products",
    label: "Products",
    group: "Catalog",
    icon: Package,
    description: "Create, organize and merchandise your catalog.",
  },
  {
    id: "inventory",
    label: "Inventory",
    group: "Catalog",
    icon: Boxes,
    description: "Track stock, costs and replenishment.",
  },
  {
    id: "purchases",
    label: "Purchase orders",
    group: "Catalog",
    icon: Truck,
    description: "Plan and receive supplier deliveries.",
  },
  {
    id: "categories",
    label: "Categories",
    group: "Catalog",
    icon: Shapes,
    description: "Organize your products into clear collections.",
  },
  {
    id: "brands",
    label: "Brands",
    group: "Catalog",
    icon: Award,
    description: "Manage the brands behind your products.",
  },
  {
    id: "tags",
    label: "Tags",
    group: "Catalog",
    icon: Tags,
    description: "Create reusable labels for your catalog.",
  },
  {
    id: "customers",
    label: "Customers",
    group: "People & content",
    icon: Users,
    description: "Find customer accounts and contact details.",
  },
  {
    id: "blogs",
    label: "Blogs",
    group: "People & content",
    icon: BookOpen,
    description: "Write, edit and publish your store’s stories.",
  },
  {
    id: "settings",
    label: "Settings",
    group: "Store",
    icon: Settings,
    description: "Account security and database readiness.",
  },
];
export default function Admin() {
  const [user, setUser] = useState<Row | null>(null),
    [checking, setChecking] = useState(true),
    [setupRequired, setSetupRequired] = useState(false),
    [setupAvailable, setSetupAvailable] = useState(false),
    [view, setView] = useState("overview"),
    [drawer, setDrawer] = useState(false),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [readiness, setReadiness] = useState<Row | null>(null),
    [refresh, setRefresh] = useState(0),
    [search, setSearch] = useState(""),
    [productQuery, setProductQuery] = useState("");
  const dirtyRef = useRef(false),
    menuButton = useRef<HTMLButtonElement>(null),
    drawerRef = useRef<HTMLElement>(null);
  dirtyRef.current = dirty;
  const api: AdminApi = useCallback(async (url, method = "GET", body) => {
    const r = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data;
    try {
      data = await r.json();
    } catch {
      throw Error(
        "The server returned an unexpected response. Check that the latest deployment is running.",
      );
    }
    if (r.status === 401 && url !== "/api/admin/session") {
      setUser(null);
      setDirty(false);
      setReadiness(null);
    }
    if (!r.ok) throw Error(data.error || "This action could not be completed.");
    return data;
  }, []);
  useEffect(() => {
    let active = true;
    api("/api/admin/session")
      .then((d) => {
        if (active) {
          setUser(d.user);
          setSetupRequired(d.setupRequired);
          setSetupAvailable(d.setupAvailable);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    const initial = new URLSearchParams(window.location.search).get("view");
    if (sections.some((s) => s.id === initial)) setView(initial!);
    return () => {
      active = false;
    };
  }, [api]);
  const checkSetup = useCallback(async () => {
    try {
      setReadiness(await api("/api/admin/setup"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);
  useEffect(() => {
    if (user) void checkSetup();
  }, [user, checkSetup]);
  useEffect(() => {
    if (!drawer) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const nodes = Array.from(
            drawerRef.current?.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            ) || [],
          ),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === "Escape") {
        setDrawer(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", key);
    };
  }, [drawer]);
  useEffect(() => {
    const back = () => {
      const next =
        new URLSearchParams(location.search).get("view") || "overview";
      if (sections.some((s) => s.id === next)) {
        if (dirtyRef.current && !confirm("Discard unsaved changes?")) {
          history.replaceState(null, "", "/admin?view=" + view);
          return;
        }
        setDirty(false);
        setView(next);
      }
    };
    window.addEventListener("popstate", back);
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("popstate", back);
      window.removeEventListener("beforeunload", warn);
    };
  }, [view]);
  function navigate(next: string) {
    if (!sections.some((s) => s.id === next)) return;
    if (
      dirtyRef.current &&
      !confirm("Discard unsaved changes? Save first to keep your work.")
    )
      return;
    dirtyRef.current = false;
    setDirty(false);
    if (next === view) setRefresh((r) => r + 1);
    setView(next);
    setDrawer(false);
    setError("");
    setNotice("");
    history.replaceState(null, "", "/admin?view=" + next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (setupRequired && f.password !== f.confirmPassword)
        throw Error("Passwords do not match.");
      const d = await api("/api/admin/session", "POST", {
        ...f,
        action: setupRequired ? "setup" : "login",
      });
      setUser(d.user);
      setSetupRequired(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (dirtyRef.current && !confirm("Sign out and discard unsaved changes?"))
      return;
    setBusy(true);
    try {
      await api("/api/admin/session", "POST", { action: "logout" });
      setUser(null);
      setDirty(false);
      setReadiness(null);
      setNotice("You have signed out.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function finishSetup() {
    setBusy(true);
    setError("");
    try {
      const d = await api("/api/admin/setup", "POST", {});
      setReadiness(d);
      setRefresh((r) => r + 1);
      setNotice(
        d.ready
          ? "Database setup is complete. Your workspace is ready."
          : "Some tables are still unavailable. Check database permissions.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const active = sections.find((s) => s.id === view)!;
  if (checking || !user)
    return (
      <div className="hp management-admin console-auth">
        <div className="console-auth-brand">
          <span className="console-brand-mark">BE</span>
          <span>
            Brand E <small>Store administration</small>
          </span>
        </div>
        <main className="console-auth-card">
          <span className="console-icon-tile">
            <ShieldCheck size={24} />
          </span>
          <h1>
            {checking
              ? "Welcome back"
              : setupRequired
                ? "Create your owner account"
                : "Admin sign in"}
          </h1>
          <p>
            {checking
              ? "Checking your secure session…"
              : setupRequired
                ? "Use your private setup code to create the first owner account."
                : "Your store operations, all in one place."}
          </p>
          {error && (
            <p className="management-alert" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="management-message" role="status">
              {notice}
            </p>
          )}
          {!checking && (
            <form onSubmit={login}>
              <label>
                Username
                <input
                  name="username"
                  required
                  minLength={3}
                  maxLength={64}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={setupRequired ? 12 : undefined}
                  maxLength={128}
                  autoComplete={
                    setupRequired ? "new-password" : "current-password"
                  }
                />
              </label>
              {setupRequired && (
                <>
                  <label>
                    Confirm password
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                  </label>
                  <label>
                    Private setup code
                    <input
                      name="setupCode"
                      type="password"
                      minLength={32}
                      maxLength={256}
                      required
                      autoComplete="off"
                    />
                  </label>
                  {!setupAvailable && (
                    <p className="management-alert">
                      Set ADMIN_SETUP_TOKEN in Hostinger and restart the app to
                      enable setup.
                    </p>
                  )}
                </>
              )}
              <button
                className="console-primary"
                disabled={busy || (setupRequired && !setupAvailable)}
              >
                {busy
                  ? "Please wait…"
                  : setupRequired
                    ? "Create owner account"
                    : "Sign in"}
                <ArrowUpRight size={16} />
              </button>
            </form>
          )}
          <a href="/">← Return to store</a>
          <div className="console-auth-security">
            <ShieldCheck size={13} /> Private access · Encrypted sessions
          </div>
        </main>
      </div>
    );
  const nav = (mobile = false) => (
    <>
      {["Manage", "Catalog", "People & content", "Store"].map((group) => (
        <div className="console-nav-group" key={group}>
          <small>{group}</small>
          {sections
            .filter((s) => s.group === group)
            .map((s) => (
              <button
                type="button"
                key={s.id}
                aria-current={view === s.id ? "page" : undefined}
                onClick={() => navigate(s.id)}
              >
                <s.icon size={18} />
                <span>{s.label}</span>
                {view === s.id && <ChevronRight size={13} />}
              </button>
            ))}
        </div>
      ))}
    </>
  );
  return (
    <div className="hp management-admin admin-workspace-active admin-console">
      <header className="console-masthead">
        <div className="console-top-brand">
          <button
            type="button"
            className="console-menu-trigger"
            ref={menuButton}
            aria-label="Open navigation"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <Menu size={20} />
          </button>
          <span className="console-brand-mark">BE</span>
          <strong>Brand E</strong>
          <span className="console-admin-label">Admin</span>
        </div>
        <form
          className="console-global-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              dirtyRef.current &&
              !confirm("Discard unsaved changes and search products?")
            )
              return;
            setDirty(false);
            dirtyRef.current = false;
            setProductQuery(search);
            navigate("products");
            setRefresh((r) => r + 1);
          }}
        >
          <Search size={16} />
          <input
            aria-label="Search products globally"
            placeholder="Search your products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>↵</kbd>
        </form>
        <div className="console-top-actions">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />
            <span>View store</span>
          </a>
          <button
            aria-label="Open account settings"
            onClick={() => navigate("settings")}
            className="console-avatar"
          >
            {String(user.username).slice(0, 2).toUpperCase()}
          </button>
        </div>
      </header>
      {drawer && (
        <button
          className="console-drawer-scrim"
          aria-label="Close navigation"
          onClick={() => {
            setDrawer(false);
            menuButton.current?.focus();
          }}
        />
      )}
      <aside
        className={"console-sidebar " + (drawer ? "is-open" : "")}
        ref={drawerRef}
        aria-label="Store navigation"
      >
        <div className="console-drawer-heading">
          <strong>Your workspace</strong>
          <button
            aria-label="Close navigation"
            onClick={() => {
              setDrawer(false);
              menuButton.current?.focus();
            }}
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Admin sections">{nav()}</nav>
        <div className="console-sidebar-footer">
          <span className="console-avatar">
            {String(user.username).slice(0, 2).toUpperCase()}
          </span>
          <span>
            <strong>{user.username}</strong>
            <small>{user.role} account</small>
          </span>
          <button onClick={logout} disabled={busy} aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className="console-main">
        <div className="console-page-header">
          <div>
            <div className="console-breadcrumb">
              Workspace <ChevronRight size={11} /> {active.label}
            </div>
            <h1>{active.label}</h1>
            <p>{active.description}</p>
          </div>
          <button
            className={
              "console-connection " + (readiness?.ready ? "ready" : "")
            }
            onClick={() => navigate("settings")}
          >
            {readiness?.ready ? (
              <CheckCircle2 size={14} />
            ) : (
              <Database size={14} />
            )}{" "}
            {readiness
              ? readiness.ready
                ? "Store connected"
                : "Setup needs attention"
              : "Checking setup"}
          </button>
        </div>
        {error && (
          <p className="management-alert" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="management-message" role="status">
            {notice}
          </p>
        )}
        {readiness && !readiness.ready && (
          <section className="console-setup-banner">
            <span className="console-icon-tile">
              <AlertCircle size={20} />
            </span>
            <div>
              <strong>Finish setting up your workspace</strong>
              <p>
                Some database tables are missing. Blogs, catalog and inventory
                stay visible while you complete setup.
              </p>
              <div>
                {readiness.groups.map((g: Row) => (
                  <span key={g.name} className={g.ready ? "is-ready" : ""}>
                    {g.ready ? "✓" : "○"} {g.name}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="console-primary"
              disabled={busy}
              onClick={finishSetup}
            >
              {busy ? "Preparing…" : "Finish database setup"}
            </button>
          </section>
        )}
        <div key={view + "-" + refresh} className="console-module-content">
          {["overview", "inventory", "purchases"].includes(view) && (
            <Operations
              tab={view}
              api={api}
              onRefresh={async () => {}}
              onNavigate={navigate}
            />
          )}
          {view === "products" && (
            <ProductManager
              api={api}
              onDirtyChange={setDirty}
              initialQuery={productQuery}
            />
          )}
          {["categories", "brands", "tags"].includes(view) && (
            <TaxonomyManager
              api={api}
              kind={
                view === "categories"
                  ? "category"
                  : view === "brands"
                    ? "brand"
                    : "tag"
              }
            />
          )}
          {view === "orders" && <OrderWorkspace api={api} />}
          {view === "customers" && <CustomerManager api={api} />}
          {view === "blogs" && (
            <BlogWorkspace api={api} onDirtyChange={setDirty} />
          )}
          {view === "settings" && (
            <div className="console-settings-grid">
              <section className="management-panel">
                <div className="console-card-title">
                  <ShieldCheck size={18} />
                  <h2>Account security</h2>
                </div>
                <p>
                  Signed in as <strong>{user.username}</strong>. Changing your
                  password ends every admin session for this account.
                </p>
                <form
                  className="management-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setError("");
                    const f = Object.fromEntries(new FormData(e.currentTarget));
                    try {
                      if (f.newPassword !== f.confirmPassword)
                        throw Error("Passwords do not match.");
                      await api("/api/admin/session", "POST", {
                        action: "password",
                        currentPassword: f.currentPassword,
                        newPassword: f.newPassword,
                      });
                      setUser(null);
                      setNotice("Password updated. Sign in again.");
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    Current password
                    <input
                      name="currentPassword"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </label>
                  <label>
                    New password
                    <input
                      name="newPassword"
                      type="password"
                      minLength={12}
                      maxLength={128}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                  <label>
                    Confirm new password
                    <input
                      name="confirmPassword"
                      type="password"
                      minLength={12}
                      maxLength={128}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                  <button className="console-primary" disabled={busy}>
                    Update password
                  </button>
                </form>
              </section>
              <section className="management-panel">
                <div className="console-card-title">
                  <Database size={18} />
                  <h2>Workspace setup</h2>
                </div>
                <p>Check that the database supports all dashboard modules.</p>
                {readiness?.groups.map((g: Row) => (
                  <div className="console-setup-row" key={g.name}>
                    <span>{g.name}</span>
                    <span
                      className={"admin-pill " + (g.ready ? "healthy" : "low")}
                    >
                      {g.ready ? "Ready" : "Needs setup"}
                    </span>
                  </div>
                ))}
                <div className="admin-inline-actions">
                  <button onClick={checkSetup}>Check again</button>
                  <button
                    className="console-primary"
                    disabled={busy}
                    onClick={finishSetup}
                  >
                    Finish database setup
                  </button>
                </div>
                <small className="console-version">
                  Admin workspace · 24 October 2026
                </small>
                <button
                  className="console-signout"
                  onClick={logout}
                  disabled={busy}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </section>
            </div>
          )}
        </div>
        <footer className="console-footer">
          Brand E Admin <span>Built for your everyday operations.</span>
        </footer>
      </main>
      <nav className="console-mobile-nav" aria-label="Quick navigation">
        {["overview", "products", "inventory", "orders", "blogs"].map((id) => {
          const s = sections.find((s) => s.id === id)!;
          return (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <s.icon size={19} />
              <span>{s.label === "Overview" ? "Home" : s.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
