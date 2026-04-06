"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle,
  AlertCircle,
  X,
  Search,
} from "lucide-react";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
}

interface RecipeItem {
  id: number;
  ingredientId: number;
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
  category: { id: number; name: string; icon: string };
  variants: ProductVariant[];
}

interface Category {
  id: number;
  name: string;
  icon: string;
  _count: { products: number };
}

interface CartItem {
  productVariantId: number;
  productName: string;
  size: string;
  price: number;
  quantity: number;
}

interface OrderResult {
  orderNumber: string;
  customerName: string;
  total: number;
  items: { productName: string; size: string; quantity: number; total: number }[];
  paymentMethod?: string;
  cashTendered?: number;
  change?: number;
}

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Customer & payment state
  const [customerName, setCustomerName] = useState("");
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [cashTendered, setCashTendered] = useState("");
  const [showMobileCart, setShowMobileCart] = useState(false);

  const fetchData = useCallback(async () => {
    const [catRes, prodRes] = await Promise.all([
      fetch("/api/categories"),
      fetch(`/api/products${selectedCategory ? `?categoryId=${selectedCategory}` : ""}`),
    ]);
    setCategories(await catRes.json());
    setProducts(await prodRes.json());
  }, [selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter products by search
  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.name.toLowerCase().includes(q)
    );
  });

  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productVariantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.productVariantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productVariantId: variant.id,
          productName: product.name,
          size: variant.size,
          price: variant.price,
          quantity: 1,
        },
      ];
    });
    setSelectedProduct(null);
  };

  const updateQuantity = (variantId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productVariantId === variantId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (variantId: number) => {
    setCart((prev) => prev.filter((i) => i.productVariantId !== variantId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal;

  const cashTenderedNum = parseFloat(cashTendered) || 0;
  const change = cashTenderedNum - total;

  const placeOrder = async (paymentMethod: string) => {
    if (cart.length === 0) return;

    // For cash, validate tendered amount
    if (paymentMethod === "cash" && cashTenderedNum < total) {
      setError("Cash tendered is less than the total amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, paymentMethod, customerName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place order");
        return;
      }

      setOrderResult({
        ...data,
        paymentMethod,
        cashTendered: paymentMethod === "cash" ? cashTenderedNum : undefined,
        change: paymentMethod === "cash" ? change : undefined,
      });
      setCart([]);
      setCustomerName("");
      setShowPayment(null);
      setCashTendered("");
      fetchData();
    } catch {
      setError("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickCashAmounts = [50, 100, 200, 500, 1000];

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-gray-800">Point of Sale</h1>
              <p className="text-sm text-gray-500">Select items to add to the order</p>
            </div>
            {/* Search */}
            <div className="relative flex-1 lg:flex-none lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200/50 px-3 lg:px-6 py-2 lg:py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white/70 text-[#6e6e73] hover:bg-white hover:text-[#1d1d1f]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white/70 text-[#6e6e73] hover:bg-white hover:text-[#1d1d1f]"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-6 pb-20 lg:pb-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products found for &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-3 lg:p-4 text-left hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:scale-[1.02] transition-all duration-300 group"
                >
                  <div className="w-full h-16 lg:h-24 bg-amber-50/60 rounded-xl flex items-center justify-center mb-2 lg:mb-3 group-hover:bg-amber-100/60 transition-colors">
                    <span className="text-2xl lg:text-3xl">{product.category.icon}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-base">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {product.variants.map((v) => (
                      <span
                        key={v.id}
                        className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded"
                      >
                        {v.size[0]} - ₱{v.price}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile cart button */}
      <button
        onClick={() => setShowMobileCart(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-amber-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="font-bold">Cart ({cartCount})</span>
        {cartCount > 0 && <span className="font-bold">₱{total.toFixed(0)}</span>}
      </button>

      {/* Cart overlay for mobile */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileCart(false)} />
      )}

      {/* Right: Cart */}
      <div className={`fixed lg:static inset-y-0 right-0 w-full sm:w-96 bg-white/90 backdrop-blur-xl border-l border-gray-200/50 flex flex-col z-50 transition-transform duration-300 ${
        showMobileCart ? "translate-x-0" : "translate-x-full"
      } lg:translate-x-0 lg:w-96`}>
        <div className="p-4 border-b bg-amber-50 space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-700" />
            <h2 className="font-bold text-amber-900">Current Order</h2>
            <span className="ml-auto bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
              {cartCount} items
            </span>
            <button onClick={() => setShowMobileCart(false)} className="lg:hidden p-1 text-amber-700 hover:text-amber-900">
              <X className="w-5 h-5" />
            </button>
          </div>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer Name"
            className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items in order</p>
              <p className="text-sm">Click a product to add it</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productVariantId}
                className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">
                    {item.size} - ₱{item.price}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productVariantId, -1)}
                    className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productVariantId, 1)}
                    className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-semibold w-16 text-right">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeFromCart(item.productVariantId)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Payment */}
        <div className="border-t p-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setShowPayment("cash"); setError(""); }}
              disabled={cart.length === 0 || loading}
              className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Banknote className="w-5 h-5" />
              Cash
            </button>
            <button
              onClick={() => { setShowPayment("card"); setError(""); }}
              disabled={cart.length === 0 || loading}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Card
            </button>
          </div>
        </div>
      </div>

      {/* Size Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[420px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedProduct.description}</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Select Size</p>
              {selectedProduct.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => addToCart(selectedProduct, variant)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{variant.size}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {variant.recipe.map((r) => (
                        <span key={r.id} className="text-xs text-gray-500">
                          {r.ingredient.name}: {r.quantity}
                          {r.ingredient.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-lg font-bold text-amber-700">₱{variant.price}</p>
                    <Plus className="w-5 h-5 text-amber-600 ml-auto" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[420px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {showPayment === "cash" ? "Cash Payment" : "Card Payment"}
              </h3>
              <button
                onClick={() => { setShowPayment(null); setCashTendered(""); setError(""); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer name display */}
            {customerName && (
              <p className="text-sm mb-3 text-amber-700 font-medium bg-amber-50 px-3 py-2 rounded-lg">
                Customer: {customerName}
              </p>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {cart.map((item) => (
                <div key={item.productVariantId} className="flex justify-between text-sm py-1">
                  <span>{item.quantity}x {item.productName} ({item.size})</span>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span><span>₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {showPayment === "cash" && (
              <>
                {/* Cash Tendered Input */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cash Tendered</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border-2 rounded-lg text-lg font-bold text-right focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button
                    onClick={() => setCashTendered(Math.ceil(total).toString())}
                    className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200"
                  >
                    Exact
                  </button>
                  {quickCashAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashTendered(amt.toString())}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        amt >= total
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      ₱{amt}
                    </button>
                  ))}
                </div>

                {/* Change Display */}
                {cashTenderedNum > 0 && (
                  <div className={`rounded-lg p-4 mb-4 text-center ${
                    change >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}>
                    <p className="text-sm text-gray-500">Change</p>
                    <p className={`text-3xl font-bold ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ₱{change.toFixed(2)}
                    </p>
                    {change < 0 && (
                      <p className="text-xs text-red-500 mt-1">Insufficient amount</p>
                    )}
                  </div>
                )}
              </>
            )}

            {showPayment === "card" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center">
                <CreditCard className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Process card payment of</p>
                <p className="text-2xl font-bold text-blue-700">₱{total.toFixed(2)}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={() => placeOrder(showPayment)}
              disabled={loading || (showPayment === "cash" && cashTenderedNum < total)}
              className={`w-full py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                showPayment === "cash"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Processing..." : `Confirm ${showPayment === "cash" ? "Cash" : "Card"} Payment`}
            </button>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderResult && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Order Placed!</h3>
            <p className="text-gray-500 mt-1">{orderResult.orderNumber}</p>
            {orderResult.customerName && (
              <p className="text-sm font-medium text-amber-700 mt-1">Customer: {orderResult.customerName}</p>
            )}

            <div className="mt-4 bg-gray-50 rounded-lg p-4 text-left">
              {orderResult.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>
                    {item.quantity}x {item.productName} ({item.size})
                  </span>
                  <span className="font-medium">₱{item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>₱{orderResult.total.toFixed(2)}</span>
              </div>
              {orderResult.cashTendered !== undefined && (
                <>
                  <div className="flex justify-between text-sm mt-1 text-gray-500">
                    <span>Cash Tendered</span>
                    <span>₱{orderResult.cashTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-green-600">
                    <span>Change</span>
                    <span>₱{(orderResult.change ?? 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-green-600 mt-3">
              Ingredients have been automatically deducted from inventory
            </p>

            <button
              onClick={() => setOrderResult(null)}
              className="mt-4 w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
