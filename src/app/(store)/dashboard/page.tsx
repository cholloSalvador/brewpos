"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Package,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardData {
  todayOrders: number;
  totalOrders: number;
  todayRevenue: number;
  lowStockIngredients: {
    id: number;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
  }[];
  recentOrders: {
    id: number;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    createdAt: string;
    items: { productName: string; size: string; quantity: number }[];
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Overview for {format(new Date(), "EEEE, MMMM dd, yyyy")}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Revenue</p>
              <p className="text-2xl font-bold mt-1">₱{data.todayRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Orders</p>
              <p className="text-2xl font-bold mt-1">{data.todayOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{data.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Alerts</p>
              <p className="text-2xl font-bold mt-1">{data.lowStockIngredients.length}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.lowStockIngredients.length > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <AlertTriangle className={`w-6 h-6 ${data.lowStockIngredients.length > 0 ? "text-red-600" : "text-green-600"}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold">Recent Orders</h2>
          </div>
          <div className="divide-y">
            {data.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No orders yet today</div>
            ) : (
              data.recentOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(order.createdAt), "HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₱{order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.paymentMethod === "cash"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold">Low Stock Alerts</h2>
          </div>
          <div className="divide-y">
            {data.lowStockIngredients.length === 0 ? (
              <div className="p-8 text-center text-green-500">
                All ingredients are well-stocked!
              </div>
            ) : (
              data.lowStockIngredients.map((ing) => (
                <div key={ing.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{ing.name}</p>
                    <p className="text-xs text-gray-500">
                      Min: {ing.minStock} {ing.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {ing.currentStock} {ing.unit}
                    </p>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Low
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
