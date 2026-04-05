"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Receipt, User } from "lucide-react";
import { format } from "date-fns";

interface OrderItem {
  id: number;
  productName: string;
  size: string;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetch("/api/orders?limit=100")
      .then((r) => r.json())
      .then(setOrders);
  }, []);

  const todayOrders = orders.filter((o) => {
    const today = new Date();
    const orderDate = new Date(o.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
        <p className="text-sm text-gray-500">View all completed orders</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Today&apos;s Orders</p>
          <p className="text-2xl font-bold mt-1">{todayOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Today&apos;s Revenue</p>
          <p className="text-2xl font-bold mt-1">₱{todayRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold mt-1">{orders.length}</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Orders List */}
        <div className="flex-1 bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedOrder?.id === order.id ? "bg-amber-50" : ""}`}
                >
                  <td className="px-6 py-4 font-medium text-sm">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    {order.customerName ? (
                      <span className="font-medium text-gray-800">{order.customerName}</span>
                    ) : (
                      <span className="text-gray-400 italic">Walk-in</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="max-w-[200px] truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(order.createdAt), "MMM dd, HH:mm")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      order.paymentMethod === "cash"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">₱{order.total.toFixed(2)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No orders yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Order Detail */}
        {selectedOrder && (
          <div className="w-80 bg-white rounded-xl border p-6 h-fit sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold">Order Details</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order #</span>
                <span className="font-medium">{selectedOrder.orderNumber}</span>
              </div>
              {selectedOrder.customerName && (
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Customer
                  </span>
                  <span className="font-medium text-amber-700">{selectedOrder.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{format(new Date(selectedOrder.createdAt), "MMM dd, yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span className="capitalize">{selectedOrder.paymentMethod}</span>
              </div>
            </div>

            <hr className="my-4" />

            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Items</p>
            <div className="space-y-2">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.size} x{item.quantity} @ ₱{item.price}</p>
                  </div>
                  <span className="font-medium">₱{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr className="my-4" />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₱{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Tax</span>
                <span>₱{selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>₱{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
