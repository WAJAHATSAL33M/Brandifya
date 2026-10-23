"use client";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { Node, mergeAttributes } from "@tiptap/core";
import type { AdminApi, Row } from "./workspace-utils";
import { date } from "./workspace-utils";
const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  addAttributes() {
    return { src: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: true })];
  },
});
const blank = () => ({
  id: "",
  version: 0,
  title: "",
  slug: "",
  excerpt: "",
  content: "<p></p>",
  coverUrl: "",
  coverAlt: "",
  category: "Journal",
  tags: "",
  author: "Brand E editorial team",
  status: "draft",
  publishAt: "",
  seoTitle: "",
  seoDescription: "",
});
const fromRow = (p: Row) => ({
  ...blank(),
  ...p,
  coverUrl: p.cover_url || "",
  coverAlt: p.cover_alt || "",
  publishAt: p.publish_at
    ? new Date(
        new Date(p.publish_at).getTime() -
          new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "",
  seoTitle: p.seo_title || "",
  seoDescription: p.seo_description || "",
});
export default function BlogWorkspace({
  api,
  onDirtyChange,
}: {
  api: AdminApi;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [posts, setPosts] = useState<Row[]>([]),
    [post, setPost] = useState<Row | null>(null),
    [revisions, setRevisions] = useState<Row[]>([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [preview, setPreview] = useState<string | null>(null),
    [source, setSource] = useState(false),
    [dirty, setDirty] = useState(false),
    [library, setLibrary] = useState<Row[] | null>(null),
    [libraryPage, setLibraryPage] = useState(0),
    [libraryCover, setLibraryCover] = useState(false);
  const current = useRef(post),
    saving = useRef(false),
    dirtyRef = useRef(false);
  current.current = post;
  dirtyRef.current = dirty;
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      Image,
      Video,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your story…" }),
      TableKit,
    ],
    immediatelyRender: false,
    content: "",
    onUpdate: ({ editor }) => {
      setPost((p) => (p ? { ...p, content: editor.getHTML() } : p));
      setDirty(true);
    },
    editorProps: {
      attributes: {
        "aria-label": "Article content",
        class: "journal-editor-content",
      },
    },
  });
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  async function list() {
    try {
      setPosts((await api("/api/admin/blogs")).posts);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void list();
  }, []);
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, []);
  function update(key: string, value: unknown) {
    setPost((p) => (p ? { ...p, [key]: value } : p));
    setDirty(true);
    setMessage("Unsaved changes");
  }
  async function open(p?: Row) {
    if (saving.current) return;
    if (dirty && !confirm("Discard unsaved article changes?")) return;
    setError("");
    setMessage("");
    setPreview(null);
    setSource(false);
    try {
      let next = blank();
      if (p) {
        const data = await api("/api/admin/blogs?id=" + p.id);
        next = fromRow(data.post);
        setRevisions(data.revisions);
      } else setRevisions([]);
      setPost(next);
      editor?.commands.setContent(next.content, { emitUpdate: false });
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function save(status?: string, automatic = false) {
    const p = current.current;
    if (!p || saving.current) return;
    if (automatic && (!p.title || !p.slug || p.status !== "draft")) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...p,
        status: status || p.status,
        publishAt: p.publishAt ? new Date(p.publishAt).toISOString() : null,
      };
      const r = await api("/api/admin/blogs", "POST", payload);
      setPost((now) => {
        if (!now) return now;
        return { ...now, id: r.id, version: r.version, status: payload.status };
      });
      // Do not mark edits typed during the request as saved.
      if (current.current === p) {
        setDirty(false);
        setMessage(automatic ? "Draft autosaved" : "Article saved");
      } else setMessage("Saved earlier changes; new edits remain unsaved");
      await list();
      const d = await api("/api/admin/blogs?id=" + r.id);
      setRevisions(d.revisions);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const id = setInterval(() => {
      if (dirtyRef.current) void saveRef.current(undefined, true);
    }, 30000);
    return () => clearInterval(id);
  }, []);
  async function showLibrary(cover = false, page = 0) {
    setError("");
    try {
      const d = await api("/api/admin/media?offset=" + page * 48);
      setLibrary(d.media);
      setLibraryPage(page);
      setLibraryCover(cover);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function upload(file: File, cover = false) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch("/api/admin/media", { method: "POST", body: form }),
        data = await r.json();
      if (!r.ok) throw Error(data.error || "Upload failed.");
      if (cover) {
        if (!file.type.startsWith("image/"))
          throw Error("Use an image for the cover.");
        update("coverUrl", data.url);
      } else if (file.type.startsWith("video/"))
        editor
          ?.chain()
          .focus()
          .insertContent({ type: "video", attrs: { src: data.url } })
          .run();
      else
        editor
          ?.chain()
          .focus()
          .setImage({ src: data.url, alt: file.name.replace(/\.[^.]+$/, "") })
          .run();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const tools = (label: string, run: () => void, active = false) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={run}
    >
      {label}
    </button>
  );
  return (
    <section className="admin-module">
      <div className="management-heading">
        <div>
          <h2>Journal</h2>
          <p>Write, refine and publish your store’s stories.</p>
        </div>
        <div className="admin-inline-actions">
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api("/api/admin/blogs", "POST", { action: "import" });
                await list();
                setMessage("Existing journal articles imported.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Import existing articles
          </button>
          <button className="commerce-primary" onClick={() => open()}>
            New article
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
      {!post ? (
        <>
          <div className="admin-filter-row">
            <label>
              Search articles
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, category or author"
              />
            </label>
            <label>
              Status
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["all", "draft", "published", "scheduled", "trash"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {posts
                  .filter(
                    (p) =>
                      (filter === "all"
                        ? p.status !== "trash"
                        : p.status === filter) &&
                      `${p.title} ${p.category} ${p.author}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  )
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.title}</strong>
                        <small>
                          /blog/{p.slug} · {p.author}
                        </small>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <span className={"admin-pill " + p.status}>
                          {p.status === "scheduled" &&
                          new Date(p.publish_at).getTime() <= Date.now()
                            ? "published"
                            : p.status}
                        </span>
                      </td>
                      <td>{date(p.updated_at)}</td>
                      <td>
                        <button onClick={() => open(p)}>Edit article</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!posts.length && (
              <div className="admin-empty">
                <h3>Your journal starts here</h3>
                <p>
                  Create an article or import the stories already on your store.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="admin-editor-actions">
            <button
              onClick={() => {
                if (!dirty || confirm("Discard unsaved article changes?")) {
                  setPost(null);
                  setDirty(false);
                }
              }}
            >
              ← All articles
            </button>
            <span>
              {dirty ? "Unsaved changes" : "All changes saved"} ·{" "}
              {
                post.content
                  .replace(/<[^>]+>/g, " ")
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length
              }{" "}
              words
            </span>
            <button disabled={busy} onClick={() => save("draft")}>
              Save draft
            </button>
            <button
              disabled={busy}
              onClick={async () => {
                try {
                  const r = await api("/api/admin/blogs", "POST", {
                    ...post,
                    action: "preview",
                    publishAt: post.publishAt
                      ? new Date(post.publishAt).toISOString()
                      : null,
                  });
                  setPreview(r.content);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Preview
            </button>
            <button
              className="commerce-primary"
              disabled={busy}
              onClick={() =>
                save(post.status === "scheduled" ? "scheduled" : "published")
              }
            >
              {busy
                ? "Saving…"
                : post.status === "scheduled"
                  ? "Schedule"
                  : "Publish"}
            </button>
          </div>
          {library && (
            <section className="management-panel" aria-label="Media library">
              <div className="management-heading">
                <h3>Media library</h3>
                <button onClick={() => setLibrary(null)}>Close library</button>
              </div>
              <div className="admin-media-grid">
                {library
                  .filter(
                    (m) => !libraryCover || m.mime_type.startsWith("image/"),
                  )
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (libraryCover) update("coverUrl", m.url);
                        else if (m.mime_type.startsWith("video/"))
                          editor
                            ?.chain()
                            .focus()
                            .insertContent({
                              type: "video",
                              attrs: { src: m.url },
                            })
                            .run();
                        else
                          editor
                            ?.chain()
                            .focus()
                            .setImage({ src: m.url, alt: "" })
                            .run();
                        setLibrary(null);
                      }}
                    >
                      {m.mime_type.startsWith("image/") ? (
                        <img src={m.url} alt="Uploaded media" />
                      ) : (
                        <span>Video</span>
                      )}
                      <small>
                        {m.mime_type} · {Math.round(m.size / 1024)} KB
                      </small>
                    </button>
                  ))}
              </div>
              <div className="admin-pagination">
                <button
                  disabled={libraryPage === 0}
                  onClick={() => showLibrary(libraryCover, libraryPage - 1)}
                >
                  Previous media
                </button>
                <button
                  disabled={library.length < 48}
                  onClick={() => showLibrary(libraryCover, libraryPage + 1)}
                >
                  Next media
                </button>
              </div>
            </section>
          )}
          <div className="admin-editor-layout">
            <div className="management-panel admin-writing">
              <label>
                Article title
                <input
                  className="admin-title-input"
                  value={post.title}
                  maxLength={240}
                  onChange={(e) => {
                    update("title", e.target.value);
                    if (!post.id)
                      update(
                        "slug",
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      );
                  }}
                  placeholder="Give your story a title"
                />
              </label>
              <div
                className="admin-editor-toolbar"
                role="toolbar"
                aria-label="Text formatting"
              >
                <select
                  aria-label="Paragraph style"
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (n)
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({ level: n as 2 | 3 | 4 })
                        .run();
                    else editor?.chain().focus().setParagraph().run();
                  }}
                >
                  <option value="0">Paragraph</option>
                  <option value="2">Heading 2</option>
                  <option value="3">Heading 3</option>
                  <option value="4">Heading 4</option>
                </select>
                {tools(
                  "Bold",
                  () => {
                    editor?.chain().focus().toggleBold().run();
                  },
                  editor?.isActive("bold"),
                )}
                {tools(
                  "Italic",
                  () => {
                    editor?.chain().focus().toggleItalic().run();
                  },
                  editor?.isActive("italic"),
                )}
                {tools(
                  "Underline",
                  () => {
                    editor?.chain().focus().toggleUnderline().run();
                  },
                  editor?.isActive("underline"),
                )}
                {tools("Strike", () => {
                  editor?.chain().focus().toggleStrike().run();
                })}
                {tools("Bullets", () => {
                  editor?.chain().focus().toggleBulletList().run();
                })}
                {tools("Numbered list", () => {
                  editor?.chain().focus().toggleOrderedList().run();
                })}
                {tools("Quote", () => {
                  editor?.chain().focus().toggleBlockquote().run();
                })}
                {tools("Link", () => {
                  const href = prompt("Link URL (https://, mailto: or tel:)");
                  if (href && /^(https:\/\/|mailto:|tel:)/.test(href))
                    editor?.chain().focus().setLink({ href }).run();
                })}
                {tools("Remove link", () => {
                  editor?.chain().focus().unsetLink().run();
                })}
                {["left", "center", "right"].map((a) =>
                  tools(a, () => {
                    editor?.chain().focus().setTextAlign(a).run();
                  }),
                )}
                {tools("Table", () => {
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run();
                })}
                {editor?.isActive("table") && (
                  <>
                    {tools("Add row", () => {
                      editor?.chain().focus().addRowAfter().run();
                    })}
                    {tools("Add column", () => {
                      editor?.chain().focus().addColumnAfter().run();
                    })}
                    {tools("Delete table", () => {
                      editor?.chain().focus().deleteTable().run();
                    })}
                  </>
                )}
                {tools("Divider", () => {
                  editor?.chain().focus().setHorizontalRule().run();
                })}
                {tools("Undo", () => {
                  editor?.chain().focus().undo().run();
                })}
                {tools("Redo", () => {
                  editor?.chain().focus().redo().run();
                })}
                <button type="button" onClick={() => showLibrary()}>
                  Media library
                </button>
                <label className="admin-upload-button">
                  Add media
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (source) editor?.commands.setContent(post.content);
                    setSource(!source);
                  }}
                >
                  {source ? "Visual editor" : "HTML source"}
                </button>
              </div>
              {source ? (
                <textarea
                  aria-label="HTML source"
                  rows={20}
                  value={post.content}
                  onChange={(e) => update("content", e.target.value)}
                />
              ) : (
                <EditorContent editor={editor} />
              )}
              <label>
                Excerpt
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={post.excerpt}
                  onChange={(e) => update("excerpt", e.target.value)}
                  placeholder="A short introduction for the journal archive"
                />
              </label>
            </div>
            <aside className="admin-editor-settings">
              <details open className="management-panel">
                <summary>Publishing</summary>
                <label>
                  URL slug
                  <input
                    value={post.slug}
                    maxLength={180}
                    onChange={(e) => update("slug", e.target.value)}
                  />
                </label>
                <label>
                  Visibility
                  <select
                    value={post.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    {["draft", "published", "scheduled", "trash"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Publish time (your local time)
                  <input
                    type="datetime-local"
                    value={post.publishAt}
                    onChange={(e) => update("publishAt", e.target.value)}
                  />
                </label>
                <label>
                  Author
                  <input
                    value={post.author}
                    maxLength={120}
                    onChange={(e) => update("author", e.target.value)}
                  />
                </label>
                <button disabled={busy} onClick={() => save()}>
                  Save settings
                </button>
              </details>
              <details open className="management-panel">
                <summary>Featured image</summary>
                <button onClick={() => showLibrary(true)}>
                  Choose from library
                </button>
                {post.coverUrl && (
                  <img
                    className="admin-cover-preview"
                    src={post.coverUrl}
                    alt={post.coverAlt}
                  />
                )}
                <label>
                  Image URL
                  <input
                    value={post.coverUrl}
                    onChange={(e) => update("coverUrl", e.target.value)}
                  />
                </label>
                <label>
                  Alternative text
                  <input
                    maxLength={200}
                    value={post.coverAlt}
                    onChange={(e) => update("coverAlt", e.target.value)}
                  />
                </label>
                <label className="admin-upload-button">
                  Upload cover
                  <input
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(f, true);
                    }}
                  />
                </label>
              </details>
              <details open className="management-panel">
                <summary>Categories & tags</summary>
                <label>
                  Category
                  <input
                    maxLength={100}
                    value={post.category}
                    onChange={(e) => update("category", e.target.value)}
                  />
                </label>
                <label>
                  Tags (comma separated)
                  <input
                    maxLength={500}
                    value={post.tags}
                    onChange={(e) => update("tags", e.target.value)}
                  />
                </label>
              </details>
              <details className="management-panel">
                <summary>Search appearance</summary>
                <label>
                  SEO title
                  <input
                    maxLength={240}
                    value={post.seoTitle}
                    onChange={(e) => update("seoTitle", e.target.value)}
                  />
                </label>
                <label>
                  Meta description
                  <textarea
                    maxLength={320}
                    value={post.seoDescription}
                    onChange={(e) => update("seoDescription", e.target.value)}
                  />
                </label>
                <div className="admin-seo-preview">
                  <small>/blog/{post.slug}</small>
                  <strong>{post.seoTitle || post.title}</strong>
                  <p>{post.seoDescription || post.excerpt}</p>
                </div>
              </details>
              <details className="management-panel">
                <summary>Revision history ({revisions.length})</summary>
                {revisions.map((r) => (
                  <div className="admin-revision" key={r.id}>
                    <small>
                      {date(r.created_at)} · {r.actor}
                    </small>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Load this revision into the editor? Save to apply it.",
                          )
                        ) {
                          const next = {
                            ...fromRow(r.snapshot),
                            id: post.id,
                            version: post.version,
                          };
                          setPost(next);
                          editor?.commands.setContent(next.content, {
                            emitUpdate: false,
                          });
                          setDirty(true);
                        }
                      }}
                    >
                      Restore revision
                    </button>
                  </div>
                ))}
              </details>
            </aside>
          </div>
          {preview !== null && (
            <section
              className="admin-preview management-panel"
              aria-label="Article preview"
            >
              <div className="management-heading">
                <h2>Article preview</h2>
                <button onClick={() => setPreview(null)}>Close preview</button>
              </div>
              <h1>{post.title}</h1>
              <p>{post.excerpt}</p>
              {post.coverUrl && (
                <img
                  className="admin-cover-preview"
                  src={post.coverUrl}
                  alt={post.coverAlt}
                />
              )}
              <div
                className="journal-rich-content"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </section>
          )}
        </>
      )}
    </section>
  );
}
