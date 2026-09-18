import { shipmentTracking } from "./_prodigi.mjs";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

async function sendDispatchEmail(order, tracking) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !order.customer_email || !tracking.number) return null;
  const firstName = order.customer_name?.trim()?.split(/\s+/)[0] || "there";
  const trackingLink = tracking.url ? `<p><a href="${encodeURI(tracking.url)}" style="color:#b28d2e">Track your delivery ↗</a></p>` : "";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `herbz108_prodigi_dispatch_${order.id}` },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [order.customer_email],
      reply_to: "herbzbooking@protonmail.com",
      subject: "Your HERBZ108 order is on its way",
      text: `Hi ${firstName},\n\nYour HERBZ108 order has been dispatched.\n\nTracking number: ${tracking.number}${tracking.url ? `\nTrack your delivery: ${tracking.url}` : ""}\n\nThank you for supporting independent art.\n\nHERBZ108`,
      html: `<div style="background:#080909;color:#e8e5de;padding:40px 20px;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto"><p style="color:#b28d2e;font:12px monospace;letter-spacing:.14em;text-transform:uppercase">HERBZ108 · Dispatched</p><h1 style="font:42px Georgia,serif;margin:18px 0">Your order is on its way.</h1><p style="line-height:1.6;color:#c9c5bc">Hi ${escapeHtml(firstName)}, your order has been dispatched.</p><p style="line-height:1.6;color:#c9c5bc">Tracking number: <strong>${escapeHtml(tracking.number)}</strong></p>${trackingLink}<p style="margin-top:36px;color:#c9c5bc">Thank you for supporting independent art.<br><strong>HERBZ108</strong></p></div></div>`
    })
  });
  if (!response.ok) throw new Error("Could not send the dispatch email");
  return true;
}

export default async function handler(request) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const token = new URL(request.url).searchParams.get("token");
  if (!process.env.PRODIGI_WEBHOOK_SECRET || token !== process.env.PRODIGI_WEBHOOK_SECRET) return new Response("Unauthorized", { status: 401 });
  try {
    const event = await request.json();
    const order = event?.data;
    if (!order?.id) throw new Error("Prodigi callback does not contain an order");
    const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase webhook access is not configured");
    const tracking = shipmentTracking(order);
    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=id,customer_email,customer_name,prodigi_tracking_email_sent_at&prodigi_order_id=eq.${encodeURIComponent(order.id)}&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!orderResponse.ok) throw new Error(await orderResponse.text());
    const [savedOrder] = await orderResponse.json();
    if (!savedOrder) throw new Error("No matching HERBZ108 order found for this Prodigi callback");
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?prodigi_order_id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ prodigi_status: order.status?.stage || null, prodigi_tracking_number: tracking.number, prodigi_tracking_url: tracking.url, prodigi_last_error: order.status?.issues?.length ? order.status.issues.map(issue => issue.description || issue.errorCode).join("; ") : null, prodigi_updated_at: new Date().toISOString(), status: order.status?.stage === "Complete" ? "completed" : order.status?.details?.shipping === "Complete" ? "shipped" : "new" })
    });
    if (!response.ok) throw new Error(await response.text());
    if (tracking.number && !savedOrder.prodigi_tracking_email_sent_at && await sendDispatchEmail(savedOrder, tracking)) {
      const emailUpdate = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(savedOrder.id)}`, {
        method: "PATCH",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ prodigi_tracking_email_sent_at: new Date().toISOString() })
      });
      if (!emailUpdate.ok) throw new Error(await emailUpdate.text());
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Prodigi webhook failed", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
