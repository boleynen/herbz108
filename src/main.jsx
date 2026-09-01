import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const IG = "https://instagram.com/herbz108";
const nav = [["Tattoo", "/tattoo"], ["Art", "/art"], ["Shop", "/shop"], ["About", "/about"], ["Contact", "/contact"]];

function go(path) {
  history.pushState({}, "", path);
  dispatchEvent(new PopStateEvent("popstate"));
  scrollTo(0, 0);
}

function Link({ to, children, className = "" }) {
  return <a href={to} className={className} onClick={(event) => {
    if (to.startsWith("/")) { event.preventDefault(); go(to); }
  }}>{children}</a>;
}

function Header({ cartCount, onCartOpen }) {
  return <header className="site-header">
    <Link className="logo" to="/"><b>HERBZ108</b><small>Tattoo / Art</small></Link>
    <nav aria-label="Main navigation">{nav.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</nav>
    <div className="header-actions"><button className="cart-trigger" type="button" onClick={onCartOpen}>Cart <span>{cartCount}</span></button><Link className="book-link" to="/contact">Book now <span>↗</span></Link></div>
    <details className="mobile-menu"><summary>Menu</summary><div>{[["Home", "/"], ...nav].map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</div></details>
  </header>;
}

function Footer() {
  return <footer className="footer"><div className="wrap footer-main">
    <div><Link className="logo footer-logo" to="/"><b>HERBZ108</b></Link><p>Permanent marks.<br />Unpolished art.</p></div>
    <div><p className="footer-label">Navigate</p>{[["Home", "/"], ...nav].map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</div>
    <div><p className="footer-label">Studio</p><p>Kasterlee, BE<br />By appointment only</p><a href="mailto:studio@example.com">studio@example.com</a></div>
    <div><p className="footer-label">Follow</p><a href={IG} target="_blank" rel="noreferrer">Instagram ↗</a></div>
  </div><div className="wrap footer-bottom"><span>© 2026 HERBZ108 Studio</span><span>Privacy · Terms</span><span>Built for the beautifully restless.</span></div></footer>;
}

const tattooImages = [
  "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1590246814883-57c511e3a9d3?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1560707854-fb9a10eeaace?auto=format&fit=crop&w=1200&q=85"
];

function Home() {
  const products = [
    ["https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=85", "Static Bloom", "Original on paper", "€ 380"],
    ["https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=85", "Faultline No. 2", "Limited print / 25", "€ 85"],
    ["https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=85", "Red Room", "Original canvas", "€ 740"]
  ];
  const recent = ["photo-1598371839696-5c5bb00bdc28", "photo-1560707854-fb9a10eeaace", "photo-1611501275019-9b5cda994e8d", "photo-1579783902614-a3fb3927b6a5"];
  return <main>
    <section className="hero" id="home"><div className="hero-art" aria-hidden="true" /><div className="hero-copy wrap">
      <p className="eyebrow"><span>Kasterlee · BE</span> Tattoo &amp; visual artist</p>
      <h1>Ink on skin.<br /><em>Noise</em> on canvas.</h1>
      <p className="hero-intro">Original tattoos and raw visual work, built from instinct, contrast and a healthy disrespect for clean edges.</p>
      <div className="actions"><Link className="button button-primary" to="/contact">Book a session <span>↗</span></Link><Link className="button button-ghost" to="/tattoo">View tattoo work</Link></div>
    </div><p className="vertical-note">Independent artist / since 2014</p><a className="scroll-note" href="#work">Scroll to explore ↓</a></section>

    <section className="section wrap" id="work"><div className="section-heading"><div><p className="kicker">01 / Selected work</p><h2>Marked stories</h2></div><p>Custom pieces drawn for the body they live on. Blackwork, illustrative and abstract compositions.</p></div>
      <div className="work-grid">{tattooImages.map((src, index) => <figure className={`work-card work-card-${index + 1}`} key={src}><img src={src} alt={`Tattoo portfolio placeholder ${index + 1}`} /><figcaption><span>0{index + 1}</span>{["Ritual forms", "Silent fauna", "Broken symmetry"][index]}</figcaption></figure>)}</div>
      <Link className="text-link" to="/tattoo">Explore the tattoo archive <span>→</span></Link>
    </section>

    <section className="manifesto"><div className="wrap manifesto-inner"><p>Every piece starts with a conversation.</p><strong>No flash factory.<br />No copy-paste.</strong><span>Just work that belongs to you.</span></div></section>

    <section className="section wrap shop-preview"><div className="section-heading"><div><p className="kicker red">02 / Shop drop</p><h2>Objects<br />with a pulse</h2></div><p>One of a kind art.</p></div>
      <div className="product-row">{products.map(([src, name, type, price]) => <article className="product" key={name}><Link to="/shop"><div className="product-image"><img src={src} alt={`${name} artwork placeholder`} /></div><div className="product-meta"><div><h3>{name}</h3><p>{type}</p></div><strong>{price}</strong></div></Link></article>)}</div>
      <Link className="button button-ghost" to="/shop">Visit the shop →</Link>
    </section>

    <section className="about-preview"><div className="about-image"><img src="https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?auto=format&fit=crop&w=1400&q=85" alt="Tattoo artist at work placeholder" /></div><div className="about-copy"><p className="kicker">03 / Behind the work</p><h2>Made by<br />hand &amp; nerve.</h2><p>I’m an independent tattoo and visual artist working between skin, paper and canvas. My practice is rooted in blackwork, organic shapes and the beauty of imperfection.</p><Link className="text-link dark-link" to="/about">Meet the artist <span>→</span></Link></div></section>

    <section className="section wrap recent"><div className="section-heading"><div><p className="kicker">04 / Recent work</p><h2>From the studio</h2></div><p>@herbz108 — process, fresh work and occasional chaos.</p></div><div className="insta-grid">{recent.map((id, index) => <a href={IG} target="_blank" rel="noreferrer" key={id}><img src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=80`} alt={`Recent studio work placeholder ${index + 1}`} /><span>↗</span></a>)}</div></section>
  </main>;
}

const tattooItems = ["Ritual Forms", "Night Garden", "Tension", "Soft Armour", "Remains", "Signal / Noise"].map((title, index) => ({
  title,
  meta: ["Blackwork · Upper arm", "Illustrative · Back", "Abstract · Leg", "Ornamental · Sternum", "Blackwork · Forearm", "Freehand · Shoulder"][index],
  src: `https://images.unsplash.com/${["photo-1611501275019-9b5cda994e8d", "photo-1590246814883-57c511e3a9d3", "photo-1560707854-fb9a10eeaace", "photo-1598371839696-5c5bb00bdc28", "photo-1590246814883-57c511e3a9d3", "photo-1611501275019-9b5cda994e8d"][index]}?auto=format&fit=crop&w=1100&q=85`
}));

const artItems = ["Static Bloom", "Faultline", "Red Room", "Afterimage", "Study in Ash", "Untitled / III"].map((title, index) => ({
  title,
  meta: ["Ink on paper · 2025", "Mixed media · 2025", "Acrylic on canvas · 2024", "Private collection", "Sold · 2024", "Not for sale"][index],
  src: `https://images.unsplash.com/${["photo-1579783902614-a3fb3927b6a5", "photo-1549490349-8643362247b5", "photo-1547891654-e66ed7ebb968", "photo-1577083552431-6e5fd01aa342", "photo-1578301978018-3005759f48f7", "photo-1579783928621-7a13d66a62d1"][index]}?auto=format&fit=crop&w=1100&q=85`
}));

const shopItems = [
  ["static-bloom", "photo-1579783902614-a3fb3927b6a5", "Static Bloom", "Original on paper", 38000],
  ["faultline-no-2", "photo-1549490349-8643362247b5", "Faultline No. 2", "Signed print · edition of 25", 8500],
  ["red-room", "photo-1547891654-e66ed7ebb968", "Red Room", "Original canvas", 74000],
  ["residual-tee", "photo-1577083552431-6e5fd01aa342", "Residual Tee", "Screen print · organic cotton", 4200]
].map(([id, imageId, title, meta, unitAmount]) => ({ id, title, meta, unitAmount, price: new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(unitAmount / 100), src: `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=1100&q=85` }));

function GalleryPage({ index, title, intro, items, shop = false, onAdd }) {
  return <main className="inner-page"><header className="page-hero wrap"><p className="kicker">{index} / HERBZ108 studio</p><h1>{title}</h1><p>{intro}</p></header>
    <section className={`gallery wrap ${shop ? "shop-gallery" : ""}`}>{items.map((item, itemIndex) => <article className="gallery-item" key={item.title}><div className="gallery-image"><img src={item.src} alt={`${item.title} placeholder`} /><span>{String(itemIndex + 1).padStart(2, "0")}</span>{shop && <button type="button" onClick={() => onAdd(item)}>Add to cart +</button>}</div><div className="gallery-meta"><div><h2>{item.title}</h2><p>{item.meta}</p></div>{item.price && <strong>{item.price}</strong>}</div></article>)}</section>
    <section className="page-cta wrap"><p>Have something specific in mind?</p><h2>Let’s make<br />something yours.</h2><Link className="button button-primary" to="/contact">Start a conversation ↗</Link></section>
  </main>;
}

function About() {
  return <main className="inner-page"><header className="page-hero wrap"><p className="kicker">04 / About</p><h1>Artist.<br />Mark maker.</h1></header><section className="about-page wrap"><div className="portrait"><img src="https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?auto=format&fit=crop&w=1400&q=85" alt="Tattoo artist portrait placeholder" /></div><div className="story"><p className="lead">I make work for people who find beauty in tension: precise and instinctive, quiet and loud, permanent and always changing.</p><p>Based in Kasterlee, I’ve worked independently across tattooing and visual art since 2014. Every tattoo begins with listening. The goal isn’t to impose a house style, but to find the point where your story and my visual language meet.</p><p>Outside the studio I work on paper and canvas, moving between ink, acrylic, found textures and print.</p><dl><div><dt>Focus</dt><dd>Blackwork · Illustrative · Abstract</dd></div><div><dt>Studio</dt><dd>Kasterlee · Private · Appointment only</dd></div><div><dt>Languages</dt><dd>NL · EN</dd></div></dl><Link className="button button-primary" to="/contact">Work with me ↗</Link></div></section></main>;
}

function Contact() {
  return <main className="inner-page contact-page"><header className="page-hero wrap"><p className="kicker">05 / Contact &amp; booking</p><h1>Bring me<br />your idea.</h1><p>Tell me what you’re imagining. Rough thoughts are welcome — we’ll shape the rest together.</p></header><section className="contact-grid wrap"><form onSubmit={(event) => { event.preventDefault(); alert("Demo form — connect this form to your email or booking service before launch."); }}><div className="form-row"><label>Name<input required placeholder="Your name" /></label><label>Email<input type="email" required placeholder="you@email.com" /></label></div><div className="form-row"><label>Project type<select required defaultValue=""><option value="" disabled>Choose one</option><option>Tattoo booking</option><option>Artwork enquiry</option><option>Commission</option><option>Other</option></select></label><label>Preferred timing<input placeholder="Month / flexible" /></label></div><label>Tell me about it<textarea required rows="7" placeholder="Placement, size, idea, references..." /></label><button className="button button-primary" type="submit">Send enquiry ↗</button><p className="form-note">Demo form — connect to email or your booking tool before launch.</p></form><aside><p className="footer-label">Direct</p><a href="mailto:studio@example.com">studio@example.com</a><p className="footer-label">Studio</p><p>Kasterlee, Belgium<br />Address shared after booking</p><p className="footer-label">Response</p><p>Usually within 3–5 working days.</p></aside></section></main>;
}

function CartDrawer({ open, items, onClose, onChange, onRemove }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const total = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  async function checkout() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map(({ id, quantity }) => ({ id, quantity })) })
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout could not be started.");
      location.href = data.url;
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Checkout werkt na deployment op Netlify. Voeg daar eerst STRIPE_SECRET_KEY toe." : err.message);
      setLoading(false);
    }
  }
  return <div className={`cart-layer ${open ? "open" : ""}`} aria-hidden={!open}><button className="cart-backdrop" onClick={onClose} aria-label="Close cart" /><aside className="cart-drawer" aria-label="Shopping cart"><div className="cart-head"><div><p className="kicker">Your selection</p><h2>Cart</h2></div><button className="cart-close" onClick={onClose} aria-label="Close cart">×</button></div>
    {items.length === 0 ? <div className="cart-empty"><p>Your cart is still empty.</p><button className="button button-ghost" onClick={onClose}>Continue shopping</button></div> : <><div className="cart-items">{items.map(item => <article className="cart-item" key={item.id}><img src={item.src} alt="" /><div><h3>{item.title}</h3><p>{item.meta}</p><div className="quantity"><button onClick={() => onChange(item.id, item.quantity - 1)} aria-label={`Decrease ${item.title}`}>−</button><span>{item.quantity}</span><button onClick={() => onChange(item.id, item.quantity + 1)} aria-label={`Increase ${item.title}`}>+</button></div></div><div className="cart-item-price"><strong>{new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(item.unitAmount * item.quantity / 100)}</strong><button onClick={() => onRemove(item.id)}>Remove</button></div></article>)}</div><div className="cart-summary"><div><span>Total</span><strong>{new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(total / 100)}</strong></div><p>Secure payment via Stripe. Shipping details are collected during checkout.</p>{error && <p className="checkout-error">{error}</p>}<button className="button button-primary checkout-button" onClick={checkout} disabled={loading}>{loading ? "Opening checkout…" : "Proceed to payment ↗"}</button></div></>}
  </aside></div>;
}

