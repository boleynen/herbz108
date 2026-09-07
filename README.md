# HERBZ108 website

Exportable React/Vite version of the HERBZ108 tattoo and visual-art website. It uses the same project format as the Lucid Blvck export and works with regular npm commands.

## Included

- Home, Tattoo, Art, Shop, About and Contact routes.
- Responsive navigation and the custom HERBZ108 grunge hero image.
- Empty Tattoo, Art and Shop archives that are filled through a secure admin page.
- Netlify and Vercel configuration for single-page routing.
- A persistent shopping cart with quantities, removal and order totals.
- Secure Stripe Checkout through a Netlify server function.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal, normally `http://localhost:5173`.

Create a production build with:

```bash
npm run build
```

## Deploy

For Netlify or Vercel, upload this folder to GitHub and import the repository. Both platforms detect the included settings. The production output folder is `dist`.

## Secure portfolio admin with Supabase

The `/admin` page has email/password login and lets the allowlisted administrator upload or delete Tattoo, Art and Shop work. Uploaded files live in Supabase Storage and their details in the database.

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/setup.sql` once.
3. In **Authentication → Users**, create the administrator account.
4. Copy that user's UUID and run the final commented `insert into public.admin_users...` statement separately.
5. In Netlify add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for all deploy contexts. These two browser values are not secret; never use the service-role key.
6. Redeploy and open `/admin`.

The public galleries show a clean empty state until work is uploaded. Shop prices are stored in cents and validated from Supabase by the Stripe server function.

For multiple product photos, run `supabase/add-product-images.sql` once. The admin can then upload several images per product and select the cover image. Existing products are migrated automatically and the shop is ordered newest first.

For product dimensions and apparel inventory per size, run `supabase/add-product-sizes.sql` once in the Supabase SQL Editor before deploying the matching code.

## Before launch

Connect the demo contact form before launch. Direct enquiries use `herbzbooking@protonmail.com`.

## Activate Stripe payments

1. Run `supabase/add-shop-filters.sql`, followed by `supabase/add-orders-and-payment-stock.sql`, in the Supabase SQL Editor.
2. In Supabase, open **Project Settings → API keys** and copy the `service_role` secret key.
3. In Netlify, add `SUPABASE_SERVICE_ROLE_KEY` as a secret environment variable for Functions and Runtime. Never prefix this key with `VITE_`.
4. In Stripe, open **Developers → API keys** and copy the secret key. Use `sk_test_...` while testing.
5. In Netlify, add the Stripe key as the secret environment variable `STRIPE_SECRET_KEY` for Functions and Runtime.
6. Deploy the site so the two Netlify functions are available.
7. In Stripe Workbench, create a webhook/event destination for `https://YOUR-NETLIFY-DOMAIN/.netlify/functions/stripe-webhook`.
8. Subscribe it to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
9. Copy the webhook signing secret (`whsec_...`) into Netlify as the secret environment variable `STRIPE_WEBHOOK_SECRET` for Functions and Runtime, then deploy again.
10. In **Stripe → Settings → Payment methods**, enable Cards and Bancontact, plus iDEAL if Dutch customers are expected.

Prices and allowed quantities are validated securely in `netlify/functions/create-checkout.mjs`; the browser cannot change them. The signed webhook stores a paid order and reduces stock exactly once. Never put Stripe or Supabase secret keys in `src`, GitHub or a variable beginning with `VITE_`.

To show paid orders in the separate **Orders** section of `/admin`, run `supabase/add-admin-orders-view.sql` once in the Supabase SQL Editor.

To store the buyer name, shipping address and exact purchased product details, run `supabase/add-order-details.sql` once and redeploy. New orders include these details automatically. Older Stripe events can be retried once from the Stripe webhook delivery screen to enrich existing order records without reducing stock twice.

## Shipping setup

Run `supabase/add-product-shipping.sql` once in the Supabase SQL Editor before deploying this version. New shop products require their unpacked weight; paintings, prints and sculptures also require dimensions. Checkout adds an estimated packaging allowance and selects the configured weight tier for Belgium, the Netherlands, Luxembourg, Germany or France. For oversized or exceptional products, choose custom shipping in `/admin` and enter a price for every country.

Existing products need shipping data before checkout. Add their weight (and dimensions where relevant) in Supabase's `portfolio_items` table, or recreate them through `/admin`.

If deleting a product from `/admin` shows **Access denied**, run `supabase/fix-admin-delete-policies.sql` once in the Supabase SQL Editor.

## Order confirmation emails

1. Create a Resend account and verify a domain or sending subdomain.
2. Run `supabase/add-order-confirmation-email.sql` once in the Supabase SQL Editor.
3. Add `RESEND_API_KEY` in Netlify as a secret for Functions and Runtime.
4. Add `RESEND_FROM_EMAIL` in Netlify, for example `HERBZ108 <orders@updates.yourdomain.com>` using the verified Resend domain.
5. Redeploy the site. The Stripe webhook sends one confirmation email after a successful payment and records the delivery ID on the order.

The cart itself works locally. The final payment redirect and webhook work after deployment on Netlify because they require protected server functions. Test the complete flow before replacing test keys with live keys.
