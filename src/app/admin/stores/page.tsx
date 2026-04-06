"use client";

import { useState, useEffect } from "react";
import { Store, Plus, Pencil, Trash2, X, Save, Power, PowerOff } from "lucide-react";
import { format } from "date-fns";

interface StoreData {
  id: number; name: string; address: string; phone: string; email: string; active: boolean; createdAt: string;
  subscription: { id: number; status: string; endDate: string; plan: string } | null;
  _count: { users: number; orders: number; products: number };
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editStore, setEditStore] = useState<StoreData | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", ownerName: "", ownerEmail: "", ownerPassword: "", plan: "monthly", months: "1" });

  const fetchStores = () => fetch("/api/admin/stores").then((r) => r.json()).then(setStores);
  useEffect(() => { fetchStores(); }, []);

  const openAdd = () => {
    setEditStore(null);
    setForm({ name: "", address: "", phone: "", email: "", ownerName: "", ownerEmail: "", ownerPassword: "", plan: "monthly", months: "1" });
    setShowForm(true);
  };

  const openEdit = (s: StoreData) => {
    setEditStore(s);
    setForm({ name: s.name, address: s.address, phone: s.phone, email: s.email, ownerName: "", ownerEmail: "", ownerPassword: "", plan: "monthly", months: "1" });
    setShowForm(true);
  };

  const saveStore = async () => {
    if (editStore) {
      await fetch("/api/admin/stores", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editStore.id, name: form.name, address: form.address, phone: form.phone, email: form.email }),
      });
    } else {
      await fetch("/api/admin/stores", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, months: parseInt(form.months) }),
      });
    }
    setShowForm(false);
    fetchStores();
  };

  const toggleActive = async (s: StoreData) => {
    await fetch("/api/admin/stores", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    fetchStores();
  };

  const deleteStore = async (id: number) => {
    if (!confirm("Delete this store and ALL its data? This cannot be undone.")) return;
    await fetch("/api/admin/stores", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchStores();
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Store Management</h1>
          <p className="text-sm text-gray-500">Create and manage stores</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Create Store
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Store</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Users</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Products</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Orders</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subscription</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stores.map((s) => {
              const daysLeft = s.subscription ? Math.ceil((new Date(s.subscription.endDate).getTime() - Date.now()) / 86400000) : 0;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email || s.address || "No details"}</p>
                    <p className="text-xs text-gray-400">Created: {format(new Date(s.createdAt), "MMM dd, yyyy")}</p>
                  </td>
                  <td className="px-6 py-4 text-center">{s._count.users}</td>
                  <td className="px-6 py-4 text-center">{s._count.products}</td>
                  <td className="px-6 py-4 text-center">{s._count.orders}</td>
                  <td className="px-6 py-4 text-center">
                    {s.subscription ? (
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full ${daysLeft > 7 ? "bg-green-100 text-green-700" : daysLeft > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{s.subscription.plan}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={() => openEdit(s)} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => toggleActive(s)} className={`p-1.5 rounded-lg ${s.active ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`} title={s.active ? "Disable" : "Enable"}>
                        {s.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteStore(s.id)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[500px] max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editStore ? "Edit Store" : "Create New Store"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="My Coffee Shop" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              {!editStore && (
                <>
                  <hr />
                  <p className="text-sm font-bold text-gray-700">Owner Account</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                      <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email *</label>
                      <input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Password *</label>
                    <input type="password" value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <hr />
                  <p className="text-sm font-bold text-gray-700">Subscription Plan</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "1", label: "1 Month", price: "₱200", perMonth: "₱200/mo", badge: "" },
                      { key: "3", label: "3 Months", price: "₱500", perMonth: "₱167/mo", badge: "Save ₱100" },
                      { key: "6", label: "6 Months", price: "₱900", perMonth: "₱150/mo", badge: "Save ₱300" },
                      { key: "12", label: "1 Year", price: "₱1,500", perMonth: "₱125/mo", badge: "Best Deal" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setForm({ ...form, months: p.key, plan: p.key === "12" ? "yearly" : p.key === "1" ? "monthly" : "quarterly" })}
                        className={`relative p-3 border-2 rounded-xl text-left transition-all ${
                          form.months === p.key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {p.badge && (
                          <span className={`absolute -top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            p.key === "12" ? "bg-green-500 text-white" : "bg-amber-100 text-amber-700"
                          }`}>{p.badge}</span>
                        )}
                        <p className="font-bold text-sm">{p.label}</p>
                        <p className="text-lg font-bold text-blue-600">{p.price}</p>
                        <p className="text-xs text-gray-500">{p.perMonth}</p>
                      </button>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">14-day free trial included with all plans</p>
                  </div>
                </>
              )}

              <button onClick={saveStore} disabled={!form.name.trim()} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-5 h-5" /> {editStore ? "Update Store" : "Create Store"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
