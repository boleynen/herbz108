const baseUrl = () => process.env.PRODIGI_ENVIRONMENT === "live" ? "https://api.prodigi.com" : "https://api.sandbox.prodigi.com";

export function isProdigiItem(item) {
  return item.fulfillment_mode === "prodigi";
}

function prodigiAssets(item, includeUrls = true) {
  const assets = Array.isArray(item.prodigi_assets) && item.prodigi_assets.length
    ? item.prodigi_assets
    : [{ printArea: "default", url: item.prodigi_asset_url }];
  return assets.filter(asset => asset?.printArea && (!includeUrls || asset?.url)).map(asset => includeUrls ? { printArea: asset.printArea, url: asset.url } : { printArea: asset.printArea });
}

function prodigiAttributes(item) {
  return { ...(item.prodigi_attributes || {}), ...(item.size ? { size: String(item.size).toLowerCase() } : {}) };
}

async function validateVariantAvailability(item) {
  if (!process.env.PRODIGI_API_KEY || !item.prodigi_sku) return;
  const response = await fetch(`${baseUrl()}/v4.0/products/${encodeURIComponent(item.prodigi_sku)}`, { headers: { "X-API-Key": process.env.PRODIGI_API_KEY } });
  if (!response.ok) throw new Error(`Could not verify availability for ${item.title}`);
  const product = await response.json();
  const wanted = prodigiAttributes(item);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) return;
  const matches = variants.some(variant => Object.entries(wanted).every(([key, value]) => String(variant.attributes?.[key] ?? "").toLowerCase() === String(value).toLowerCase()));
  if (!matches) throw new Error(`The selected colour/size combination is unavailable for ${item.title}`);
}

export async function quoteProdigiShipping({ country, items }) {
  if (!process.env.PRODIGI_API_KEY) throw new Error("Prodigi is not configured. Add PRODIGI_API_KEY in Netlify.");
  const podItems = items.filter(item => item.fulfillment_mode === "prodigi");
  if (!podItems.length) return 0;
  for (const item of podItems) {
    if (!item.prodigi_sku) throw new Error(`Prodigi product configuration is missing for ${item.title}`);
    await validateVariantAvailability(item);
  }
  const response = await fetch(`${baseUrl()}/v4.0/quotes`, {
    method: "POST",
    headers: { "X-API-Key": process.env.PRODIGI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      shippingMethod: "Standard",
      destinationCountryCode: country,
      currencyCode: "EUR",
      items: podItems.map(item => ({ sku: item.prodigi_sku, copies: item.quantity, attributes: prodigiAttributes(item), assets: prodigiAssets(item, false) }))
    })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data?.quotes)) throw new Error(data?.error?.message || data?.message || "Prodigi could not calculate shipping");
  const quote = data.quotes.find(value => String(value.shipmentMethod).toLowerCase() === "standard") || data.quotes[0];
  const amount = Number(quote?.costSummary?.shipping?.amount);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Prodigi did not return a shipping price");
  return Math.round(amount * 100);
}

export async function submitProdigiOrder({ order, items, callbackUrl }) {
  if (!process.env.PRODIGI_API_KEY) throw new Error("Prodigi is not configured. Add PRODIGI_API_KEY in Netlify.");
  if (!order.shipping_address?.line1 || !order.shipping_address?.postal_code || !order.shipping_address?.city || !order.shipping_address?.country) throw new Error("A complete shipping address is required for Prodigi.");
  const podItems = items.filter(isProdigiItem);
  if (!podItems.length) return null;
  for (const item of podItems) {
    if (!item.prodigi_sku || !prodigiAssets(item).length) throw new Error(`Prodigi SKU or print asset is missing for ${item.title}`);
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
      attributes: prodigiAttributes(item),
      assets: prodigiAssets(item),
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
