import { calculateShipping, isStandardParcel, SHIPPING_COUNTRIES } from "./_shipping.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Stripe is nog niet gekoppeld. Voeg STRIPE_SECRET_KEY toe in Netlify." }, { status: 503 });

  try {
    const payload = await request.json();
    if (!Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > 10) throw new Error("Invalid cart");
    const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Shop database is not configured");
    const country = typeof payload.country === "string" ? payload.country.toUpperCase() : "";
    if (!SHIPPING_COUNTRIES[country]) throw new Error("Choose a supported delivery country");
    const ids = payload.items.map(item => item.id);
    const productResponse = await fetch(`${supabaseUrl}/rest/v1/portfolio_items?select=id,title,description,price_cents,category,product_type,stock_quantity,size_stock,shipping_weight_grams,shipping_width_cm,shipping_height_cm,shipping_depth_cm,shipping_mode,custom_shipping_prices&id=in.(${ids.map(encodeURIComponent).join(",")})`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });
    if (!productResponse.ok) throw new Error("Could not validate shop products");
    const catalog = Object.fromEntries((await productResponse.json()).filter(product => product.category === "shop" && product.price_cents).map(product => [product.id, product]));
    const items = payload.items.map(item => {
      const product = catalog[item.id];
      const quantity = Number(item.quantity);
      const size = typeof item.size === "string" ? item.size.toUpperCase() : null;
      const available = product?.product_type === "apparel" ? Number(product.size_stock?.[size] || 0) : Number(product?.stock_quantity ?? 1);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > available) throw new Error("The requested size or quantity is no longer available");
      if (product.product_type === "apparel" && !["XS", "S", "M", "L", "XL", "XXL"].includes(size)) throw new Error("Choose a valid apparel size");
      if ((product.shipping_mode || "automatic") === "automatic" && !isStandardParcel(product)) throw new Error(`Custom shipping must be configured for ${product.title}`);
      return { product, quantity, size };
    });

    const shipping = calculateShipping(items, country);
    const origin = new URL(request.url).origin;
    const params = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
      customer_creation: "always",
      "billing_address_collection": "required",
      "shipping_address_collection[allowed_countries][0]": country,
      "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]": String(shipping.amount),
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "eur",
      "shipping_options[0][shipping_rate_data][display_name]": `Tracked shipping to ${SHIPPING_COUNTRIES[country].name}`
    });

    params.set("metadata[inventory]", JSON.stringify(items.map(({ product, quantity, size }) => [product.id, quantity, size])));
    params.set("metadata[delivery_country]", country);
    params.set("metadata[shipping_amount]", String(shipping.amount));

    items.forEach(({ product, quantity, size }, index) => {
      params.set(`line_items[${index}][quantity]`, String(quantity));
      params.set(`line_items[${index}][price_data][currency]`, "eur");
      params.set(`line_items[${index}][price_data][unit_amount]`, String(product.price_cents));
      params.set(`line_items[${index}][price_data][product_data][name]`, size ? `${product.title} — Size ${size}` : product.title);
      if (product.description?.trim()) params.set(`line_items[${index}][price_data][product_data][description]`, product.description.trim());
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const session = await stripeResponse.json();
    if (!stripeResponse.ok) throw new Error(session?.error?.message || "Stripe checkout failed");
    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message || "Checkout could not be started" }, { status: 400 });
  }
}
