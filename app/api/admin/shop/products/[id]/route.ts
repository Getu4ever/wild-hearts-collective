import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  archiveAdminShopProduct,
  deleteAdminShopProduct,
  getShopProductById,
  restoreAdminShopProduct,
  updateAdminShopProduct,
} from "@/lib/shop-catalog-service";
import type { ShopCategoryId } from "@/lib/shop-data";
import { SHOP_CATEGORIES } from "@/lib/shop-data";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const product = await getShopProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to load shop product:", error);
    return NextResponse.json({ error: "Unable to load product." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const payload: Parameters<typeof updateAdminShopProduct>[1] = {};

    if (typeof body.name === "string") payload.name = body.name;
    if (typeof body.slug === "string") payload.slug = body.slug;
    if (typeof body.description === "string") payload.description = body.description;
    if (typeof body.category === "string") {
      if (!(body.category in SHOP_CATEGORIES)) {
        return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
      }
      payload.category = body.category as ShopCategoryId;
    }
    if (body.pricePounds != null) {
      const pricePounds =
        typeof body.pricePounds === "number"
          ? body.pricePounds
          : Number.parseFloat(String(body.pricePounds));
      payload.pricePence = Math.round(pricePounds * 100);
    }
    if (typeof body.isAvailable === "boolean") payload.isAvailable = body.isAvailable;
    if (typeof body.digitalDelivery === "boolean") {
      payload.digitalDelivery = body.digitalDelivery;
    }
    if (typeof body.image === "string") payload.image = body.image;
    if (typeof body.imageGradient === "string") payload.imageGradient = body.imageGradient;
    if ("sizes" in body || "colours" in body) payload.variants = parseVariants(body);
    if (typeof body.isArchived === "boolean") payload.isArchived = body.isArchived;

    const product = await updateAdminShopProduct(id, payload);
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;
  const url = new URL(request.url);
  const permanent = url.searchParams.get("permanent") === "1";

  try {
    if (permanent) {
      await deleteAdminShopProduct(id);
      return NextResponse.json({ deleted: true });
    }

    const product = await archiveAdminShopProduct(id);
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    if (body.action === "restore") {
      const product = await restoreAdminShopProduct(id);
      return NextResponse.json({ product });
    }
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to restore product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
