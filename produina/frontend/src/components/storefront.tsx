import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/azix-hero.jpg";
import hoodieImage from "@/assets/hoodie.jpg";
import teeImage from "@/assets/tee.jpg";
import cargoImage from "@/assets/cargo.jpg";
import bacImage from "@/assets/bac-campaign.jpg";
import { BacCustomizer, type BacCustomization } from "@/features/bac-shop/BacCustomizer";

type Product = {
  id: string;
  name: string;
  type: string;
  category: "main" | "bac";
  price: number;
  image: string;
  tag: string;
  sizes: string[];
  description?: string;
  colors?: string[];
  fabrics?: Array<{ name: string; price: number }>;
};
type CartItem = { id: string; size: string; quantity: number; customization?: BacCustomization };
type View = "home" | "clothes" | "bac";
type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
};
type AuthState = { token: string; user: AuthUser };

const featuredProducts: Product[] = [
  {
    id: "bac-hoodie",
    name: "2K27 CLASS HOODIE",
    type: "BAC 2K27 / Heavyweight fleece",
    category: "bac",
    price: 89,
    image: hoodieImage,
    tag: "01 / 2K27",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bac-tee",
    name: "2K27 CLASS TEE",
    type: "BAC 2K27 / Heavy cotton",
    category: "bac",
    price: 46,
    image: teeImage,
    tag: "02 / 2K27",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bac-jacket",
    name: "2K27 VARSITY JACKET",
    type: "BAC 2K27 / Water-resistant shell",
    category: "bac",
    price: 149,
    image: bacImage,
    tag: "03 / 2K27",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bac-cargo",
    name: "2K27 CLASS CARGO",
    type: "BAC 2K27 / Relaxed technical cotton",
    category: "bac",
    price: 108,
    image: cargoImage,
    tag: "04 / 2K27",
    sizes: ["S", "M", "L", "XL"],
  },
];

// Prices and checkout requests are Tunisia-specific (the form accepts +216 numbers).
const money = (value: number) =>
  new Intl.NumberFormat("en-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 2,
  }).format(value);
const cartKey = "azix-cart-v1";
const authKey = "azix-auth-v1";
const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

function readAuthState(): AuthState | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(authKey) || "null") as AuthState | null;
    if (!saved?.token || !saved.user?.email) return null;
    const payload = JSON.parse(
      atob(saved.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      window.localStorage.removeItem(authKey);
      return null;
    }
    return saved;
  } catch {
    window.localStorage.removeItem(authKey);
    return null;
  }
}

function customizationKey(customization?: BacCustomization) {
  return customization ? JSON.stringify(customization) : "";
}

