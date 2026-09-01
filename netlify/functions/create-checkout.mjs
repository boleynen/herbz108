const catalog = {
  "static-bloom": { name: "Static Bloom", description: "Original on paper", unitAmount: 38000, max: 1 },
  "faultline-no-2": { name: "Faultline No. 2", description: "Signed print · edition of 25", unitAmount: 8500, max: 5 },
  "red-room": { name: "Red Room", description: "Original canvas", unitAmount: 74000, max: 1 },
  "residual-tee": { name: "Residual Tee", description: "Screen print · organic cotton", unitAmount: 4200, max: 5 }
};

export default async function handler(request) {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Stripe is nog niet gekoppeld. Voeg STRIPE_SECRET_KEY toe in Netlify." }, { status: 503 });

  try {
    const payload = await request.json();
    if (!Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > 20) throw new Error("Invalid cart");
    const items = payload.items.map(item => {
      const product = catalog[item.id];
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.max) throw new Error("Invalid product or quantity");
      return { product, quantity };
    });

    const origin = new URL(request.url).origin;
    const params = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
      customer_creation: "always",
      "billing_address_collection": "required",
      "shipping_address_collection[allowed_countries][0]": "BE",
      "shipping_address_collection[allowed_countries][1]": "NL",
      "shipping_address_collection[allowed_countries][2]": "DE",
      "shipping_address_collection[allowed_countries][3]": "FR",
      "shipping_address_collection[allowed_countries][4]": "LU"
    });

    items.forEach(({ product, quantity }, index) => {
      params.set(`line_items[${index}][quantity]`, String(quantity));
      params.set(`line_items[${index}][price_data][currency]`, "eur");
      params.set(`line_items[${index}][price_data][unit_amount]`, String(product.unitAmount));
      params.set(`line_items[${index}][price_data][product_data][name]`, product.name);
      params.set(`line_items[${index}][price_data][product_data][description]`, product.description);
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
