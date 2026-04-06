import Sidebar from "@/components/Sidebar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0">{children}</main>
    </div>
  );
}
