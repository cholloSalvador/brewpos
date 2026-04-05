import { prisma } from "@/lib/prisma";
import { getStoreIdFromAuth } from "@/lib/store-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const storeId = await getStoreIdFromAuth();
    const period = req.nextUrl.searchParams.get("period") || "daily";

    const now = new Date();
    let startDate: Date;
    let groupFormat: string;

    switch (period) {
      case "weekly": startDate = new Date(now); startDate.setDate(now.getDate() - 7 * 12); groupFormat = "week"; break;
      case "monthly": startDate = new Date(now); startDate.setMonth(now.getMonth() - 12); groupFormat = "month"; break;
      default: startDate = new Date(now); startDate.setDate(now.getDate() - 30); groupFormat = "day"; break;
    }
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { storeId, createdAt: { gte: startDate }, status: "completed" },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });

    const salesByPeriod: Record<string, { date: string; orders: number; revenue: number; tax: number }> = {};
    for (const order of orders) {
      const d = new Date(order.createdAt);
      let key: string, label: string;
      if (groupFormat === "day") { key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; label = key; }
      else if (groupFormat === "week") { const mon = new Date(d); const day = mon.getDay(); mon.setDate(mon.getDate() - day + (day === 0 ? -6 : 1)); key = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`; label = `Week of ${key}`; }
      else { key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; label = key; }
      if (!salesByPeriod[key]) salesByPeriod[key] = { date: label, orders: 0, revenue: 0, tax: 0 };
      salesByPeriod[key].orders += 1; salesByPeriod[key].revenue += order.total; salesByPeriod[key].tax += order.tax;
    }

    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const sizeSales: Record<string, { size: string; quantity: number; revenue: number }> = {};
    const paymentBreakdown: Record<string, { method: string; count: number; total: number }> = {};
    const hourlySales: Record<number, { hour: number; orders: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) hourlySales[h] = { hour: h, orders: 0, revenue: 0 };

    for (const order of orders) {
      for (const item of order.items) {
        if (!productSales[item.productName]) productSales[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
        productSales[item.productName].quantity += item.quantity; productSales[item.productName].revenue += item.total;
        if (!sizeSales[item.size]) sizeSales[item.size] = { size: item.size, quantity: 0, revenue: 0 };
        sizeSales[item.size].quantity += item.quantity; sizeSales[item.size].revenue += item.total;
      }
      const m = order.paymentMethod;
      if (!paymentBreakdown[m]) paymentBreakdown[m] = { method: m, count: 0, total: 0 };
      paymentBreakdown[m].count += 1; paymentBreakdown[m].total += order.total;
      const h = new Date(order.createdAt).getHours();
      hourlySales[h].orders += 1; hourlySales[h].revenue += order.total;
    }

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalTax = orders.reduce((s, o) => s + o.tax, 0);
    const totalOrders = orders.length;
    const totalItemsSold = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= todayStart);

    const stockLogs = await prisma.stockLog.findMany({ where: { storeId, type: "out", createdAt: { gte: startDate } }, include: { ingredient: true } });
    const ingredientUsage: Record<string, { name: string; unit: string; totalUsed: number; estimatedCost: number }> = {};
    for (const log of stockLogs) {
      if (!ingredientUsage[log.ingredient.name]) ingredientUsage[log.ingredient.name] = { name: log.ingredient.name, unit: log.ingredient.unit, totalUsed: 0, estimatedCost: 0 };
      ingredientUsage[log.ingredient.name].totalUsed += log.quantity;
      ingredientUsage[log.ingredient.name].estimatedCost += log.quantity * log.ingredient.costPerUnit;
    }

    const totalIngredientCost = Object.values(ingredientUsage).reduce((s, i) => s + i.estimatedCost, 0);
    const estimatedProfit = totalRevenue - totalTax - totalIngredientCost;
    const lowStock = await prisma.ingredient.findMany({ where: { storeId } }).then((ings) => ings.filter((i) => i.currentStock <= i.minStock));

    return NextResponse.json({
      period,
      summary: { totalRevenue, totalTax, totalOrders, totalItemsSold, avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0, todayRevenue: todayOrders.reduce((s, o) => s + o.total, 0), todayOrders: todayOrders.length, totalIngredientCost, estimatedProfit, profitMargin: totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0 },
      salesTimeline: Object.values(salesByPeriod),
      topProducts: Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      sizeSales: Object.values(sizeSales).sort((a, b) => b.revenue - a.revenue),
      paymentBreakdown: Object.values(paymentBreakdown),
      hourlySales: Object.values(hourlySales),
      topIngredientUsage: Object.values(ingredientUsage).sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, 10),
      lowStockAlerts: lowStock,
    });
  } catch { return NextResponse.json({ period: "daily", summary: {}, salesTimeline: [], topProducts: [], sizeSales: [], paymentBreakdown: [], hourlySales: [], topIngredientUsage: [], lowStockAlerts: [] }); }
}