function Countdown() {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    setRemaining(getRemaining());
    const timer = window.setInterval(() => setRemaining(getRemaining()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const values = [remaining.days, remaining.hours, remaining.minutes, remaining.seconds];
  return (
    <div
      className="countdown"
      aria-label={`${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes until class of 2027`}
    >
      {values.map((value, i) => (
        <div className="countdown-unit" key={i}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{["DAYS", "HOURS", "MINUTES", "SECONDS"][i]}</span>
        </div>
      ))}
    </div>
  );
}

function getRemaining() {
  const diff = Math.max(0, new Date("2027-06-01T00:00:00Z").getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

function ProductCard({
  product,
  onAdd,
  onViewDetails,
}: {
  product: Product;
  onAdd: (product: Product, size: string) => void;
  onViewDetails: (product: Product) => void;
}) {
  const [size, setSize] = useState("");
  const [prompt, setPrompt] = useState(false);
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img
          src={product.image}
          alt={product.name.toLowerCase()}
          loading="lazy"
          width={768}
          height={1024}
        />
        <button
          type="button"
          className="product-details-trigger"
          onClick={() => onViewDetails(product)}
        >
          VIEW DETAILS
        </button>
        <span className="product-index">{product.tag}</span>
        <div className="product-quick">
          <Zap size={14} fill="currentColor" /> AZIX STANDARD
        </div>
      </div>
      <div className="product-info">
        <div>
          <button
            type="button"
            className="product-name-trigger"
            onClick={() => onViewDetails(product)}
          >
            <h3>{product.name}</h3>
          </button>
          <p>{product.type}</p>
        </div>
        <strong>{money(product.price)}</strong>
      </div>
      <div className="product-actions">
        <div className="sizes" aria-label={`Select size for ${product.name}`}>
          {product.sizes.map((s) => (
            <Button
              key={s}
              variant="outline"
              type="button"
              aria-label={`${product.name} size ${s}`}
              aria-pressed={size === s}
              className={`size-button ${size === s ? "is-selected" : ""}`}
              onClick={() => {
                setSize(s);
                setPrompt(false);
              }}
            >
              {s}
            </Button>
          ))}
        </div>
        <Button
          className="add-button"
          onClick={() => {
            if (!size) {
              setPrompt(true);
              return;
            }

            onAdd(product, size);
            setPrompt(false);
          }}
        >
          <Plus size={16} /> ADD TO BAG
        </Button>
      </div>
      {prompt && (
        <p className="size-warning" role="alert">
          Select a size first.
        </p>
      )}
    </article>
  );
}

function ProductDetails({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product, size: string) => void;
}) {
  const [size, setSize] = useState("");
  const [prompt, setPrompt] = useState(false);

  function addProduct() {
    if (!size) {
      setPrompt(true);
      return;
    }
    onAdd(product, size);
    onClose();
  }

  return (
    <div className="product-details-backdrop" onClick={onClose}>
      <section
        className="product-details-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="product-details-close"
          onClick={onClose}
          aria-label="Close product details"
        >
          <X size={20} />
        </button>
        <div className="product-details-image">
          <img src={product.image} alt={product.name.toLowerCase()} />
        </div>
        <div className="product-details-content">
          <span className="section-kicker">{product.tag}</span>
          <div className="product-details-heading">
            <h2 id="product-details-title">{product.name}</h2>
            <strong>{money(product.price)}</strong>
          </div>
          <p className="product-details-type">{product.type}</p>
          <p className="product-details-description">
            {product.description || "A carefully made AZIX piece designed for everyday wear."}
          </p>
          <div className="product-details-meta">
            <div>
              <span>CATEGORY</span>
              <b>{product.category === "bac" ? "BAC 2K27" : "CLOTHES"}</b>
            </div>
            {product.colors?.length ? (
              <div>
                <span>COLORS</span>
                <b>{product.colors.join(", ")}</b>
              </div>
            ) : null}
            {product.fabrics?.length ? (
              <div>
                <span>FABRIC</span>
                <b>{product.fabrics.map((fabric) => fabric.name).join(", ")}</b>
              </div>
            ) : null}
          </div>
          <div className="product-details-sizes">
            <span>SELECT SIZE</span>
            <div className="sizes">
              {product.sizes.map((itemSize) => (
                <Button
                  key={itemSize}
                  variant="outline"
                  type="button"
                  aria-pressed={size === itemSize}
                  className={`size-button ${size === itemSize ? "is-selected" : ""}`}
                  onClick={() => {
                    setSize(itemSize);
                    setPrompt(false);
                  }}
                >
                  {itemSize}
                </Button>
              ))}
            </div>
          </div>
          {prompt && <p className="size-warning">Select a size first.</p>}
          <Button className="add-button product-details-add" onClick={addProduct}>
            <Plus size={16} /> ADD TO BAG
          </Button>
        </div>
      </section>
    </div>
  );
}

function ElectricBadge() {
  return (
    <div className="electric-badge">
      <Zap size={20} fill="currentColor" strokeWidth={2.5} />
      <span>
        BAC <b>2K27</b>
      </span>
      <Zap size={20} fill="currentColor" strokeWidth={2.5} />
    </div>
  );
}

export function Storefront({ view }: { view: View }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(featuredProducts);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [formOpen, setFormOpen] = useState<"preorder" | "bulk" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customizing, setCustomizing] = useState<{ product: Product; size: string } | null>(null);
  const [bulkQuantity, setBulkQuantity] = useState(20);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(cartKey) || "[]");
      if (Array.isArray(saved)) setCart(saved);
    } catch {
      /* Ignore an invalid local cart. */
    }
  }, []);
  useEffect(() => setAuth(readAuthState()), []);
  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    setProductsError("");

    fetch(`${apiUrl}/products`)
      .then(async (response) => {
        const result = (await response.json()) as {
          data?: Array<{
            id: string;
            name: string;
            type: string;
            category: "main" | "bac";
            basePrice: number;
            sizes: string[];
            images?: string[];
            description?: string;
            colors?: string[];
            fabrics?: Array<{ name: string; price: number }>;
          }>;
          message?: string;
        };
        if (!response.ok) throw new Error(result.message || "Unable to load products.");
        return result.data ?? [];
      })
      .then((remoteProducts) => {
        if (cancelled) return;
        const remote = remoteProducts.map((product, index) => ({
          id: product.id,
          name: product.name.toUpperCase(),
          type: product.type,
          category: product.category,
          price: product.basePrice,
          image: product.images?.[0] || featuredProducts[index % featuredProducts.length].image,
          tag: `${String(index + 1).padStart(2, "0")} / ${product.category === "bac" ? "2K27" : "ADMIN"}`,
          sizes: product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL"],
          description: product.description,
          colors: product.colors,
          fabrics: product.fabrics,
        }));
        const remoteIds = new Set(remote.map((product) => product.id));
        setProducts([
          ...remote,
          ...featuredProducts.filter((product) => !remoteIds.has(product.id)),
        ]);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setProductsError(
          requestError instanceof Error ? requestError.message : "Unable to load products.",
        );
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    window.localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    document.body.style.overflow =
      cartOpen || formOpen || authOpen || selectedProduct ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, formOpen, authOpen, selectedProduct]);

  function openAuth(mode: "login" | "register" = "login") {
    setAuthMode(mode);
    setAuthError("");
    setAuthOpen(true);
  }

  function logout() {
    window.localStorage.removeItem(authKey);
    setAuth(null);
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authSubmitting) return;
    setAuthSubmitting(true);
    setAuthError("");
    const values = new FormData(event.currentTarget);
    const body = {
      ...(authMode === "register" ? { name: String(values.get("name") || "").trim() } : {}),
      email: String(values.get("email") || "")
        .trim()
        .toLowerCase(),
      ...(authMode === "register" ? { phone: String(values.get("phone") || "").trim() } : {}),
      password: String(values.get("password") || ""),
    };
    try {
      const response = await fetch(`${apiUrl}/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        data?: AuthState;
        message?: string;
      };
      if (!response.ok || !result.data?.token || !result.data.user) {
        throw new Error(result.message || "Unable to authenticate. Please try again.");
      }
      const nextAuth = result.data;
      window.localStorage.setItem(authKey, JSON.stringify(nextAuth));
      setAuth(nextAuth);
      setAuthOpen(false);
      if (nextAuth.user.role === "admin") {
        void navigate({ to: "/admin" });
      }
    } catch (requestError) {
      setAuthError(
        requestError instanceof Error ? requestError.message : "Unable to authenticate.",
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + (products.find((p) => p.id === item.id)?.price || 0) * item.quantity,
    0,
  );
  function addToCart(product: Product, size: string, customization?: BacCustomization) {
    setCart((current) => {
      const match = current.find(
        (item) =>
          item.id === product.id &&
          item.size === size &&
          customizationKey(item.customization) === customizationKey(customization),
      );
      return match
        ? current.map((item) => (item === match ? { ...item, quantity: item.quantity + 1 } : item))
        : [...current, { id: product.id, size, quantity: 1, customization }];
    });
    setCartOpen(true);
  }
  function changeQuantity(itemToChange: CartItem, change: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === itemToChange.id &&
          item.size === itemToChange.size &&
          customizationKey(item.customization) === customizationKey(itemToChange.customization)
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }
  function openForm(type: "preorder" | "bulk") {
    setCartOpen(false);
    setFormOpen(type);
    setSubmitted(false);
    setError("");
  }
  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !formOpen) return;
    setSubmitting(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const items =
      formOpen === "preorder"
        ? cart.map((item) => ({
            product: products.find((p) => p.id === item.id)?.name || item.id,
            category: products.find((p) => p.id === item.id)?.category || "main",
            size: item.size,
            quantity: item.quantity,
            customization: item.customization || null,
          }))
        : [{ product: "BAC 2K27 capsule", quantity: bulkQuantity }];
    const { error: submitError } = await supabase.from("preorder_requests").insert({
      customer_name: String(values.get("name") || "").trim(),
      email: String(values.get("email") || "").trim(),
      phone: String(values.get("phone") || "").trim(),
      governorate: String(values.get("governorate") || "").trim(),
      school: String(values.get("school") || "").trim() || null,
      request_type: formOpen,
      items,
      quantity: formOpen === "preorder" ? count : bulkQuantity,
      notes: String(values.get("notes") || "").trim() || null,
    });
    setSubmitting(false);
    if (submitError) {
      setError("We couldn't send your request. Please try again.");
      return;
    }
    setSubmitted(true);
    if (formOpen === "preorder") setCart([]);
  }

  const catalog = products.filter(
    (product) => product.category === (view === "bac" ? "bac" : "main"),
  );
  const handleAdd = (product: Product, size: string) =>
    view === "bac" ? setCustomizing({ product, size }) : addToCart(product, size);
  return (
    <div className="site-shell">
      <div className="announcement">
        <Zap size={13} fill="currentColor" /> INDEPENDENT UNIFORM FOR THE NEXT GENERATION{" "}
        <Zap size={13} fill="currentColor" />
      </div>
      <header className="site-header">
        <Link to="/" className="brand" aria-label="AZIX home">
          AZIX<span className="brand-dot">.</span>
        </Link>
        <nav className={`main-nav ${mobileOpen ? "nav-open" : ""}`} aria-label="Main navigation">
          <Link
            to="/clothes"
            onClick={() => setMobileOpen(false)}
            className={view === "clothes" ? "active" : ""}
          >
            CLOTHES
          </Link>
          <Link
            to="/bac"
            onClick={() => setMobileOpen(false)}
            className={view === "bac" ? "active" : ""}
          >
            BAC 2K27 <Zap size={12} fill="currentColor" />
          </Link>
          {auth?.user.role === "admin" && (
            <Link to="/admin" onClick={() => setMobileOpen(false)}>
              DASHBOARD
            </Link>
          )}
        </nav>
        <div className="header-actions">
          <span className="header-edition">EST. FOR WHAT'S NEXT</span>
          {auth ? (
            <Button variant="ghost" className="auth-trigger" onClick={logout} aria-label="Log out">
              {auth.user.name.split(" ")[0].toUpperCase()} / LOG OUT
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="auth-trigger"
              onClick={() => openAuth()}
              aria-label="Open login"
            >
              LOG IN
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Open bag, ${count} items`}
            className="bag-trigger"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={20} />
            <span>{count}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      {productsLoading && <p className="storefront-status">Loading latest products...</p>}
      {productsError && (
        <p className="storefront-status storefront-status-error">{productsError}</p>
      )}

      {view === "home" && (
        <main>
          <section className="hero">
            <img
              src={heroImage}
              alt="AZIX oversized black streetwear in a concrete tunnel with lightning"
              className="hero-image"
              width={1536}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />
            <div className="hero-shade" />
            <div className="lightning-overlay" aria-hidden="true">
              <svg viewBox="0 0 400 700" preserveAspectRatio="none">
                <path d="M216 -20 177 111 202 151 144 258 169 287 103 423 133 431 38 713" />
                <path d="M145 259 250 231 290 151" />
                <path d="M103 423 229 467 272 549" />
              </svg>
            </div>
            <div className="hero-content">
              <span className="eyebrow">
                <span className="live-dot" /> NEW ERA / NO RULES
              </span>
              <h1>
                WEAR THE
                <br />
                <em>VOLTAGE.</em>
              </h1>
              <p>
                Built different. Worn louder. Everyday essentials for the ones who refuse to blend
                in.
              </p>
              <div className="hero-buttons">
                <Button asChild className="button-light">
                  <Link to="/clothes">
                    SHOP CLOTHES <ArrowUpRight size={17} />
                  </Link>
                </Button>{" "}
                <Button asChild variant="outline" className="button-outline-light">
                  <Link to="/bac">
                    EXPLORE BAC 2K27 <ArrowRight size={17} />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hero-bottom">
              <span>AZIX / DROP 001</span>
              <span>
                SCROLL TO EXPLORE <ArrowDown size={14} />
              </span>
            </div>
          </section>
          <Ticker />
          <section className="collection-section" id="collection">
            <div className="section-heading">
              <div>
                <span className="section-kicker">01 / THE EVERYDAY UNIFORM</span>
                <h2>
                  THE CORE
                  <br />
                  <i>COLLECTION.</i>
                </h2>
              </div>
              <div className="section-aside">
                <p>Uncompromising shapes. Everyday armor. Designed to move how you move.</p>
                <Link to="/clothes" className="text-link">
                  VIEW ALL CLOTHES <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
            <div className="product-grid">
              {catalog.map((p) => (
                <ProductCard
                  product={p}
                  onAdd={addToCart}
                  onViewDetails={setSelectedProduct}
                  key={p.id}
                />
              ))}
            </div>
          </section>
          <section className="bac-teaser">
            <div className="bac-teaser-image">
              <img
                src={bacImage}
                alt="Class of 2027 wearing streetwear beneath lightning"
                width={768}
                height={1024}
                loading="lazy"
              />
            </div>
            <div className="bac-teaser-content">
              <span className="section-kicker">02 / LIMITED CAPSULE</span>
              <ElectricBadge />
              <h2>
                THE FUTURE
                <br />
                LOOKS <i>LOUD.</i>
              </h2>
              <p>One class. One moment. A collection made to mark the year you'll never forget.</p>
              <Countdown />
              <Button asChild className="button-light">
                <Link to="/bac">
                  ENTER THE 2K27 DROP <ArrowUpRight size={17} />
                </Link>
              </Button>
            </div>
          </section>
        </main>
      )}

      {view === "clothes" && (
        <main>
          <section className="page-intro clothes-intro">
            <span className="section-kicker">AZIX / DROP 001</span>
            <h1>
              THE CORE
              <br />
              <i>COLLECTION.</i>
            </h1>
            <p>Oversized silhouettes. Heavyweight feel. Nothing extra, everything intentional.</p>
            <span className="intro-number">001 — 003</span>
          </section>
          <Ticker />
          <section className="collection-section catalog-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">ESSENTIALS / NO COMPROMISE</span>
                <h2>
                  BUILT TO
                  <br />
                  <i>STAND OUT.</i>
                </h2>
              </div>
              <div className="section-aside">
                <p>Find your fit. Select your size. Make it yours.</p>
                <span className="item-count">03 PIECES</span>
              </div>
            </div>
            <div className="product-grid">
              {catalog.map((p) => (
                <ProductCard
                  product={p}
                  onAdd={addToCart}
                  onViewDetails={setSelectedProduct}
                  key={p.id}
                />
              ))}
            </div>
          </section>
        </main>
      )}

      {view === "bac" && (
        <main>
          <section className="bac-hero">
            <div className="bac-hero-visual">
              <img
                src={bacImage}
                alt="Class of 2027 capsule campaign with lightning"
                width={768}
                height={1024}
              />
              <div className="bac-photo-label">CLASS OF 2027 / THE CAPSULE</div>
            </div>
            <div className="bac-hero-content">
              <span className="section-kicker">LIMITED CAPSULE / CLASS OF 2027</span>
              <ElectricBadge />
              <h1>
                THIS IS
                <br />
                <i>YOUR YEAR.</i>
              </h1>
              <p>
                For the late nights, the last bell, and everything that comes next. Your class. Your
                moment. Your uniform.
              </p>
              <div className="countdown-label">COUNTING DOWN TO THE CLASS OF 2027</div>
              <Countdown />
              <div className="bac-hero-buttons">
                <Button
                  className="button-light"
                  onClick={() => navigate({ to: "/bac", hash: "capsule" })}
                >
                  SHOP THE CAPSULE <ArrowDown size={17} />
                </Button>
                <Button
                  variant="outline"
                  className="button-outline-light"
                  onClick={() => openForm("bulk")}
                >
                  BULK INQUIRY <ArrowUpRight size={17} />
                </Button>
              </div>
            </div>
          </section>
          <Ticker />
          <section className="collection-section catalog-section" id="capsule">
            <div className="section-heading">
              <div>
                <span className="section-kicker">02 / YOUR YEAR, YOUR GEAR</span>
                <h2>
                  THE 2K27
                  <br />
                  <i>CAPSULE.</i>
                </h2>
              </div>
              <div className="section-aside">
                <p>Made for the memories you haven't made yet. Pre-order your piece of the year.</p>
                <span className="item-count">LIMITED RELEASE</span>
              </div>
            </div>
            <div className="product-grid capsule-grid">
              {catalog.map((p) => (
                <ProductCard
                  product={p}
                  onAdd={handleAdd}
                  onViewDetails={setSelectedProduct}
                  key={p.id}
                />
              ))}
              <div className="bulk-panel">
                <Zap size={33} fill="currentColor" />
                <span>FOR THE WHOLE CLASS</span>
                <h3>
                  BETTER
                  <br />
                  TOGETHER.
                </h3>
                <p>
                  Outfit your whole class in AZIX. Tell us what you need and we'll take it from
                  there.
                </p>
                <Button className="button-light" onClick={() => openForm("bulk")}>
                  ASK ABOUT BULK ORDERS <ArrowUpRight size={16} />
                </Button>
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer">
        <div className="footer-top">
          <Link to="/" className="footer-brand">
            AZIX<span>.</span>
          </Link>
          <p>
            NOT MADE TO FIT IN.
            <br />
            MADE TO STAND OUT.
          </p>
          <div>
            <Link to="/clothes">
              CLOTHES <ArrowUpRight size={15} />
            </Link>
            <Link to="/bac">
              BAC 2K27 <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AZIX. ALL RIGHTS RESERVED.</span>
          <span>
            POWERED BY THE NEXT GENERATION <Zap size={12} fill="currentColor" />
          </span>
        </div>
      </footer>

      {customizing && (
        <BacCustomizer
          onClose={() => setCustomizing(null)}
          onSubmit={(customization) => {
            addToCart(customizing.product, customizing.size, customization);
            setCustomizing(null);
            setCartOpen(true);
          }}
        />
      )}
      {cartOpen && (
        <div className="drawer-layer">
          <div className="drawer-backdrop" onClick={() => setCartOpen(false)} />
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
            <div className="drawer-header">
              <div>
                <span className="section-kicker">AZIX / YOUR SELECTION</span>
                <h2>
                  YOUR BAG <sup>{count}</sup>
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close bag"
                onClick={() => setCartOpen(false)}
              >
                <X />
              </Button>
            </div>
            <div className="drawer-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingBag size={40} strokeWidth={1} />
                  <h3>NOTHING IN HERE YET.</h3>
                  <p>Good things start with a choice.</p>
                  <Button
                    onClick={() => {
                      setCartOpen(false);
                      navigate({ to: "/clothes" });
                    }}
                  >
                    SHOP CLOTHES <ArrowRight size={16} />
                  </Button>
                </div>
              ) : (
                cart.map((item) => {
                  const product = products.find((p) => p.id === item.id);
                  if (!product) return null;
                  return (
                    <div
                      className="cart-line"
                      key={`${item.id}-${item.size}-${customizationKey(item.customization)}`}
                    >
                      <img src={product.image} alt="" width={768} height={1024} />
                      <div>
                        <h3>{product.name}</h3>
                        <span>SIZE {item.size}</span>
                        <strong>{money(product.price * item.quantity)}</strong>
                        <div className="quantity-control">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove one ${product.name}`}
                            onClick={() => changeQuantity(item, -1)}
                          >
                            <Minus size={14} />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Add one ${product.name}`}
                            onClick={() => changeQuantity(item, 1)}
                          >
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {cart.length > 0 && (
              <div className="drawer-footer">
                <div className="subtotal">
                  <span>ESTIMATED TOTAL</span>
                  <strong>{money(total)}</strong>
                </div>
                <p>
                  Pre-orders are requests, not payments. We’ll follow up with availability and next
                  steps.
                </p>
                <Button className="checkout-button" onClick={() => openForm("preorder")}>
                  REQUEST PRE-ORDER <ArrowUpRight size={17} />
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      {formOpen && (
        <div className="modal-layer">
          <div className="modal-backdrop" onClick={() => setFormOpen(null)} />
          <div
            className="inquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-label={formOpen === "bulk" ? "Bulk inquiry" : "Pre-order request"}
          >
            <Button
              variant="ghost"
              size="icon"
              className="modal-close"
              aria-label="Close form"
              onClick={() => setFormOpen(null)}
            >
              <X />
            </Button>
            {submitted ? (
              <div className="success-state">
                <span className="success-icon">
                  <Check size={31} />
                </span>
                <span className="section-kicker">REQUEST RECEIVED</span>
                <h2>
                  YOU'RE ON
                  <br />
                  THE LIST.
                </h2>
                <p>
                  Thanks for reaching out. We’ll follow up by email with details and next steps.
                </p>
                <Button onClick={() => setFormOpen(null)}>
                  BACK TO AZIX <ArrowRight size={16} />
                </Button>
              </div>
            ) : (
              <>
                <span className="section-kicker">
                  AZIX / {formOpen === "bulk" ? "CLASS ORDERS" : "YOUR REQUEST"}
                </span>
                <h2>
                  {formOpen === "bulk" ? (
                    <>
                      OUTFIT THE
                      <br />
                      <i>WHOLE CLASS.</i>
                    </>
                  ) : (
                    <>
                      MAKE IT
                      <br />
                      <i>YOURS.</i>
                    </>
                  )}
                </h2>
                <p className="form-description">
                  {formOpen === "bulk"
                    ? "Tell us about your class order and we'll get back to you with the details."
                    : "Send your selection and we'll follow up to confirm availability and how to order."}
                </p>
                <form onSubmit={submitRequest}>
                  <div className="form-row">
                    <label>
                      YOUR NAME
                      <input
                        name="name"
                        required
                        minLength={2}
                        maxLength={120}
                        placeholder="Full name"
                      />
                    </label>
                    <label>
                      EMAIL ADDRESS
                      <input
                        type="email"
                        name="email"
                        required
                        maxLength={254}
                        placeholder="you@example.com"
                      />
                    </label>
                  </div>
                  {formOpen === "preorder" && (
                    <div className="form-row">
                      <label>
                        PHONE
                        <input
                          name="phone"
                          required
                          pattern="^\\+216\\s?[2-9]\\d\\s?\\d{3}\\s?\\d{3}$"
                          placeholder="+216 20 123 456"
                        />
                      </label>
                      <label>
                        GOVERNORATE
                        <select name="governorate" required defaultValue="">
                          <option value="" disabled>
                            Select governorate
                          </option>
                          {[
                            "Tunis",
                            "Ariana",
                            "Ben Arous",
                            "Manouba",
                            "Sfax",
                            "Sousse",
                            "Nabeul",
                            "Monastir",
                            "Bizerte",
                            "Gabès",
                            "Médenine",
                            "Kairouan",
                            "Kasserine",
                            "Gafsa",
                            "Jendouba",
                            "Mahdia",
                            "Siliana",
                            "Le Kef",
                            "Zaghouan",
                            "Béja",
                            "Tozeur",
                            "Kébili",
                            "Tataouine",
                          ].map((governorate) => (
                            <option key={governorate}>{governorate}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  {formOpen === "bulk" && (
                    <div className="form-row">
                      <label>
                        SCHOOL / GROUP
                        <input name="school" placeholder="Your school or group" />
                      </label>
                      <label>
                        ESTIMATED QUANTITY
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={bulkQuantity}
                          onChange={(e) => setBulkQuantity(Number(e.target.value))}
                          required
                        />
                      </label>
                    </div>
                  )}
                  {formOpen === "preorder" && (
                    <div className="order-summary">
                      {cart.map((item) => (
                        <div
                          key={`${item.id}-${item.size}-${customizationKey(item.customization)}`}
                        >
                          <span>
                            {products.find((p) => p.id === item.id)?.name} / {item.size} ×{" "}
                            {item.quantity}
                          </span>
                          <strong>
                            {money(
                              (products.find((p) => p.id === item.id)?.price || 0) * item.quantity,
                            )}
                          </strong>
                        </div>
                      ))}
                      <div className="order-total">
                        <span>ESTIMATED TOTAL</span>
                        <strong>{money(total)}</strong>
                      </div>
                    </div>
                  )}
                  <label>
                    ANYTHING ELSE? <span className="optional">OPTIONAL</span>
                    <textarea
                      name="notes"
                      maxLength={2000}
                      rows={3}
                      placeholder="Tell us more about what you need"
                    />
                  </label>
                  {error && (
                    <p role="alert" className="form-error">
                      {error}
                    </p>
                  )}
                  <Button className="submit-button" type="submit" disabled={submitting}>
                    {submitting
                      ? "SENDING..."
                      : formOpen === "bulk"
                        ? "SEND BULK INQUIRY"
                        : "SEND PRE-ORDER REQUEST"}{" "}
                    <ArrowUpRight size={17} />
                  </Button>
                  <p className="form-footnote">
                    No payment is taken now. We'll contact you by email.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {authOpen && (
        <div className="modal-layer">
          <div className="modal-backdrop" onClick={() => setAuthOpen(false)} />
          <div
            className="inquiry-modal auth-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Account"
          >
            <Button
              variant="ghost"
              size="icon"
              className="modal-close"
              aria-label="Close account form"
              onClick={() => setAuthOpen(false)}
            >
              <X />
            </Button>
            <span className="section-kicker">AZIX / YOUR ACCOUNT</span>
            <h2>
              {authMode === "login" ? (
                <>
                  WELCOME <i>BACK.</i>
                </>
              ) : (
                <>
                  JOIN THE <i>VOLTAGE.</i>
                </>
              )}
            </h2>
            <p className="form-description">
              {authMode === "login"
                ? "Sign in to keep your AZIX details close."
                : "Create an account to make future requests faster."}
            </p>
            <form onSubmit={submitAuth}>
              {authMode === "register" && (
                <label>
                  YOUR NAME
                  <input name="name" autoComplete="name" required minLength={2} maxLength={100} />
                </label>
              )}
              <label>
                EMAIL ADDRESS
                <input name="email" type="email" autoComplete="email" required />
              </label>
              {authMode === "register" && (
                <label>
                  PHONE <span className="optional">OPTIONAL</span>
                  <input name="phone" type="tel" autoComplete="tel" maxLength={30} />
                </label>
              )}
              <label>
                PASSWORD
                <input
                  name="password"
                  type="password"
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                />
              </label>
              {authError && (
                <p className="form-error" role="alert">
                  {authError}
                </p>
              )}
              <Button className="submit-button" type="submit" disabled={authSubmitting}>
                {authSubmitting
                  ? "PLEASE WAIT..."
                  : authMode === "login"
                    ? "LOG IN"
                    : "CREATE ACCOUNT"}
                <ArrowUpRight size={17} />
              </Button>
            </form>
            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthError("");
              }}
            >
              {authMode === "login" ? "Need an account? REGISTER" : "Already registered? LOG IN"}
            </button>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={view === "bac" ? (product, size) => setCustomizing({ product, size }) : addToCart}
        />
      )}
    </div>
  );
}

function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i}>
            AZIX <Zap size={17} fill="currentColor" /> BUILT DIFFERENT{" "}
            <Zap size={17} fill="currentColor" /> WEAR THE VOLTAGE{" "}
            <Zap size={17} fill="currentColor" />
          </span>
        ))}
      </div>
    </div>
  );
}
