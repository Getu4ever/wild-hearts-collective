import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  createAdminShopProduct,
  listAdminShopProducts,
} from "@/lib/shop-catalog-service";
import type { ShopCategoryId } from "@/lib/shop-data";
import { SHOP_CATEGORIES } from "@/lib/shop-data";

function parseVariants(body: Record<string, unknown>) {
  const sizes =
    typeof body.sizes === "string"
      ? body.sizes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;
  const colours =
    typeof body.colours === "string"
      ? body.colours
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;

  if (!sizes?.length && !colours?.length) return null;
  return { sizes, colours };
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const url = new URL(request.url);
  const includeArchived = url.searchParams.get("archived") === "1";

  try {
    const products = await listAdminShopProducts({ includeArchived });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to load shop products:", error);
    return NextResponse.json({ error: "Unable to load products." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const category = typeof body.category === "string" ? body.category : "";
    if (!(category in SHOP_CATEGORIES)) {
      return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
    }

    const pricePounds =
      typeof body.pricePounds === "number"
        ? body.pricePounds
        : Number.parseFloat(String(body.pricePounds ?? ""));

    const product = await createAdminShopProduct({
      name: typeof body.name === "string" ? body.name : "",
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: typeof body.description === "string" ? body.description : "",
      category: category as ShopCategoryId,
      pricePence: Math.round(pricePounds * 100),
      isAvailable: Boolean(body.isAvailable),
      digitalDelivery: Boolean(body.digitalDelivery),
      image: typeof body.image === "string" ? body.image : "",
      imageGradient:
        typeof body.imageGradient === "string" ? body.imageGradient : undefined,
      variants: parseVariants(body),
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
