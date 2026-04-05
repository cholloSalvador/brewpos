"use client";

import { useState, useEffect } from "react";
import { Package, Plus, AlertTriangle, ArrowDownCircle, ArrowUpCircle, History, Pencil, Save, X } from "lucide-react";
import { format } from "date-fns";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
}

interface StockLog {
  id: number;
  ingredientId: number;
  type: string;
  quantity: number;
  reference: string;
  createdAt: string;
  ingredient: Ingredient;
}

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [showRestock, setShowRestock] = useState<number | null>(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<number | null>(null);

  // Edit ingredient state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", unit: "", minStock: "", costPerUnit: "" });

  // Add ingredient state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", unit: "ml", currentStock: "", minStock: "", costPerUnit: "" });

  const fetchData = async () => {
    const [ingRes, logRes] = await Promise.all([
      fetch("/api/inventory"),
      fetch("/api/inventory/logs?limit=200"),
    ]);
    setIngredients(await ingRes.json());
    setLogs(await logRes.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleRestock = async (ingredientId: number) => {
    const amount = parseFloat(restockAmount);
    if (isNaN(amount) || amount <= 0) return;
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredientId, quantity: amount, type: "in", reference: "Manual restock" }),
    });
    setShowRestock(null);
    setRestockAmount("");
    fetchData();
  };

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditForm({
      name: ing.name,
      unit: ing.unit,
      minStock: ing.minStock.toString(),
      costPerUnit: ing.costPerUnit.toString(),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch("/api/ingredients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name: editForm.name,
        unit: editForm.unit,
        minStock: parseFloat(editForm.minStock) || 0,
        costPerUnit: parseFloat(editForm.costPerUnit) || 0,
      }),
    });
    setEditingId(null);
    fetchData();
  };

  const addIngredient = async () => {
    if (!addForm.name.trim()) return;
    await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addForm.name,
        unit: addForm.unit,
        currentStock: parseFloat(addForm.currentStock) || 0,
        minStock: parseFloat(addForm.minStock) || 0,
        costPerUnit: parseFloat(addForm.costPerUnit) || 0,
      }),
    });
    setShowAddForm(false);
    setAddForm({ name: "", unit: "ml", currentStock: "", minStock: "", costPerUnit: "" });
    fetchData();
  };

  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minStock).length;
  const filteredLogs = selectedIngredient
    ? logs.filter((l) => l.ingredientId === selectedIngredient)
    : logs;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-sm text-gray-500">Track and manage your ingredient stock levels</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Ingredient
          </button>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <History className="w-4 h-4" />
            {showLogs ? "Show Inventory" : "Stock Logs"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ingredients.length}</p>
              <p className="text-sm text-gray-500">Total Ingredients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? "text-red-600" : "text-green-600"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowStockCount}</p>
              <p className="text-sm text-gray-500">Low Stock Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-sm text-gray-500">Stock Movements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[450px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Ingredient</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text" value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Oat Milk"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ml">ml</option>
                    <option value="gram">gram</option>
                    <option value="piece">piece</option>
                    <option value="liter">liter</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input
                    type="number" value={addForm.currentStock}
                    onChange={(e) => setAddForm({ ...addForm, currentStock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock (alert)</label>
                  <input
                    type="number" value={addForm.minStock}
                    onChange={(e) => setAddForm({ ...addForm, minStock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₱)</label>
                  <input
                    type="number" step="0.01" value={addForm.costPerUnit}
                    onChange={(e) => setAddForm({ ...addForm, costPerUnit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                onClick={addIngredient}
                disabled={!addForm.name.trim()}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Add Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {!showLogs ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cost/Unit</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ingredients.map((ing) => {
                const isLow = ing.currentStock <= ing.minStock;
                const percentage = Math.min((ing.currentStock / (ing.minStock * 3)) * 100, 100);
                const isEditing = editingId === ing.id;

                return (
                  <tr key={ing.id} className={isLow ? "bg-red-50" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full" />
                      ) : (
                        <span className="font-medium text-gray-800">{ing.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                          className="px-2 py-1 border rounded text-sm">
                          <option value="ml">ml</option>
                          <option value="gram">gram</option>
                          <option value="piece">piece</option>
                          <option value="liter">liter</option>
                          <option value="kg">kg</option>
                        </select>
                      ) : (
                        <span className="text-gray-500">{ing.unit}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${isLow ? "bg-red-500" : "bg-green-500"}`}
                            style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="font-medium">{ing.currentStock.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <input type="number" value={editForm.minStock}
                          onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-20 text-right" />
                      ) : (
                        <span className="text-gray-500">{ing.minStock.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isLow ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <input type="number" step="0.01" value={editForm.costPerUnit}
                          onChange={(e) => setEditForm({ ...editForm, costPerUnit: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-20 text-right" />
                      ) : (
                        <span className="text-gray-500">₱{ing.costPerUnit.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit}
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : showRestock === ing.id ? (
                          <div className="flex items-center gap-1">
                            <input type="number" value={restockAmount}
                              onChange={(e) => setRestockAmount(e.target.value)}
                              placeholder="Qty" className="w-20 px-2 py-1 border rounded text-sm" autoFocus />
                            <button onClick={() => handleRestock(ing.id)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Add</button>
                            <button onClick={() => { setShowRestock(null); setRestockAmount(""); }}
                              className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => startEdit(ing)}
                              className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowRestock(ing.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-lg hover:bg-amber-200">
                              <Plus className="w-3 h-3" /> Restock
                            </button>
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
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedIngredient(null)}
              className={`px-3 py-1 rounded-full text-sm ${!selectedIngredient ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              All
            </button>
            {ingredients.map((ing) => (
              <button key={ing.id} onClick={() => setSelectedIngredient(ing.id)}
                className={`px-3 py-1 rounded-full text-sm ${selectedIngredient === ing.id ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {ing.name}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">{log.ingredient.name}</td>
                    <td className="px-6 py-3 text-center">
                      {log.type === "out" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          <ArrowDownCircle className="w-3 h-3" /> Used
                        </span>
                      ) : log.type === "in" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <ArrowUpCircle className="w-3 h-3" /> Restock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Adjust</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-medium">
                      {log.type === "out" ? "-" : "+"}{log.quantity} {log.ingredient.unit}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{log.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
