import { useCallback, useEffect, useMemo, useState } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left.mjs";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.mjs";
import Edit3 from "lucide-react/dist/esm/icons/edit-3.mjs";
import Loader2 from "lucide-react/dist/esm/icons/loader-2.mjs";
import Moon from "lucide-react/dist/esm/icons/moon.mjs";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw.mjs";
import Save from "lucide-react/dist/esm/icons/save.mjs";
import Star from "lucide-react/dist/esm/icons/star.mjs";
import Sun from "lucide-react/dist/esm/icons/sun.mjs";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.mjs";
import X from "lucide-react/dist/esm/icons/x.mjs";

const API_URL = import.meta.env.VITE_API_URL;
const LIMIT = 10;

function formFromItem(item) {
  return {
    name: item.name || "",
    feedback: item.feedback || "",
    rating: item.rating || 5,
    improvementArea: item.improvementArea || "",
  };
}

function apiHeaders(adminSecret, extra = {}) {
  return {
    ...extra,
    ...(adminSecret ? { "x-admin-secret": adminSecret } : {}),
  };
}

function initialsFromName(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function Stars({ value, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const icon = (
          <Star
            className={`h-5 w-5 ${active ? "text-[#fbbc04]" : "text-[var(--muted)]"}`}
            fill={active ? "currentColor" : "none"}
            strokeWidth={2}
          />
        );

        if (!interactive) {
          return <span key={star}>{icon}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            className="rounded-full p-1 transition hover:bg-[var(--soft)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            onClick={() => onChange(star)}
            aria-label={`Set rating to ${star}`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

function EditModal({ item, adminSecret, onClose, onSaved }) {
  const [form, setForm] = useState(() => formFromItem(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/feedback/${item._id}`, {
        method: "PUT",
        headers: apiHeaders(adminSecret, { "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update feedback");
      }

      onSaved(data);
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-title">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
          <div>
            <h2 id="edit-title" className="text-xl font-bold text-[var(--text)]">
              Edit feedback
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Update the public feedback details.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close editor">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <label className="field-label">
            <span>Name</span>
            <input
              className="input-control"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
          </label>

          <div className="field-label">
            <span>Stars</span>
            <Stars value={form.rating} interactive onChange={(rating) => updateField("rating", rating)} />
          </div>

          <label className="field-label">
            <span>Feedback</span>
            <textarea
              className="input-control min-h-32 resize-y"
              value={form.feedback}
              onChange={(event) => updateField("feedback", event.target.value)}
              minLength={5}
              maxLength={1000}
              required
            />
          </label>

          <label className="field-label">
            <span>Improvement area</span>
            <input
              className="input-control"
              value={form.improvementArea}
              onChange={(event) => updateField("improvementArea", event.target.value)}
              maxLength={250}
            />
          </label>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button type="submit" className="primary-button w-full justify-center" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? "Saving" : "Save changes"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}

function FeedbackRow({ item, onEdit, onDelete, deleting }) {
  return (
    <article className="feedback-row">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: item.avatarColor || "#4285F4" }}
          aria-hidden="true"
        >
          {initialsFromName(item.name) || "G"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-[var(--text)]">{item.name}</h2>
              <p className="text-sm text-[var(--muted)]">{formatDate(item.createdAt)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Stars value={item.rating} />
              <span className="rounded-full bg-[var(--soft)] px-3 py-1 text-sm font-semibold text-[var(--subtle)]">
                {item.likes || 0} likes
              </span>
            </div>
          </div>

          <p className="mt-4 line-clamp-3 text-[15px] leading-7 text-[var(--text)]">{item.feedback}</p>

          {item.improvementArea ? (
            <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-sm text-[var(--subtle)]">
              Improvement area: {item.improvementArea}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
        <button type="button" className="secondary-button" onClick={() => onEdit(item)}>
          <Edit3 className="h-4 w-4" />
          <span>Edit</span>
        </button>
        <button type="button" className="danger-button" onClick={() => onDelete(item)} disabled={deleting}>
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          <span>Delete</span>
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("adminTheme") || "light");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [adminSecret, setAdminSecret] = useState(() => localStorage.getItem("adminSecret") || "");

  const averageRating = useMemo(() => {
    if (items.length === 0) {
      return "0.0";
    }

    const totalRating = items.reduce((sum, item) => sum + item.rating, 0);
    return (totalRating / items.length).toFixed(1);
  }, [items]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("adminTheme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("adminSecret", adminSecret);
  }, [adminSecret]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/feedback?page=${page}&limit=${LIMIT}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load feedback");
      }

      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const request = Promise.resolve().then(loadFeedback);
    return () => {
      request.catch(() => {});
    };
  }, [loadFeedback]);

  async function handleDelete(item) {
    const confirmed = window.confirm(`Delete feedback from ${item.name}?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(item._id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/feedback/${item._id}`, {
        method: "DELETE",
        headers: apiHeaders(adminSecret),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete feedback");
      }

      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        loadFeedback();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId("");
    }
  }

  function handleSaved(updatedItem) {
    setItems((current) => current.map((item) => (item._id === updatedItem._id ? updatedItem : item)));
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <nav className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--nav)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="google-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <h1 className="truncate text-base font-bold tracking-wide sm:text-lg">CUSTOMER FEEDBACK ADMIN</h1>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="icon-button" onClick={loadFeedback} aria-label="Refresh feedback">
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-semibold text-[var(--blue)]">Single-admin control panel</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Manage feedback</h2>
          </div>
          <div className="google-line" aria-hidden="true" />
        </div>

        <label className="mb-6 grid gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
          <span className="text-sm font-bold text-[var(--subtle)]">Admin key</span>
          <input
            className="input-control"
            type="password"
            value={adminSecret}
            onChange={(event) => setAdminSecret(event.target.value)}
            placeholder="Enter the ADMIN_SECRET from your backend"
          />
        </label>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="metric-card">
            <p>Total feedback</p>
            <strong>{total}</strong>
          </div>
          <div className="metric-card">
            <p>Current page</p>
            <strong>{items.length}</strong>
          </div>
          <div className="metric-card">
            <p>Average stars</p>
            <strong>{averageRating}</strong>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {loading ? (
          <div className="grid min-h-72 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--card)]">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--blue)]" />
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <FeedbackRow
                key={item._id}
                item={item}
                onEdit={setEditingItem}
                onDelete={handleDelete}
                deleting={deletingId === item._id}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2 className="text-xl font-bold">No feedback yet</h2>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <p className="text-sm font-semibold text-[var(--subtle)]">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={page === totalPages || loading}
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {editingItem ? (
        <EditModal
          key={editingItem._id}
          item={editingItem}
          adminSecret={adminSecret}
          onClose={() => setEditingItem(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </main>
  );
}
