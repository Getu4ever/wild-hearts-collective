import { sendLowStockAlertEmail } from "@/lib/email";

export type LowStockAlertPayload = {
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  lowStockThreshold: number;
};

export function shouldSendLowStockAlert(
  previousStock: number,
  newStock: number,
  lowStockThreshold: number,
) {
  if (newStock > lowStockThreshold) return false;
  if (previousStock <= lowStockThreshold && newStock > 0) return false;
  if (previousStock === 0 && newStock === 0) return false;

  return (
    (previousStock > lowStockThreshold && newStock <= lowStockThreshold) ||
    (newStock === 0 && previousStock > 0)
  );
}

export function buildLowStockAlertPayload(input: {
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  lowStockThreshold: number;
  trackStock: boolean;
}): LowStockAlertPayload | null {
  if (!input.trackStock) return null;
  if (
    !shouldSendLowStockAlert(
      input.previousStock,
      input.newStock,
      input.lowStockThreshold,
    )
  ) {
    return null;
  }

  return {
    productId: input.productId,
    productName: input.productName,
    previousStock: input.previousStock,
    newStock: input.newStock,
    lowStockThreshold: input.lowStockThreshold,
  };
}

export async function notifyAdminOfLowStockIfNeeded(
  input: Parameters<typeof buildLowStockAlertPayload>[0],
) {
  const payload = buildLowStockAlertPayload(input);
  if (!payload) return;

  try {
    const status = payload.newStock <= 0 ? "out" : "low";

    await sendLowStockAlertEmail({
      productId: payload.productId,
      productName: payload.productName,
      stockQuantity: payload.newStock,
      lowStockThreshold: payload.lowStockThreshold,
      previousStock: payload.previousStock,
      status,
    });
  } catch (error) {
    console.error("[shop-stock-notify]", payload.productId, error);
  }
}

export async function notifyAdminOfLowStockBatch(
  payloads: Array<Parameters<typeof buildLowStockAlertPayload>[0]>,
) {
  for (const payload of payloads) {
    await notifyAdminOfLowStockIfNeeded(payload);
  }
}
