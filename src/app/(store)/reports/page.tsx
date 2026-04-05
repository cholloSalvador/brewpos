"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart3,
  Clock,
  CreditCard,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";

interface ReportData {
  period: string;
  summary: {
    totalRevenue: number;
    totalTax: number;
    totalOrders: number;
    totalItemsSold: number;
    avgOrderValue: number;
    todayRevenue: number;
    todayOrders: number;
    totalIngredientCost: number;
    estimatedProfit: number;
    profitMargin: number;
  };
  salesTimeline: { date: string; orders: number; revenue: number; tax: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  sizeSales: { size: string; quantity: number; revenue: number }[];
  paymentBreakdown: { method: string; count: number; total: number }[];
  hourlySales: { hour: number; orders: number; revenue: number }[];
  topIngredientUsage: { name: string; unit: string; totalUsed: number; estimatedCost: number }[];
  lowStockAlerts: { id: number; name: string; unit: string; currentStock: number; minStock: number }[];
}

function BarChart({ data, labelKey, valueKey, color = "bg-amber-500", prefix = "₱", maxBars }: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  color?: string;
  prefix?: string;
  maxBars?: number;
}) {
  const items = maxBars ? data.slice(0, maxBars) : data;
  const maxVal = Math.max(...items.map((d) => d[valueKey] as number), 1);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const val = item[valueKey] as number;
        const pct = (val / maxVal) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-28 truncate text-right shrink-0">
              {String(item[labelKey])}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700">
                {prefix}{val.toLocaleString(undefined, { minimumFractionDigits: prefix === "₱" ? 2 : 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; orders: number; revenue: number }[] }) {
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((item) => {
        const pct = (item.orders / maxOrders) * 100;
        const label = item.hour === 0 ? "12a" : item.hour < 12 ? `${item.hour}a` : item.hour === 12 ? "12p" : `${item.hour - 12}p`;
        return (
          <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="w-full bg-gray-100 rounded-t relative" style={{ height: "100%" }}>
              <div
                className={`absolute bottom-0 w-full rounded-t transition-all duration-500 ${
                  item.orders > 0 ? "bg-amber-500" : "bg-gray-200"
                }`}
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
            </div>
            {item.hour % 3 === 0 && (
              <span className="text-[10px] text-gray-400">{label}</span>
            )}
            {/* Tooltip */}
            {item.orders > 0 && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {label}: {item.orders} orders / ₱{item.revenue.toFixed(0)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SalesTimelineChart({ data }: { data: { date: string; orders: number; revenue: number }[] }) {
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((item, i) => {
        const pct = (item.revenue / maxRev) * 100;
        const shortDate = item.date.includes("Week")
          ? item.date.replace("Week of ", "W ")
          : item.date.length > 7
          ? item.date.slice(5)
          : item.date;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative min-w-0">
            <div className="w-full bg-gray-100 rounded-t relative" style={{ height: "100%" }}>
              <div
                className="absolute bottom-0 w-full bg-green-500 rounded-t transition-all duration-500"
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
            </div>
            {(data.length <= 15 || i % Math.ceil(data.length / 10) === 0) && (
              <span className="text-[9px] text-gray-400 truncate w-full text-center">{shortDate}</span>
            )}
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
              {item.date}: ₱{item.revenue.toFixed(2)} ({item.orders} orders)
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [period]);

  if (loading || !data) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading reports...</div>
      </div>
    );
  }

  const s = data.summary;
  const periodLabel = period === "daily" ? "Last 30 Days" : period === "weekly" ? "Last 12 Weeks" : "Last 12 Months";

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">{periodLabel} - as of {format(new Date(), "MMM dd, yyyy HH:mm")}</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: "daily", label: "Daily" },
            { key: "weekly", label: "Weekly" },
            { key: "monthly", label: "Monthly" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.key ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium uppercase">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold">₱{s.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Today: ₱{s.todayRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium uppercase">Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{s.totalOrders.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Today: {s.todayOrders}</p>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium uppercase">Avg Order Value</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">₱{s.avgOrderValue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{s.totalItemsSold} items sold</p>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium uppercase">Est. Profit</span>
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          </div>
          <p className={`text-2xl font-bold ${s.estimatedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₱{s.estimatedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Margin: {s.profitMargin.toFixed(1)}%</p>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium uppercase">Ingredient Cost</span>
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            ₱{s.totalIngredientCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Tax: ₱{s.totalTax.toFixed(2)}</p>
        </div>
      </div>

      {/* Sales Timeline */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h2 className="font-bold text-gray-800">Sales Over Time</h2>
          <span className="text-xs text-gray-400 ml-auto">{periodLabel}</span>
        </div>
        {data.salesTimeline.length > 0 ? (
          <SalesTimelineChart data={data.salesTimeline} />
        ) : (
          <p className="text-center py-8 text-gray-400">No sales data for this period</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-gray-800">Top Products by Revenue</h2>
          </div>
          {data.topProducts.length > 0 ? (
            <>
              <BarChart data={data.topProducts} labelKey="name" valueKey="revenue" maxBars={8} />
              <div className="mt-4 border-t pt-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left py-1">Product</th>
                      <th className="text-right py-1">Qty</th>
                      <th className="text-right py-1">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="py-1.5 font-medium">{p.name}</td>
                        <td className="py-1.5 text-right text-gray-500">{p.quantity}</td>
                        <td className="py-1.5 text-right font-medium">₱{p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-center py-8 text-gray-400">No product data</p>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-gray-800">Peak Hours</h2>
          </div>
          <HourlyChart data={data.hourlySales} />
          <div className="mt-4 border-t pt-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              {(() => {
                const sorted = [...data.hourlySales].sort((a, b) => b.orders - a.orders);
                const top3 = sorted.filter((h) => h.orders > 0).slice(0, 3);
                return top3.map((h, i) => {
                  const label = h.hour === 0 ? "12 AM" : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? "12 PM" : `${h.hour - 12} PM`;
                  return (
                    <div key={i} className="bg-amber-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">#{i + 1} Peak</p>
                      <p className="font-bold text-amber-700">{label}</p>
                      <p className="text-xs text-gray-500">{h.orders} orders</p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sales by Size */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-800">Sales by Size</h2>
          </div>
          {data.sizeSales.length > 0 ? (
            <div className="space-y-3">
              {data.sizeSales.map((s, i) => {
                const totalQty = data.sizeSales.reduce((sum, x) => sum + x.quantity, 0);
                const pct = totalQty > 0 ? (s.quantity / totalQty) * 100 : 0;
                const colors = ["bg-amber-500", "bg-blue-500", "bg-green-500", "bg-purple-500"];
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{s.size}</span>
                      <span className="text-gray-500">{s.quantity} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 ${colors[i % colors.length]} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-0.5">₱{s.revenue.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400">No data</p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-800">Payment Methods</h2>
          </div>
          {data.paymentBreakdown.length > 0 ? (
            <div className="space-y-4">
              {data.paymentBreakdown.map((p) => {
                const totalCount = data.paymentBreakdown.reduce((s, x) => s + x.count, 0);
                const pct = totalCount > 0 ? (p.count / totalCount) * 100 : 0;
                return (
                  <div key={p.method} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold capitalize text-gray-800">{p.method}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        p.method === "cash" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-lg font-bold">₱{p.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{p.count} transactions</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400">No data</p>
          )}
        </div>

        {/* Ingredient Cost & Low Stock */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-gray-800">Ingredient Costs</h2>
          </div>
          {data.topIngredientUsage.length > 0 ? (
            <div className="space-y-2">
              {data.topIngredientUsage.map((ing, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{ing.name}</p>
                    <p className="text-xs text-gray-400">{ing.totalUsed.toLocaleString()} {ing.unit} used</p>
                  </div>
                  <span className="font-medium text-red-600">₱{ing.estimatedCost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-400 text-sm">No ingredient usage data</p>
          )}

          {/* Low Stock Alerts */}
          {data.lowStockAlerts.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-medium text-sm text-red-700">Low Stock Alerts</h3>
              </div>
              {data.lowStockAlerts.map((ing) => (
                <div key={ing.id} className="flex justify-between text-xs py-1 text-red-600">
                  <span>{ing.name}</span>
                  <span>{ing.currentStock}/{ing.minStock} {ing.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
