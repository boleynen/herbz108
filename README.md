# HERBZ108 website

Exportable React/Vite version of the HERBZ108 tattoo and visual-art website. It uses the same project format as the Lucid Blvck export and works with regular npm commands.

## Included

- Home, Tattoo, Art, Shop, About and Contact routes.
- Responsive navigation and the custom HERBZ108 grunge hero image.
- Placeholder portfolio and product images, ready to replace with real work.
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

## Before launch

Replace the placeholder photography, `studio@example.com`, sample prices and demo contact form.

## Activate Stripe payments

1. Create or open your Stripe account.
2. In Stripe, open **Developers → API keys** and copy the secret key. Use the test key (`sk_test_...`) while testing.
3. In Netlify, open **Project configuration → Environment variables**.
4. Add `STRIPE_SECRET_KEY` and paste the secret key as its value.
5. Deploy the site again.

Prices and allowed quantities are validated securely in `netlify/functions/create-checkout.mjs`; the browser cannot change them. Never put the secret Stripe key in `src`, GitHub or a variable beginning with `VITE_`.

The cart itself works locally. The final payment redirect works after deployment on Netlify because it requires the protected server function.
