"use client";

import { useState, useEffect } from "react";
import { Store, Users, ShoppingCart, DollarSign, CreditCard, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface StoreInfo {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  subscription: { status: string; endDate: string; plan: string } | null;
  _count: { users: number; orders: number };
}

interface Stats {
  totalStores: number;
  activeStores: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  recentStores: StoreInfo[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Stores</p>
              <p className="text-2xl font-bold mt-1">{stats.totalStores}</p>
              <p className="text-xs text-green-600">{stats.activeStores} active</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Platform Revenue</p>
              <p className="text-2xl font-bold mt-1">₱{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold">Subscriptions</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.expiredSubscriptions}</p>
              <p className="text-sm text-gray-500">Expired/Suspended</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold">Recent Stores</h2>
          </div>
          <div className="divide-y">
            {stats.recentStores.map((store) => {
              const daysLeft = store.subscription
                ? Math.ceil((new Date(store.subscription.endDate).getTime() - Date.now()) / 86400000)
                : 0;
              return (
                <div key={store.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{store.name}</p>
                    <p className="text-xs text-gray-400">{store._count.users} users, {store._count.orders} orders</p>
                  </div>
                  <div className="text-right">
                    {daysLeft > 0 ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${daysLeft <= 7 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {daysLeft}d left
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Expired
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(store.createdAt), "MMM dd, yyyy")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
