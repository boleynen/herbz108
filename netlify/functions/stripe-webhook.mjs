import { createHmac, timingSafeEqual } from "node:crypto";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
const euro = cents => new Intl.NumberFormat("en-BE", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
const addressLines = address => address ? [address.line1, address.line2, [address.postal_code, address.city].filter(Boolean).join(" "), address.state, address.country].filter(Boolean) : [];

async function sendOrderConfirmation({ session, items, customerName, shippingAddress }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !session.customer_details?.email) {
    console.warn("Order confirmation email skipped: Resend or customer email is not configured");
    return null;
  }
  const orderNumber = session.id.slice(-10).toUpperCase();
  const itemText = items.map(item => `${item.quantity} × ${item.title} — ${euro(item.amount_total ?? item.unit_amount * item.quantity)}`).join("\n");
  const itemHtml = items.map(item => `<tr><td style="padding:10px 0;border-bottom:1px solid #d8d3c8">${item.quantity} × ${escapeHtml(item.title)}</td><td style="padding:10px 0;border-bottom:1px solid #d8d3c8;text-align:right;white-space:nowrap">${escapeHtml(euro(item.amount_total ?? item.unit_amount * item.quantity))}</td></tr>`).join("");
  const addressText = addressLines(shippingAddress).join("\n") || "No shipping address was supplied.";
  const addressHtml = addressLines(shippingAddress).map(escapeHtml).join("<br>") || "No shipping address was supplied.";
  const firstName = customerName?.trim()?.split(/\s+/)[0] || "there";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `herbz108_order_${session.id}` },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [session.customer_details.email],
      reply_to: "herbzbooking@protonmail.com",
      subject: `Your HERBZ108 order is confirmed — #${orderNumber}`,
      text: `Thank you, ${firstName}.\n\nYour payment was successful and your HERBZ108 order has been received.\n\nOrder #${orderNumber}\n\n${itemText}\n\nTotal paid: ${euro(session.amount_total)}\n\nShipping address:\n${addressText}\n\nYour order will be carefully prepared for shipping. You will receive another email when it has been dispatched.\n\nIs the shipping address incorrect? Contact us as soon as possible at herbzbooking@protonmail.com.\n\nThank you for supporting independent art.\n\nHERBZ108\nKasterlee, Belgium`,
      html: `<div style="background:#080909;color:#e8e5de;padding:40px 20px;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto"><p style="color:#b28d2e;font:12px monospace;letter-spacing:.14em;text-transform:uppercase">HERBZ108 · Order confirmed</p><h1 style="font:42px Georgia,serif;margin:18px 0">Thank you, ${escapeHtml(firstName)}.</h1><p style="line-height:1.6;color:#c9c5bc">Your payment was successful and your order has been received.</p><p style="font:13px monospace;color:#b28d2e">Order #${escapeHtml(orderNumber)}</p><table style="width:100%;margin:28px 0;border-collapse:collapse;color:#e8e5de;font:14px monospace">${itemHtml}<tr><td style="padding:16px 0;font-weight:bold">Total paid</td><td style="padding:16px 0;text-align:right;font-weight:bold">${escapeHtml(euro(session.amount_total))}</td></tr></table><h2 style="font:22px Georgia,serif">Shipping address</h2><p style="line-height:1.6;color:#c9c5bc">${addressHtml}</p><p style="margin-top:30px;line-height:1.6;color:#c9c5bc">Your order will be carefully prepared for shipping. You will receive another email when it has been dispatched.</p><p style="line-height:1.6;color:#c9c5bc">Is the shipping address incorrect? Contact us as soon as possible at <a style="color:#b28d2e" href="mailto:herbzbooking@protonmail.com">herbzbooking@protonmail.com</a>.</p><p style="margin-top:36px">Thank you for supporting independent art.<br><strong>HERBZ108</strong><br>Kasterlee, Belgium</p></div></div>`
    })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.message || "Order confirmation email failed");
  return result.id;
}

function verifySignature(payload, signature, secret) {
  const timestamp = signature.match(/(?:^|,)t=([^,]+)/)?.[1];
  const signatures = [...signature.matchAll(/(?:^|,)v1=([^,]+)/g)].map(match => match[1]);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex"), "hex");
  return signatures.some(value => { const actual = Buffer.from(value, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); });
}

export default async function handler(request) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!process.env.STRIPE_WEBHOOK_SECRET || !verifySignature(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)) return new Response("Invalid signature", { status: 400 });

  try {
    const event = JSON.parse(payload);
    const session = event.data?.object;
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) && session?.payment_status === "paid") {
      const inventory = JSON.parse(session.metadata?.inventory || "[]").map(([id, quantity, size]) => ({ id, quantity, size: size || null }));
      if (!inventory.length) throw new Error("Checkout session contains no inventory data");
      const lineItemResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session.id)}/line_items?limit=100`, {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
      });
      const lineItemData = await lineItemResponse.json();
      if (!lineItemResponse.ok) throw new Error(lineItemData?.error?.message || "Could not retrieve Stripe line items");
      const items = inventory.map((item, index) => {
        const lineItem = lineItemData.data?.[index];
        return { ...item, title: lineItem?.description || "Product", unit_amount: lineItem?.price?.unit_amount ?? null, amount_total: lineItem?.amount_total ?? null };
      });
      const shippingDetails = session.collected_information?.shipping_details || session.shipping_details || null;
      const customerName = shippingDetails?.name || session.customer_details?.name || null;
      const shippingAddress = shippingDetails?.address || session.customer_details?.address || null;
      const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) throw new Error("Supabase webhook access is not configured");
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/process_paid_order`, {
        method: "POST",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_event_id: event.id, p_session_id: session.id, p_items: items, p_customer_email: session.customer_details?.email || null, p_customer_name: customerName, p_shipping_address: shippingAddress, p_amount_total: session.amount_total, p_currency: session.currency })
      });
      if (!response.ok) throw new Error(await response.text());
      const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=confirmation_email_sent_at&stripe_event_id=eq.${encodeURIComponent(event.id)}&limit=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      });
      if (!orderResponse.ok) throw new Error(await orderResponse.text());
      const [savedOrder] = await orderResponse.json();
      if (!savedOrder?.confirmation_email_sent_at) {
        const emailId = await sendOrderConfirmation({ session, items, customerName, shippingAddress });
        if (emailId) {
          const emailUpdate = await fetch(`${supabaseUrl}/rest/v1/orders?stripe_event_id=eq.${encodeURIComponent(event.id)}`, {
            method: "PATCH",
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ confirmation_email_sent_at: new Date().toISOString(), confirmation_email_id: emailId })
          });
          if (!emailUpdate.ok) throw new Error(await emailUpdate.text());
        }
      }
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Stripe webhook failed", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
