"use client";

import { useState, useEffect } from "react";
import { CreditCard, Clock, Play, Pause, Plus } from "lucide-react";
import { format } from "date-fns";

interface SubData {
  id: number; storeId: number; plan: string; status: string; startDate: string; endDate: string; amount: number; notes: string;
  store: { id: number; name: string; active: boolean };
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<SubData[]>([]);
  const [extendId, setExtendId] = useState<number | null>(null);
  const [extendMonths, setExtendMonths] = useState("1");

  const fetchSubs = () => fetch("/api/admin/subscriptions").then((r) => r.json()).then(setSubs);
  useEffect(() => { fetchSubs(); }, []);

  const doAction = async (id: number, action: string, extra?: Record<string, unknown>) => {
    await fetch("/api/admin/subscriptions", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    setExtendId(null);
    fetchSubs();
  };

  const now = Date.now();

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Subscription Management</h1>
        <p className="text-sm text-gray-500">Control store access and billing periods</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{subs.filter((s) => s.status === "active" && new Date(s.endDate).getTime() > now).length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-sm text-gray-500">Expiring Soon (7 days)</p>
          <p className="text-2xl font-bold text-yellow-600">
            {subs.filter((s) => { const d = Math.ceil((new Date(s.endDate).getTime() - now) / 86400000); return d > 0 && d <= 7; }).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-sm text-gray-500">Expired / Suspended</p>
          <p className="text-2xl font-bold text-red-600">{subs.filter((s) => s.status !== "active" || new Date(s.endDate).getTime() <= now).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Store</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Days Left</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subs.map((s) => {
              const daysLeft = Math.ceil((new Date(s.endDate).getTime() - now) / 86400000);
              const isExpired = daysLeft <= 0;
              const isExpiring = daysLeft > 0 && daysLeft <= 7;

              return (
                <tr key={s.id} className={`hover:bg-gray-50 ${isExpired ? "bg-red-50" : isExpiring ? "bg-yellow-50" : ""}`}>
                  <td className="px-6 py-4">
                    <p className="font-medium">{s.store.name}</p>
                    <p className="text-xs text-gray-400">{s.notes || "No notes"}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium capitalize">{s.plan}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.status === "active" && !isExpired ? "bg-green-100 text-green-700" :
                      s.status === "suspended" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {isExpired && s.status === "active" ? "Expired" : s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">{format(new Date(s.startDate), "MMM dd, yyyy")}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">{format(new Date(s.endDate), "MMM dd, yyyy")}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${isExpired ? "text-red-600" : isExpiring ? "text-yellow-600" : "text-green-600"}`}>
                      {isExpired ? "0" : daysLeft}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-center">
                      {extendId === s.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" min="1" value={extendMonths} onChange={(e) => setExtendMonths(e.target.value)}
                            className="w-16 px-2 py-1 border rounded text-sm text-center" />
                          <span className="text-xs text-gray-500">mo</span>
                          <button onClick={() => doAction(s.id, "extend", { months: parseInt(extendMonths) })}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Extend</button>
                          <button onClick={() => setExtendId(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => { setExtendId(s.id); setExtendMonths("1"); }}
                            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Extend">
                            <Plus className="w-4 h-4" />
                          </button>
                          {s.status === "active" ? (
                            <button onClick={() => doAction(s.id, "suspend")}
                              className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200" title="Suspend">
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => doAction(s.id, "activate")}
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Activate">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
