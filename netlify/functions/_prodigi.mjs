const baseUrl = () => process.env.PRODIGI_ENVIRONMENT === "live" ? "https://api.prodigi.com" : "https://api.sandbox.prodigi.com";

export function isProdigiItem(item) {
  return item.fulfillment_mode === "prodigi";
}

export async function submitProdigiOrder({ order, items, callbackUrl }) {
  if (!process.env.PRODIGI_API_KEY) throw new Error("Prodigi is not configured. Add PRODIGI_API_KEY in Netlify.");
  if (!order.shipping_address?.line1 || !order.shipping_address?.postal_code || !order.shipping_address?.city || !order.shipping_address?.country) throw new Error("A complete shipping address is required for Prodigi.");
  const podItems = items.filter(isProdigiItem);
  if (!podItems.length) return null;
  for (const item of podItems) {
    if (!item.prodigi_sku || !item.prodigi_asset_url) throw new Error(`Prodigi SKU or print asset is missing for ${item.title}`);
  }
  const payload = {
    merchantReference: `HERBZ108-${order.id}`,
    idempotencyKey: `herbz108-${order.id}`,
    shippingMethod: "Standard",
    recipient: {
      name: order.customer_name || order.customer_email || "HERBZ108 customer",
      email: order.customer_email || undefined,
      address: {
        line1: order.shipping_address.line1,
        line2: order.shipping_address.line2 || undefined,
        postalOrZipCode: order.shipping_address.postal_code,
        countryCode: order.shipping_address.country,
        townOrCity: order.shipping_address.city,
        stateOrCounty: order.shipping_address.state || undefined
      }
    },
    items: podItems.map(item => ({
      merchantReference: item.id,
      sku: item.prodigi_sku,
      copies: item.quantity,
      sizing: item.prodigi_sizing || "fillPrintArea",
      attributes: item.prodigi_attributes || {},
      assets: [{ printArea: "default", url: item.prodigi_asset_url }],
      recipientCost: { amount: ((item.unit_amount || 0) / 100).toFixed(2), currency: String(order.currency || "eur").toUpperCase() }
    })),
    metadata: { herbzOrderId: order.id, stripeSessionId: order.stripe_session_id }
  };
  if (callbackUrl) payload.callbackUrl = callbackUrl;
  const response = await fetch(`${baseUrl()}/v4.0/orders`, { method: "POST", headers: { "X-API-Key": process.env.PRODIGI_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.order?.id) throw new Error(data?.error?.message || data?.message || "Prodigi could not create the order");
  return data.order;
}

export function shipmentTracking(order) {
  const shipment = order?.shipments?.find(value => value?.tracking?.number || value?.tracking?.url) || order?.shipments?.[0];
  return { number: shipment?.tracking?.number || null, url: shipment?.tracking?.url || null };
}
