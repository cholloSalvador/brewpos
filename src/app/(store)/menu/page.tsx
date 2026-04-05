"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
}

interface RecipeItem {
  id: number;
  quantity: number;
  ingredient: Ingredient;
}

interface ProductVariant {
  id: number;
  size: string;
  price: number;
  recipe: RecipeItem[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  active: boolean;
  category: { id: number; name: string; icon: string };
  variants: ProductVariant[];
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface VariantForm {
  id?: number;
  size: string;
  price: string;
  recipe: { ingredientId: number; quantity: string }[];
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  // Category management state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("");

  // Product form state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategoryId, setFormCategoryId] = useState<number>(0);
  const [formVariants, setFormVariants] = useState<VariantForm[]>([]);

  const fetchData = async () => {
    const [prods, cats, ings] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/ingredients").then((r) => r.json()),
    ]);
    setProducts(prods);
    setCategories(cats);
    setIngredients(ings);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category.id === selectedCategory)
    : products;

  const openAddForm = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDesc("");
    setFormCategoryId(categories[0]?.id || 0);
    setFormVariants([
      { size: "Small", price: "", recipe: [] },
      { size: "Medium", price: "", recipe: [] },
      { size: "Large", price: "", recipe: [] },
    ]);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description);
    setFormCategoryId(product.category.id);
    setFormVariants(
      product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        price: v.price.toString(),
        recipe: v.recipe.map((r) => ({
          ingredientId: r.ingredient.id,
          quantity: r.quantity.toString(),
        })),
      }))
    );
    setShowForm(true);
  };

  const addRecipeToVariant = (variantIndex: number) => {
    const updated = [...formVariants];
    updated[variantIndex].recipe.push({ ingredientId: ingredients[0]?.id || 0, quantity: "" });
    setFormVariants(updated);
  };

  const removeRecipeFromVariant = (variantIndex: number, recipeIndex: number) => {
    const updated = [...formVariants];
    updated[variantIndex].recipe.splice(recipeIndex, 1);
    setFormVariants(updated);
  };

  const updateRecipe = (variantIndex: number, recipeIndex: number, field: "ingredientId" | "quantity", value: string) => {
    const updated = [...formVariants];
    if (field === "ingredientId") {
      updated[variantIndex].recipe[recipeIndex].ingredientId = parseInt(value);
    } else {
      updated[variantIndex].recipe[recipeIndex].quantity = value;
    }
    setFormVariants(updated);
  };

  const addVariant = () => {
    setFormVariants([...formVariants, { size: "", price: "", recipe: [] }]);
  };

  const removeVariant = (index: number) => {
    setFormVariants(formVariants.filter((_, i) => i !== index));
  };

  const saveProduct = async () => {
    if (!formName.trim() || !formCategoryId) return;

    const variants = formVariants
      .filter((v) => v.size && v.price)
      .map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        size: v.size,
        price: parseFloat(v.price),
        recipe: v.recipe
          .filter((r) => r.ingredientId && r.quantity)
          .map((r) => ({
            ingredientId: r.ingredientId,
            quantity: parseFloat(r.quantity),
          })),
      }));

    if (editingProduct) {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDesc, categoryId: formCategoryId, variants }),
      });
    } else {
      await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDesc, categoryId: formCategoryId, variants }),
      });
    }

    setShowForm(false);
    fetchData();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchData();
  };

  // Category CRUD
  const openAddCategory = () => {
    setEditingCategoryId(null);
    setCatName("");
    setCatIcon("🍽️");
    setShowCategoryForm(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setShowCategoryForm(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) return;
    if (editingCategoryId) {
      await fetch(`/api/categories/${editingCategoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, icon: catIcon }),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, icon: catIcon }),
      });
    }
    setShowCategoryForm(false);
    fetchData();
  };

  const deleteCategory = async (id: number) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete category");
      return;
    }
    if (selectedCategory === id) setSelectedCategory(null);
    fetchData();
  };

  const emojiOptions = ["☕", "🧊", "🍵", "🥤", "🍞", "🥪", "🍕", "🍔", "🥗", "🍰", "🧁", "🍩", "🥐", "🍳", "🍜", "🍽️", "🥤", "🍦", "🧇", "🥞"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu & Recipes</h1>
          <p className="text-sm text-gray-500">Manage menu items and their ingredient recipes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddCategory}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Categories</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className="group relative">
              <button
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors pr-8 ${
                  selectedCategory === cat.id ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
              <div className="absolute right-0 top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                  className="p-1 text-gray-400 hover:text-blue-600" title="Edit"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                  className="p-1 text-gray-400 hover:text-red-600" title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products with Recipes */}
      <div className="space-y-4">
        {filteredProducts.map((product) => {
          const isExpanded = expandedProduct === product.id;
          return (
            <div key={product.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-center">
                <button
                  onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                  className="flex-1 flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-2xl">
                      {product.category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.description}</p>
                      <div className="flex gap-2 mt-1">
                        {product.variants.map((v) => (
                          <span key={v.id} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                            {v.size}: ₱{v.price}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{product.category.name}</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>
                {/* Edit/Delete buttons */}
                <div className="flex gap-1 pr-4">
                  <button onClick={() => openEditForm(product)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteProduct(product.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t p-5 bg-amber-50/30">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-800">Recipe per Size</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="bg-white rounded-lg border p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-semibold text-gray-800">{variant.size}</h5>
                          <span className="text-amber-700 font-bold">₱{variant.price}</span>
                        </div>
                        <div className="space-y-2">
                          {variant.recipe.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No recipe set</p>
                          ) : (
                            variant.recipe.map((r) => (
                              <div key={r.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                                <span className="text-gray-600">{r.ingredient.name}</span>
                                <span className="font-medium text-gray-800">{r.quantity} {r.ingredient.unit}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[700px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. Cafe Latte"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formCategoryId} onChange={(e) => setFormCategoryId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Short description"
                />
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-gray-700">Sizes & Recipes</label>
                  <button onClick={addVariant}
                    className="flex items-center gap-1 text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    <Plus className="w-3 h-3" /> Add Size
                  </button>
                </div>

                <div className="space-y-4">
                  {formVariants.map((variant, vi) => (
                    <div key={vi} className="border rounded-xl p-4 bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="text" value={variant.size}
                          onChange={(e) => {
                            const u = [...formVariants];
                            u[vi].size = e.target.value;
                            setFormVariants(u);
                          }}
                          className="px-3 py-2 border rounded-lg text-sm font-medium w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Size name"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                          <input
                            type="number" value={variant.price}
                            onChange={(e) => {
                              const u = [...formVariants];
                              u[vi].price = e.target.value;
                              setFormVariants(u);
                            }}
                            className="pl-8 pr-3 py-2 border rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Price"
                          />
                        </div>
                        {formVariants.length > 1 && (
                          <button onClick={() => removeVariant(vi)}
                            className="ml-auto p-1.5 text-red-500 hover:bg-red-100 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Recipe ingredients */}
                      <div className="space-y-2 ml-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Ingredients for this size</p>
                        {variant.recipe.map((r, ri) => (
                          <div key={ri} className="flex items-center gap-2">
                            <select
                              value={r.ingredientId}
                              onChange={(e) => updateRecipe(vi, ri, "ingredientId", e.target.value)}
                              className="flex-1 px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                              ))}
                            </select>
                            <input
                              type="number" value={r.quantity}
                              onChange={(e) => updateRecipe(vi, ri, "quantity", e.target.value)}
                              className="w-24 px-2 py-1.5 border rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                              placeholder="Qty"
                            />
                            <button onClick={() => removeRecipeFromVariant(vi, ri)}
                              className="p-1 text-red-400 hover:text-red-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addRecipeToVariant(vi)}
                          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium mt-1">
                          <Plus className="w-3 h-3" /> Add Ingredient
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={saveProduct}
                disabled={!formName.trim() || !formCategoryId || formVariants.filter(v => v.size && v.price).length === 0}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-5 h-5" />
                {editingProduct ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingCategoryId ? "Edit Category" : "Add New Category"}
              </h3>
              <button onClick={() => setShowCategoryForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text" value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Pastries, Sandwiches, Meals"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setCatIcon(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        catIcon === emoji
                          ? "bg-amber-100 border-2 border-amber-500 scale-110"
                          : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Selected: {catIcon}</p>
              </div>

              <button
                onClick={saveCategory}
                disabled={!catName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-5 h-5" />
                {editingCategoryId ? "Update Category" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