function CheckoutSuccess({ onClear }) {
  useEffect(() => { onClear(); }, []);
  return <main className="not-found wrap"><p className="kicker">Payment complete</p><h1>Thank you.</h1><p>Your order has been received. Stripe will send the payment confirmation by email.</p><Link className="button button-primary" to="/">Back home →</Link></main>;
}

function NotFound() { return <main className="not-found wrap"><p className="kicker">404 / Lost line</p><h1>Nothing here.</h1><p>This page doesn’t exist or has moved.</p><Link className="button button-primary" to="/">Back home →</Link></main>; }

function App() {
  const [path, setPath] = useState(location.pathname);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem("herbz108-cart")) || []; } catch { return []; } });
  useEffect(() => { const update = () => setPath(location.pathname); addEventListener("popstate", update); return () => removeEventListener("popstate", update); }, []);
  useEffect(() => { localStorage.setItem("herbz108-cart", JSON.stringify(cart)); }, [cart]);
  function addToCart(product) {
    setCart(current => current.some(item => item.id === product.id) ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]);
    setCartOpen(true);
  }
  function changeQuantity(id, quantity) { setCart(current => quantity < 1 ? current.filter(item => item.id !== id) : current.map(item => item.id === id ? { ...item, quantity } : item)); }
  let page;
  if (path === "/") page = <Home />;
  else if (path === "/tattoo") page = <GalleryPage index="01" title="Tattoo archive" intro="Custom blackwork, illustrative and abstract pieces, designed in dialogue with every client and every body." items={tattooItems} />;
  else if (path === "/art") page = <GalleryPage index="02" title="Art / experiments" intro="A wider archive of originals, studies and visual experiments. Some sold, some private, some still becoming." items={artItems} />;
  else if (path === "/shop") page = <GalleryPage index="03" title="Shop the work" intro="Originals and limited editions. Add a piece to your cart and pay securely through Stripe." items={shopItems} shop onAdd={addToCart} />;
  else if (path === "/about") page = <About />;
  else if (path === "/contact") page = <Contact />;
  else if (path === "/checkout/success") page = <CheckoutSuccess onClear={() => setCart([])} />;
  else page = <NotFound />;
  return <><Header cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} onCartOpen={() => setCartOpen(true)} />{page}<Footer /><CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onChange={changeQuantity} onRemove={id => setCart(current => current.filter(item => item.id !== id))} /></>;
}

createRoot(document.getElementById("root")).render(<App />);
