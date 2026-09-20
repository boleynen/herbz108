import { quoteProdigiShipping } from "./_prodigi.mjs";
import { SHIPPING_COUNTRIES } from "./_shipping.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  try {
    const payload = await request.json();
    if (!Array.isArray(payload.items) || !payload.items.length || payload.items.length > 10) throw new Error("Invalid cart");
    const country = typeof payload.country === "string" ? payload.country.toUpperCase() : "";
    if (!SHIPPING_COUNTRIES[country]) throw new Error("Choose a supported delivery country");
    const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Shop database is not configured");
    const ids = payload.items.map(item => item.id);
    const response = await fetch(`${supabaseUrl}/rest/v1/portfolio_items?select=id,title,category,fulfillment_mode,prodigi_sku,prodigi_asset_url,prodigi_assets,prodigi_attributes&id=in.(${ids.map(encodeURIComponent).join(",")})`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });
    if (!response.ok) throw new Error("Could not validate shop products");
    const catalog = Object.fromEntries((await response.json()).filter(item => item.category === "shop").map(item => [item.id, item]));
    const items = payload.items.map(item => {
      const product = catalog[item.id];
      const quantity = Number(item.quantity);
      if (!product || product.fulfillment_mode !== "prodigi" || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error("Shipping quote is only available for valid made-to-order products");
      return { ...product, quantity };
    });
    return Response.json({ amount: await quoteProdigiShipping({ country, items }) });
  } catch (error) {
    return Response.json({ error: error.message || "Shipping could not be calculated" }, { status: 400 });
  }
}
