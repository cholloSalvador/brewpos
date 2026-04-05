"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Pencil, Trash2, X, Save, Power, PowerOff } from "lucide-react";
import { format } from "date-fns";

interface UserData {
  id: number; email: string; name: string; role: string; active: boolean; storeId: number | null; createdAt: string;
  store: { id: number; name: string } | null;
}

interface StoreOption { id: number; name: string }

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "staff", storeId: "" });
  const [filter, setFilter] = useState("");

  const fetchData = () => {
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
    fetch("/api/admin/stores").then((r) => r.json()).then((s: { id: number; name: string }[]) => setStores(s.map((x) => ({ id: x.id, name: x.name }))));
  };
  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm({ email: "", password: "", name: "", role: "staff", storeId: stores[0]?.id.toString() || "" });
    setShowForm(true);
  };

  const openEdit = (u: UserData) => {
    setEditUser(u);
    setForm({ email: u.email, password: "", name: u.name, role: u.role, storeId: u.storeId?.toString() || "" });
    setShowForm(true);
  };

  const saveUser = async () => {
    if (editUser) {
      const data: Record<string, unknown> = { id: editUser.id, email: form.email, name: form.name, role: form.role, storeId: form.storeId ? parseInt(form.storeId) : null };
      if (form.password) data.password = form.password;
      await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } else {
      await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name, role: form.role, storeId: form.storeId ? parseInt(form.storeId) : null }),
      });
    }
    setShowForm(false);
    fetchData();
  };

  const toggleActive = async (u: UserData) => {
    await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, active: !u.active }) });
    fetchData();
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchData();
  };

  const filtered = users.filter((u) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q) || (u.store?.name || "").toLowerCase().includes(q);
  });

  const roleColors: Record<string, string> = {
    superadmin: "bg-red-100 text-red-700",
    owner: "bg-purple-100 text-purple-700",
    manager: "bg-blue-100 text-blue-700",
    staff: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">{users.length} users total</p>
        </div>
        <div className="flex gap-2">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search users..." className="px-3 py-2 border rounded-lg text-sm w-48" />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Store</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[u.role] || "bg-gray-100"}`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 text-sm">{u.store?.name || <span className="text-gray-400">—</span>}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.active ? "Active" : "Disabled"}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(u.createdAt), "MMM dd, yyyy")}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 justify-center">
                    {u.role !== "superadmin" && (
                      <>
                        <button onClick={() => openEdit(u)} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => toggleActive(u)} className={`p-1.5 rounded-lg ${u.active ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {u.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[450px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editUser ? "Edit User" : "Add New User"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editUser ? "New Password (leave blank to keep)" : "Password *"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                  <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">No Store</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={saveUser} disabled={!form.name || !form.email || (!editUser && !form.password)} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-5 h-5" /> {editUser ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
