"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coffee,
  ShoppingCart,
  Package,
  ClipboardList,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "POS", icon: ShoppingCart },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/menu", label: "Menu & Recipes", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-amber-900/95 backdrop-blur-xl text-white flex items-center px-4 z-50 pt-[env(safe-area-inset-top)] h-[calc(3.5rem+env(safe-area-inset-top))]">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <Coffee className="w-5 h-5" />
          <span className="font-bold">BrewPOS</span>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-[260px] bg-amber-900/95 backdrop-blur-xl text-white flex flex-col z-50 transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div className="px-5 py-6 border-b border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-[12px] flex items-center justify-center shadow-sm">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight">BrewPOS</h1>
              <p className="text-[11px] text-amber-300/80 tracking-wide">Coffee Shop POS</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-amber-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] transition-all ${
                  isActive
                    ? "bg-white/15 text-white font-semibold"
                    : "text-amber-100/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-amber-800/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] text-amber-300/70 hover:bg-white/10 hover:text-white w-full transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
