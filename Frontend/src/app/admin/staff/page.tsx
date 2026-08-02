"use client";

import React, { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import toast from "react-hot-toast";
import { ShieldCheck, Pencil, KeyRound, Trash2, Plus, X } from "lucide-react";
import { getAdminUser, adminFetch, type AdminPayload } from "@/lib/adminAuth";
import { PERMISSION_MODULES, PERMISSION_GROUPS } from "@/lib/adminPermissions";

const STAFF_URL = "/api/admin/staff";
const adminFetcher = (url: string) => adminFetch(url).then((res) => res.json());

interface Staff {
  _id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "editor";
  permissions?: Record<string, boolean>;
  createdAt?: string;
}

type FormState = {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "admin" | "editor";
  permissions: Record<string, boolean>;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "editor",
  permissions: {},
};

const ROLE_LABELS: Record<Staff["role"], string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

const ROLE_BADGE: Record<Staff["role"], string> = {
  super_admin: "bg-primary-100 text-primary-700",
  admin: "bg-blue-100 text-blue-700",
  editor: "bg-gray-100 text-gray-600",
};

export default function StaffPage() {
  const [me, setMe] = useState<AdminPayload | null>(null);

  useEffect(() => {
    setMe(getAdminUser());
  }, []);

  const isSuperAdmin = me?.role === "super_admin";
  const isAdmin = me?.role === "super_admin" || me?.role === "admin";

  const { data, error } = useSWR(isAdmin ? STAFF_URL : null, adminFetcher);
  const staff: Staff[] = data?.staff || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Password reset modal
  const [pwTarget, setPwTarget] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const isEditing = Boolean(form._id);

  const openCreate = () => {
    setForm({ ...emptyForm, role: isSuperAdmin ? "editor" : "editor" });
    setModalOpen(true);
  };

  const openEdit = (s: Staff) => {
    setForm({
      _id: s._id,
      name: s.name,
      email: s.email,
      password: "",
      role: s.role,
      permissions: { ...(s.permissions || {}) },
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
  };

  const togglePermission = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!isEditing && form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      permissions: form.role === "editor" ? form.permissions : {},
    };

    setSaving(true);
    try {
      let res: Response;
      if (isEditing) {
        res = await adminFetch(`${STAFF_URL}/${form._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await adminFetch(STAFF_URL, {
          method: "POST",
          body: JSON.stringify({ ...payload, password: form.password }),
        });
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed");
      }
      toast.success(isEditing ? "Staff member updated" : "Staff member created");
      mutate(STAFF_URL);
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwTarget) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      const res = await adminFetch(`${STAFF_URL}/${pwTarget._id}/password`, {
        method: "PUT",
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed");
      }
      toast.success(`Password reset for ${pwTarget.name}`);
      setPwTarget(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async (s: Staff) => {
    if (!confirm(`Delete staff member "${s.name}"? This cannot be undone.`)) return;
    try {
      const res = await adminFetch(`${STAFF_URL}/${s._id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed");
      }
      toast.success("Staff member deleted");
      mutate(STAFF_URL);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  // A caller can act on a target row when: super_admin (anyone) or admin (editors only)
  const canManage = (s: Staff) => isSuperAdmin || s.role === "editor";

  if (!me) return <div className="text-gray-600 p-6">Loading…</div>;
  if (!isAdmin)
    return <div className="text-red-500 p-6">You do not have access to Staff Management.</div>;
  if (error) return <div className="text-red-500 p-6">Failed to load staff</div>;
  if (!data) return <div className="text-gray-600 p-6">Loading staff…</div>;

  const grantedCount = (s: Staff) =>
    Object.values(s.permissions || {}).filter(Boolean).length;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="text-primary-600" size={22} />
            Staff Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSuperAdmin
              ? "Create and manage admins, editors and their permissions."
              : "Manage editor accounts and their permissions."}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          <Plus size={16} />
          Add Staff
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Permissions</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const isSelf = s._id === me.id;
              const manageable = canManage(s);
              return (
                <tr key={s._id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {s.name}
                    {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[s.role]}`}
                    >
                      {ROLE_LABELS[s.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.role === "editor" ? (
                      grantedCount(s) > 0 ? (
                        `${grantedCount(s)} / ${PERMISSION_MODULES.length} modules`
                      ) : (
                        <span className="text-gray-400">None</span>
                      )
                    ) : (
                      <span className="text-gray-400">Full access</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        disabled={!manageable}
                        title="Edit"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setPwTarget(s);
                          setNewPassword("");
                        }}
                        disabled={!manageable}
                        title="Reset password"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={!isSuperAdmin || isSelf}
                        title={isSelf ? "You cannot delete yourself" : "Delete"}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No staff members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {isEditing ? "Edit Staff Member" : "Add Staff Member"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-gray-400 font-normal">(min 8 chars)</span>
                  </label>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
                  value={form.role}
                  disabled={!isSuperAdmin}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as Staff["role"] })
                  }
                >
                  <option value="editor">Editor</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                </select>
                {!isSuperAdmin && (
                  <p className="text-xs text-gray-400 mt-1">
                    Only a super admin can assign admin roles.
                  </p>
                )}
              </div>

              {form.role === "editor" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Permissions
                    </label>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        className="text-primary-600 hover:underline"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            permissions: Object.fromEntries(
                              PERMISSION_MODULES.map((m) => [m.key, true])
                            ),
                          }))
                        }
                      >
                        Select all
                      </button>
                      <span className="text-gray-300">·</span>
                      <button
                        type="button"
                        className="text-gray-500 hover:underline"
                        onClick={() => setForm((p) => ({ ...p, permissions: {} }))}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                          {group}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PERMISSION_MODULES.filter((m) => m.group === group).map((m) => (
                            <label
                              key={m.key}
                              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                checked={Boolean(form.permissions[m.key])}
                                onChange={() => togglePermission(m.key)}
                              />
                              {m.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-60"
                >
                  {saving ? "Saving…" : isEditing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {pwTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <button
                onClick={() => setPwTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Set a new password for <span className="font-medium">{pwTarget.name}</span> (
                {pwTarget.email}).
              </p>
              <input
                type="password"
                autoFocus
                placeholder="New password (min 8 chars)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPwTarget(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
