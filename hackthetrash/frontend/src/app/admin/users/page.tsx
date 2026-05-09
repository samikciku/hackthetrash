"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RequireAuth, useAuth, Role } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  region: string | null;
};

const ROLE_BADGE: Record<Role, string> = {
  admin:     "bg-red-100 text-red-700",
  moderator: "bg-yellow-100 text-yellow-800",
  authority: "bg-blue-100 text-blue-700",
  citizen:   "bg-gray-100 text-gray-700"
};

const ROLES: Role[] = ["citizen", "moderator", "authority", "admin"];

function UsersInner() {
  const { user: me, apiFetch } = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePass, setInvitePass] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("moderator");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API ${res.status}`);
      }
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (id: string, role: Role) => {
    if (!confirm(t("admin.confirmRoleChange", { role: t(`admin.roles.${role}`) }))) return;
    setBusyId(id);
    try {
      const res = await apiFetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (id: string, email: string) => {
    if (!confirm(t("admin.confirmRemove", { email }))) return;
    setBusyId(id);
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    if (invitePass.length < 8) return setInviteError(t("admin.passwordTooShort"));
    setInviting(true);
    try {
      const res = await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          password: invitePass,
          name: inviteName || null,
          role: inviteRole
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setShowInvite(false);
      setInviteEmail(""); setInvitePass(""); setInviteName(""); setInviteRole("moderator");
      await load();
    } catch (e: any) {
      setInviteError(e?.message ?? "Failed");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <Link href="/admin" className="text-sm text-gray-500 hover:underline mb-4 inline-block">
        ← {t("admin.backToPanel")}
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">👥 {t("admin.users")}</h1>
          <p className="text-sm text-gray-500">{t("admin.usersSubtitle")}</p>
        </div>
        <button
          onClick={() => setShowInvite((v) => !v)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90"
        >
          {showInvite ? t("common.cancel") : `+ ${t("admin.invite")}`}
        </button>
      </div>

      {showInvite && (
        <form onSubmit={submitInvite} className="bg-white border rounded-2xl shadow-sm p-5 mb-6 grid gap-3 sm:grid-cols-2">
          <h2 className="sm:col-span-2 font-bold text-lg">📧 {t("admin.inviteUser")}</h2>
          {inviteError && (
            <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
              {inviteError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t("admin.email")}</label>
            <input
              type="email" required value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="moderator@city.gov"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("admin.userName")}</label>
            <input
              type="text" value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              placeholder={t("admin.userNamePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("admin.password")}</label>
            <input
              type="password" required minLength={8} value={invitePass}
              onChange={(e) => setInvitePass(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              placeholder={t("admin.passwordHint")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("admin.role")}</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="w-full border rounded-lg p-2 text-sm bg-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{t(`admin.roles.${r}`)}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowInvite(false)}
              className="px-4 py-2 text-sm border rounded">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={inviting}
              className="bg-primary text-white px-4 py-2 rounded font-semibold disabled:opacity-50">
              {inviting ? t("admin.saving") : t("admin.invite")}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">{t("dashboard.loading")}</div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white border rounded-lg">
          {t("admin.noUsers")}
        </div>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">{t("admin.email")}</th>
                <th className="p-3">{t("admin.userName")}</th>
                <th className="p-3">{t("admin.role")}</th>
                <th className="p-3">{t("admin.region")}</th>
                <th className="p-3 text-right">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono">
                      {u.email}
                      {isMe && (
                        <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                          {t("admin.you")}
                        </span>
                      )}
                    </td>
                    <td className="p-3">{u.name || <span className="text-gray-400">—</span>}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role]}`}>
                        {t(`admin.roles.${u.role}`)}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{u.region || <span className="text-gray-400">—</span>}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-2 items-center">
                        <select
                          value={u.role}
                          disabled={busyId === u.id || isMe}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          className="text-xs border rounded px-1 py-1 bg-white disabled:opacity-50"
                          title={isMe ? t("admin.cannotEditSelf") : ""}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{t(`admin.roles.${r}`)}</option>
                          ))}
                        </select>
                        <button
                          disabled={busyId === u.id || isMe}
                          onClick={() => removeUser(u.id, u.email)}
                          className="text-xs text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-40"
                          title={isMe ? t("admin.cannotEditSelf") : t("admin.remove")}
                        >
                          {t("admin.remove")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <RequireAuth role={["admin"]}>
      <UsersInner />
    </RequireAuth>
  );
}
