import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear all data
  await prisma.stockLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  // ==================== SUPER ADMIN ====================
  const hashedPassword = await bcrypt.hash("Qwerty2026@$", 12);
  await prisma.user.create({
    data: {
      email: "jhomarksalvador@gmail.com",
      password: hashedPassword,
      name: "Jhomark Salvador",
      role: "superadmin",
      storeId: null,
    },
  });

  // ==================== DEMO STORE ====================
  const store = await prisma.store.create({
    data: {
      name: "BrewHaus Coffee",
      address: "123 Coffee Street, Manila",
      phone: "+63 912 345 6789",
      email: "brewhaus@demo.com",
    },
  });

  // Subscription (active for 30 days)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  await prisma.subscription.create({
    data: {
      storeId: store.id,
      plan: "monthly",
      status: "active",
      endDate,
      amount: 999,
    },
  });

  // Store owner
  const ownerPass = await bcrypt.hash("owner123", 12);
  await prisma.user.create({
    data: {
      email: "owner@brewhaus.com",
      password: ownerPass,
      name: "Demo Owner",
      role: "owner",
      storeId: store.id,
    },
  });

  // Staff
  const staffPass = await bcrypt.hash("staff123", 12);
  await prisma.user.create({
    data: {
      email: "staff@brewhaus.com",
      password: staffPass,
      name: "Demo Staff",
      role: "staff",
      storeId: store.id,
    },
  });

  // ==================== INGREDIENTS ====================
  const sid = store.id;
  const espresso = await prisma.ingredient.create({ data: { name: "Espresso Coffee", unit: "gram", currentStock: 5000, minStock: 500, costPerUnit: 0.5, storeId: sid } });
  const milk = await prisma.ingredient.create({ data: { name: "Fresh Milk", unit: "ml", currentStock: 20000, minStock: 2000, costPerUnit: 0.05, storeId: sid } });
  const water = await prisma.ingredient.create({ data: { name: "Water", unit: "ml", currentStock: 50000, minStock: 5000, costPerUnit: 0.01, storeId: sid } });
  const sugar = await prisma.ingredient.create({ data: { name: "Sugar", unit: "gram", currentStock: 10000, minStock: 1000, costPerUnit: 0.02, storeId: sid } });
  const whippedCream = await prisma.ingredient.create({ data: { name: "Whipped Cream", unit: "ml", currentStock: 5000, minStock: 500, costPerUnit: 0.1, storeId: sid } });
  const chocolate = await prisma.ingredient.create({ data: { name: "Chocolate Syrup", unit: "ml", currentStock: 3000, minStock: 300, costPerUnit: 0.15, storeId: sid } });
  const vanilla = await prisma.ingredient.create({ data: { name: "Vanilla Syrup", unit: "ml", currentStock: 3000, minStock: 300, costPerUnit: 0.12, storeId: sid } });
  const caramel = await prisma.ingredient.create({ data: { name: "Caramel Syrup", unit: "ml", currentStock: 3000, minStock: 300, costPerUnit: 0.13, storeId: sid } });
  const ice = await prisma.ingredient.create({ data: { name: "Ice", unit: "gram", currentStock: 30000, minStock: 3000, costPerUnit: 0.01, storeId: sid } });
  const matcha = await prisma.ingredient.create({ data: { name: "Matcha Powder", unit: "gram", currentStock: 2000, minStock: 200, costPerUnit: 0.8, storeId: sid } });
  const teaBag = await prisma.ingredient.create({ data: { name: "Tea Bag", unit: "piece", currentStock: 500, minStock: 50, costPerUnit: 0.3, storeId: sid } });
  const cup = await prisma.ingredient.create({ data: { name: "Paper Cup", unit: "piece", currentStock: 1000, minStock: 100, costPerUnit: 0.15, storeId: sid } });
  const lid = await prisma.ingredient.create({ data: { name: "Cup Lid", unit: "piece", currentStock: 1000, minStock: 100, costPerUnit: 0.05, storeId: sid } });

  // ==================== CATEGORIES ====================
  const hotCoffee = await prisma.category.create({ data: { name: "Hot Coffee", icon: "☕", storeId: sid } });
  const icedCoffee = await prisma.category.create({ data: { name: "Iced Coffee", icon: "🧊", storeId: sid } });
  const nonCoffee = await prisma.category.create({ data: { name: "Non-Coffee", icon: "🍵", storeId: sid } });
  const frappe = await prisma.category.create({ data: { name: "Frappe", icon: "🥤", storeId: sid } });

  // ==================== PRODUCTS WITH RECIPES ====================
  async function createProductWithRecipe(
    name: string, desc: string, catId: number,
    variants: { size: string; price: number; ingredients: { id: number; qty: number }[] }[]
  ) {
    const product = await prisma.product.create({
      data: {
        name, description: desc, categoryId: catId, storeId: sid,
        variants: { create: variants.map((v) => ({ size: v.size, price: v.price })) },
      },
      include: { variants: true },
    });
    for (const variant of product.variants) {
      const input = variants.find((v) => v.size === variant.size);
      if (input) {
        await prisma.recipeItem.createMany({
          data: input.ingredients.map((ing) => ({
            productVariantId: variant.id, ingredientId: ing.id, quantity: ing.qty,
          })),
        });
      }
    }
  }

  const sizes = (base: { id: number; qty: number }[]) => {
    return {
      small: base.map((b) => ({ id: b.id, qty: Math.round(b.qty * 0.75) || 1 })),
      medium: base.map((b) => ({ id: b.id, qty: b.qty })),
      large: base.map((b) => ({ id: b.id, qty: Math.round(b.qty * 1.25) || 1 })),
    };
  };

  // Hot Coffee
  const latteBase = [{ id: espresso.id, qty: 18 }, { id: milk.id, qty: 150 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const ls = sizes(latteBase);
  await createProductWithRecipe("Cafe Latte", "Espresso with steamed milk", hotCoffee.id, [
    { size: "Small", price: 120, ingredients: ls.small }, { size: "Medium", price: 150, ingredients: ls.medium }, { size: "Large", price: 180, ingredients: ls.large },
  ]);

  const cappBase = [{ id: espresso.id, qty: 18 }, { id: milk.id, qty: 120 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const cs = sizes(cappBase);
  await createProductWithRecipe("Cappuccino", "Espresso with steamed milk foam", hotCoffee.id, [
    { size: "Small", price: 120, ingredients: cs.small }, { size: "Medium", price: 150, ingredients: cs.medium }, { size: "Large", price: 180, ingredients: cs.large },
  ]);

  const amBase = [{ id: espresso.id, qty: 18 }, { id: water.id, qty: 200 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const as2 = sizes(amBase);
  await createProductWithRecipe("Americano", "Espresso with hot water", hotCoffee.id, [
    { size: "Small", price: 100, ingredients: as2.small }, { size: "Medium", price: 130, ingredients: as2.medium }, { size: "Large", price: 160, ingredients: as2.large },
  ]);

  const mochaBase = [{ id: espresso.id, qty: 18 }, { id: milk.id, qty: 120 }, { id: chocolate.id, qty: 30 }, { id: whippedCream.id, qty: 20 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const ms = sizes(mochaBase);
  await createProductWithRecipe("Cafe Mocha", "Espresso with chocolate and steamed milk", hotCoffee.id, [
    { size: "Small", price: 140, ingredients: ms.small }, { size: "Medium", price: 170, ingredients: ms.medium }, { size: "Large", price: 200, ingredients: ms.large },
  ]);

  // Iced Coffee
  const iLatteBase = [{ id: espresso.id, qty: 18 }, { id: milk.id, qty: 150 }, { id: ice.id, qty: 100 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const ils = sizes(iLatteBase);
  await createProductWithRecipe("Iced Latte", "Espresso with cold milk over ice", icedCoffee.id, [
    { size: "Small", price: 130, ingredients: ils.small }, { size: "Medium", price: 160, ingredients: ils.medium }, { size: "Large", price: 190, ingredients: ils.large },
  ]);

  const iAmBase = [{ id: espresso.id, qty: 18 }, { id: water.id, qty: 180 }, { id: ice.id, qty: 120 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const ias = sizes(iAmBase);
  await createProductWithRecipe("Iced Americano", "Espresso with cold water over ice", icedCoffee.id, [
    { size: "Small", price: 110, ingredients: ias.small }, { size: "Medium", price: 140, ingredients: ias.medium }, { size: "Large", price: 170, ingredients: ias.large },
  ]);

  const icmBase = [{ id: espresso.id, qty: 18 }, { id: milk.id, qty: 150 }, { id: vanilla.id, qty: 15 }, { id: caramel.id, qty: 15 }, { id: ice.id, qty: 100 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const icms = sizes(icmBase);
  await createProductWithRecipe("Iced Caramel Macchiato", "Vanilla, milk, espresso and caramel drizzle", icedCoffee.id, [
    { size: "Small", price: 150, ingredients: icms.small }, { size: "Medium", price: 180, ingredients: icms.medium }, { size: "Large", price: 210, ingredients: icms.large },
  ]);

  // Non-Coffee
  const matchaBase = [{ id: matcha.id, qty: 5 }, { id: milk.id, qty: 200 }, { id: sugar.id, qty: 10 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const mts = sizes(matchaBase);
  await createProductWithRecipe("Matcha Latte", "Japanese matcha with steamed milk", nonCoffee.id, [
    { size: "Small", price: 140, ingredients: mts.small }, { size: "Medium", price: 170, ingredients: mts.medium }, { size: "Large", price: 200, ingredients: mts.large },
  ]);

  const hcBase = [{ id: chocolate.id, qty: 40 }, { id: milk.id, qty: 200 }, { id: whippedCream.id, qty: 30 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const hcs = sizes(hcBase);
  await createProductWithRecipe("Hot Chocolate", "Rich chocolate with steamed milk", nonCoffee.id, [
    { size: "Small", price: 130, ingredients: hcs.small }, { size: "Medium", price: 160, ingredients: hcs.medium }, { size: "Large", price: 190, ingredients: hcs.large },
  ]);

  const chaiBase = [{ id: teaBag.id, qty: 1 }, { id: milk.id, qty: 150 }, { id: water.id, qty: 100 }, { id: sugar.id, qty: 10 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const chs = sizes(chaiBase);
  await createProductWithRecipe("Chai Tea Latte", "Spiced tea with steamed milk", nonCoffee.id, [
    { size: "Small", price: 120, ingredients: chs.small }, { size: "Medium", price: 150, ingredients: chs.medium }, { size: "Large", price: 180, ingredients: chs.large },
  ]);

  // Frappe
  const jcBase = [{ id: espresso.id, qty: 18 }, { id: milk.id, qty: 150 }, { id: chocolate.id, qty: 30 }, { id: ice.id, qty: 150 }, { id: whippedCream.id, qty: 30 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const jcs = sizes(jcBase);
  await createProductWithRecipe("Java Chip Frappe", "Blended coffee with chocolate chips", frappe.id, [
    { size: "Small", price: 160, ingredients: jcs.small }, { size: "Medium", price: 190, ingredients: jcs.medium }, { size: "Large", price: 220, ingredients: jcs.large },
  ]);

  const cfBase = [{ id: espresso.id, qty: 18 }, { id: milk.id, qty: 150 }, { id: caramel.id, qty: 30 }, { id: ice.id, qty: 150 }, { id: whippedCream.id, qty: 30 }, { id: cup.id, qty: 1 }, { id: lid.id, qty: 1 }];
  const cfs = sizes(cfBase);
  await createProductWithRecipe("Caramel Frappe", "Blended coffee with caramel", frappe.id, [
    { size: "Small", price: 160, ingredients: cfs.small }, { size: "Medium", price: 190, ingredients: cfs.medium }, { size: "Large", price: 220, ingredients: cfs.large },
  ]);

  console.log("Seed completed!");
  console.log("Super Admin: jhomarksalvador@gmail.com / Qwerty2026@$");
  console.log("Store Owner: owner@brewhaus.com / owner123");
  console.log("Staff: staff@brewhaus.com / staff123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
