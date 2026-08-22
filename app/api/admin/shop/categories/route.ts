import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  countProductsInCategory,
  getOrSeedShopCategories,
  saveShopCategories,
} from "@/lib/shop-categories-service";
import { revalidateShopCatalogPages } from "@/lib/revalidate-public-pages";

export async function GET() {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.shop);
  if (!admin.authed) return admin.response;

  try {
    const result = await getOrSeedShopCategories();
    const categories = await Promise.all(
      result.categories.map(async (category) => ({
        ...category,
        productCount: await countProductsInCategory(category.id),
      })),
    );
    return NextResponse.json({ categories, source: result.source });
  } catch (error) {
    console.error("Failed to load shop categories:", error);
    return NextResponse.json(
      { error: "Unable to load categories." },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.shop);
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const raw = Array.isArray(body) ? body : body?.categories;
    const saved = await saveShopCategories(raw);
    revalidateShopCatalogPages();
    const categories = await Promise.all(
      saved.map(async (category) => ({
        ...category,
        productCount: await countProductsInCategory(category.id),
      })),
    );
    return NextResponse.json({ categories });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save categories.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
