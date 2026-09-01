# HERBZ108 website

Exportable React/Vite version of the HERBZ108 tattoo and visual-art website. It uses the same project format as the Lucid Blvck export and works with regular npm commands.

## Included

- Home, Tattoo, Art, Shop, About and Contact routes.
- Responsive navigation and the custom HERBZ108 grunge hero image.
- Placeholder portfolio and product images, ready to replace with real work.
- Netlify and Vercel configuration for single-page routing.
- A shop interface prepared for a future Stripe or webshop integration.

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

Replace the placeholder photography, `studio@example.com`, sample prices and demo contact form. Connect the shop buttons to Stripe or your chosen ecommerce platform.
