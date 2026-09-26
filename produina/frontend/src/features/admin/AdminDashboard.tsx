import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  Check,
  ChevronDown,
  ClipboardList,
  DollarSign,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { apiRequest, clearAuth, readAuth, saveAuth, type AuthState } from "@/lib/api";

type User = { id: string; name: string; email: string; role: string };
type Section = "overview" | "products" | "orders" | "preorders" | "users" | "finance";
type Preorder = {
  id: string;
  request_type: "preorder" | "bulk";
  customer_name: string;
  email: string;
  phone: string;
  governorate: string;
  school: string | null;
  quantity: number;
  estimated_total: number;
  notes: string | null;
  status: string;
  created_at: string;
  items: Array<{
    product: string;
    size?: string;
    quantity: number;
    customization?: { studentName: string; lycee: string; section: string } | null;
  }>;
};
type Product = {
  id: string;
  name: string;
  type: string;
  category: "main" | "bac";
  basePrice: number;
  stock: number;
  active: boolean;
  description: string;
  colors: string[];
  fabrics: { name: string; price: number }[];
  sizes: string[];
  images: string[];
};
type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  users?: { name?: string; email?: string };
};
type DashboardData = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  openOrders: number;
  lowStock: number;
  productsByStatus: { active: number; inactive: number };
  recentOrders: Order[];
};
type AdminUser = User & { createdAt?: string };
type Notification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read?: boolean;
  metadata?: { orderId?: string; preorderId?: string; status?: string };
};

const statuses = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
const preorderStatuses = ["new", "contacted", "confirmed", "converted", "cancelled"];

function getAuth(): AuthState | null {
  const value = readAuth();
  return value?.user.role === "admin" ? value : null;
}

function request<T>(
  path: string,
  token: string,
  options: { method?: string; body?: unknown } = {},
) {
  return apiRequest<T>(path, { token, ...options });
}

function money(value: number) {
  return new Intl.NumberFormat("en-TN", { style: "currency", currency: "TND" }).format(value);
}

export function AdminDashboard() {
  const [auth, setAuth] = useState<AuthState | null>(() =>
    typeof window === "undefined" ? null : getAuth(),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [section, setSection] = useState<Section>("overview");
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const loadData = useCallback(async (currentAuth: AuthState | null) => {
    if (!currentAuth) return;
    setLoading(true);
    setError("");
    try {
      const [nextProducts, nextOrders, nextDashboard, nextUsers, nextNotifications, nextPreorders] =
        await Promise.all([
          request<Product[]>("/products?includeInactive=true", currentAuth.token),
          request<Order[]>("/orders", currentAuth.token),
          request<DashboardData>("/admin/dashboard", currentAuth.token),
          request<AdminUser[]>("/admin/users?limit=100", currentAuth.token),
          request<Notification[]>("/admin/notifications", currentAuth.token).catch(() => []),
          request<Preorder[]>("/preorders", currentAuth.token),
        ]);
      setProducts(nextProducts);
      setOrders(nextOrders);
      setDashboard(nextDashboard);
      setUsers(nextUsers);
      setNotifications(nextNotifications);
      setPreorders(nextPreorders);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(auth);
  }, [auth, loadData]);

  useEffect(() => {
    if (!auth) return;
    const poll = window.setInterval(async () => {
      try {
        const next = await request<Notification[]>("/admin/notifications?limit=30", auth.token);
        setNotifications(next);
      } catch {
        // The dashboard keeps its current data when a polling request fails.
      }
    }, 15000);
    return () => window.clearInterval(poll);
  }, [auth]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const nextAuth = await apiRequest<AuthState>("/auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      if (nextAuth.user.role !== "admin")
        throw new Error("This account does not have administrator access.");
      saveAuth(nextAuth);
      setAuth(nextAuth);
      setPassword("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAuth();
    setAuth(null);
  }

  async function updateProduct(id: string, values: Partial<Product>) {
    if (!auth) return;
    try {
      const updated = await request<Product>(`/products/${id}`, auth.token, {
        method: "PUT",
        body: values,
      });
      setProducts((current) => current.map((product) => (product.id === id ? updated : product)));
      setNotice("Product updated.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update product.");
    }
  }

  async function removeProduct(id: string) {
    if (!auth || !window.confirm("Remove this product permanently?")) return;
    try {
      await request<void>(`/products/${id}`, auth.token, { method: "DELETE" });
      setProducts((current) => current.filter((product) => product.id !== id));
      setNotice("Product removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove product.");
    }
  }

  async function updateOrder(id: string, status: string) {
    if (!auth) return;
    try {
      const updated = await request<Order>(`/orders/${id}`, auth.token, {
        method: "PUT",
        body: { status },
      });
      setOrders((current) =>
        current.map((order) => (order.id === id ? { ...order, ...updated } : order)),
      );
      setNotice(`Order marked ${status}.`);
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Unable to update order.");
    }
  }

  async function updatePreorder(id: string, status: string) {
    if (!auth) return;
    try {
      const updated = await request<Preorder>(`/preorders/${id}`, auth.token, {
        method: "PATCH",
        body: { status },
      });
      setPreorders((current) => current.map((item) => (item.id === id ? updated : item)));
      setNotice(`Pre-order marked ${status}.`);
    } catch (preorderError) {
      setError(
        preorderError instanceof Error ? preorderError.message : "Unable to update pre-order.",
      );
    }
  }

  async function updateRole(id: string, role: string) {
    if (!auth) return;
    try {
      const updated = await request<AdminUser>(`/users/${id}/role`, auth.token, {
        method: "PUT",
        body: { role },
      });
      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, ...updated } : user)),
      );
      setNotice(`${updated.name} is now ${role === "admin" ? "an administrator" : "a customer"}.`);
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "Unable to change role.");
    }
  }

  const stats = useMemo(
    () => ({
      products: dashboard?.totalProducts ?? products.length,
      active:
        dashboard?.productsByStatus.active ?? products.filter((product) => product.active).length,
      lowStock: dashboard?.lowStock ?? products.filter((product) => product.stock < 5).length,
      pending:
        dashboard?.openOrders ??
        orders.filter((order) => ["new", "confirmed", "preparing"].includes(order.status)).length,
      orders: dashboard?.totalOrders ?? orders.length,
      revenue:
        dashboard?.totalRevenue ?? orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      users: dashboard?.totalUsers ?? users.length,
    }),
    [dashboard, products, orders, users],
  );

  if (!auth) {
    return (
      <main className="admin-login">
        <div className="admin-login-card">
          <Link to="/" className="admin-brand">
            AZIX<span>.</span>
          </Link>
          <p className="admin-eyebrow">PRIVATE CONTROL ROOM</p>
          <h1>Admin access.</h1>
          <p className="admin-muted">Sign in with the administrator account to manage the store.</p>
          {error && <div className="admin-alert admin-alert-error">{error}</div>}
          <form onSubmit={login} className="admin-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button className="admin-primary" disabled={loading}>
              {loading ? "SIGNING IN..." : "SIGN IN"} <ChevronDown size={16} />
            </button>
          </form>
          <Link to="/" className="admin-back">
            ← Back to store
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <Link to="/" className="admin-brand">
            AZIX<span>.</span>
          </Link>
          <p className="admin-eyebrow">ADMIN / CONTROL</p>
        </div>
        <nav className="admin-nav">
          <button
            className={section === "overview" ? "selected" : ""}
            onClick={() => setSection("overview")}
          >
            <Activity size={17} /> Overview
          </button>
          <button
            className={section === "products" ? "selected" : ""}
            onClick={() => setSection("products")}
          >
            <Package size={17} /> Products & stock
          </button>
          <button
            className={section === "orders" ? "selected" : ""}
            onClick={() => setSection("orders")}
          >
            <ShoppingCart size={17} /> Orders <b>{stats.pending}</b>
          </button>
          <button
            className={section === "preorders" ? "selected" : ""}
            onClick={() => setSection("preorders")}
          >
            <ClipboardList size={17} /> Pre-orders{" "}
            <b>{preorders.filter((item) => item.status === "new").length}</b>
          </button>
          <button
            className={section === "users" ? "selected" : ""}
            onClick={() => setSection("users")}
          >
            <Users size={17} /> Customers
          </button>
          <button
            className={section === "finance" ? "selected" : ""}
            onClick={() => setSection("finance")}
          >
            <DollarSign size={17} /> Finance
          </button>
        </nav>
        <button className="admin-logout" onClick={logout}>
          <LogOut size={16} /> Log out
        </button>
      </aside>
      <section className="admin-content">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">STORE OPERATIONS</p>
            <h1>
              {section === "overview"
                ? "Good to see you."
                : section === "products"
                  ? "Products & stock."
                  : section === "orders"
                    ? "Order queue."
                    : section === "preorders"
                      ? "Pre-orders & bulk."
                      : section === "users"
                        ? "Customers."
                        : "Finance."}
            </h1>
          </div>
          <div className="admin-user">
            <span>{auth.user.name}</span>
            <small>{auth.user.email}</small>
          </div>
          <div className="admin-notifications">
            <button aria-label="Notifications" onClick={() => setNotificationOpen((open) => !open)}>
              <Bell size={18} />
              {notifications.filter((notification) => !notification.read).length > 0 && (
                <b>{notifications.filter((notification) => !notification.read).length}</b>
              )}
            </button>
            {notificationOpen && (
              <div className="admin-notification-menu">
                <div className="panel-heading">
                  <h2>Notifications</h2>
                  <button
                    onClick={async () => {
                      await request("/admin/notifications/read-all", auth.token, {
                        method: "PATCH",
                      });
                      setNotifications((current) =>
                        current.map((item) => ({ ...item, read: true })),
                      );
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                {notifications.slice(0, 8).map((notification) => (
                  <button
                    className={`admin-notification ${notification.read ? "read" : ""}`}
                    key={notification.id}
                    onClick={async () => {
                      await request(`/admin/notifications/${notification.id}/read`, auth.token, {
                        method: "PATCH",
                      });
                      setNotifications((current) =>
                        current.map((item) =>
                          item.id === notification.id ? { ...item, read: true } : item,
                        ),
                      );
                      setSection(notification.metadata?.preorderId ? "preorders" : "orders");
                    }}
                  >
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <small>{new Date(notification.created_at).toLocaleString()}</small>
                  </button>
                ))}
                {notifications.length === 0 && <p className="admin-muted">No notifications yet.</p>}
              </div>
            )}
          </div>
        </header>
        {error && (
          <div className="admin-alert admin-alert-error">
            {error}
            <button onClick={() => setError("")}>
              <X size={15} />
            </button>
          </div>
        )}
        {notice && (
          <div className="admin-alert admin-alert-success">
            <Check size={15} /> {notice}
            <button onClick={() => setNotice("")}>
              <X size={15} />
            </button>
          </div>
        )}
        {section === "overview" && (
          <Overview stats={stats} products={products} orders={orders} setSection={setSection} />
        )}
        {section === "products" && (
          <ProductsPanel
            products={products.filter((product) =>
              product.name.toLowerCase().includes(productSearch.toLowerCase()),
            )}
            search={productSearch}
            onSearch={setProductSearch}
            loading={loading}
            onRefresh={() => loadData(auth)}
            onAdd={() => setShowAdd(true)}
            onUpdate={updateProduct}
            onRemove={removeProduct}
          />
        )}
        {section === "orders" && <OrdersPanel orders={orders} onUpdate={updateOrder} />}
        {section === "preorders" && (
          <PreordersPanel preorders={preorders} onUpdate={updatePreorder} />
        )}
        {section === "users" && (
          <UsersPanel users={users} currentUserId={auth.user.id} onRoleChange={updateRole} />
        )}
        {section === "finance" && <FinancePanel stats={stats} orders={orders} />}
        {showAdd && (
          <AddProduct
            onClose={() => setShowAdd(false)}
            onCreated={(product) => {
              setProducts((current) => [product, ...current]);
              setShowAdd(false);
              setNotice("Product added.");
            }}
            token={auth.token}
            onError={setError}
          />
        )}
      </section>
    </main>
  );
}

function Overview({
  stats,
  products,
  orders,
  setSection,
}: {
  stats: {
    products: number;
    active: number;
    lowStock: number;
    pending: number;
    orders: number;
    revenue: number;
    users: number;
  };
  products: Product[];
  orders: Order[];
  setSection: (section: Section) => void;
}) {
  return (
    <div className="admin-overview">
      <div className="admin-stat-grid">
        <Stat icon={<Package />} label="Total products" value={stats.products} />
        <Stat icon={<Store />} label="Visible in shop" value={stats.active} />
        <Stat icon={<RefreshCw />} label="Low stock" value={stats.lowStock} warning />
        <Stat icon={<ShoppingCart />} label="Open orders" value={stats.pending} />
        <Stat icon={<ShoppingCart />} label="Total orders" value={stats.orders} />
        <Stat icon={<Users />} label="Customers" value={stats.users} />
        <Stat icon={<DollarSign />} label="Revenue" value={stats.revenue} formatted />
      </div>
      <div className="admin-panels">
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="admin-eyebrow">INVENTORY WATCH</p>
              <h2>Stock levels</h2>
            </div>
            <button onClick={() => setSection("products")}>
              Manage <ChevronDown size={15} />
            </button>
          </div>
          <div className="stock-list">
            {products
              .filter((product) => product.stock < 10)
              .slice(0, 5)
              .map((product) => (
                <div className="stock-row" key={product.id}>
                  <span>
                    {product.name}
                    <small>{product.active ? "Live" : "Hidden"}</small>
                  </span>
                  <strong className={product.stock < 5 ? "stock-danger" : ""}>
                    {product.stock} left
                  </strong>
                </div>
              ))}
            {!products.some((product) => product.stock < 10) && (
              <p className="admin-muted">All products have healthy stock levels.</p>
            )}
          </div>
        </div>
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="admin-eyebrow">LATEST ACTIVITY</p>
              <h2>Recent orders</h2>
            </div>
            <button onClick={() => setSection("orders")}>
              View all <ChevronDown size={15} />
            </button>
          </div>
          <div className="stock-list">
            {orders.slice(0, 5).map((order) => (
              <div className="stock-row" key={order.id}>
                <span>
                  #{order.id.slice(0, 8)}
                  <small>{order.users?.name || "Customer"}</small>
                </span>
                <strong>{money(Number(order.total))}</strong>
              </div>
            ))}
            {orders.length === 0 && <p className="admin-muted">No orders yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  warning = false,
  formatted = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  warning?: boolean;
  formatted?: boolean;
}) {
  return (
    <div className={`admin-stat ${warning && value > 0 ? "warning" : ""}`}>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{formatted ? money(value) : value}</strong>
    </div>
  );
}

function ProductsPanel({
  products,
  search,
  onSearch,
  loading,
  onRefresh,
  onAdd,
  onUpdate,
  onRemove,
}: {
  products: Product[];
  search: string;
  onSearch: (value: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  onUpdate: (id: string, values: Partial<Product>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="admin-panel admin-table-panel">
      <div className="panel-heading">
        <div>
          <p className="admin-eyebrow">CATALOG / INVENTORY</p>
          <h2>Every product, one place.</h2>
        </div>
        <div className="panel-actions">
          <label className="admin-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search products"
            />
          </label>
          <button onClick={onRefresh} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="admin-primary small" onClick={onAdd}>
            <Plus size={15} /> Add product
          </button>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Shop visibility</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <small>
                    {product.category.toUpperCase()} / {product.type}
                  </small>
                </td>
                <td>{money(product.basePrice)}</td>
                <td>
                  <div className="stock-editor">
                    <button
                      onClick={() =>
                        onUpdate(product.id, { stock: Math.max(0, product.stock - 1) })
                      }
                    >
                      <ChevronDown size={14} />
                    </button>
                    <strong>{product.stock}</strong>
                    <button onClick={() => onUpdate(product.id, { stock: product.stock + 1 })}>
                      <Plus size={14} />
                    </button>
                  </div>
                </td>
                <td>
                  <button
                    className={`visibility-toggle ${product.active ? "on" : ""}`}
                    onClick={() => onUpdate(product.id, { active: !product.active })}
                  >
                    {product.active ? "LIVE" : "HIDDEN"}
                  </button>
                </td>
                <td>
                  <button
                    className="icon-danger"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => onRemove(product.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="admin-muted empty-state">No products found.</p>}
      </div>
    </div>
  );
}

function OrdersPanel({
  orders,
  onUpdate,
}: {
  orders: Order[];
  onUpdate: (id: string, status: string) => void;
}) {
  return (
    <div className="admin-panel admin-table-panel">
      <div className="panel-heading">
        <div>
          <p className="admin-eyebrow">FULFILLMENT</p>
          <h2>Accept and move orders forward.</h2>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>#{order.id.slice(0, 8)}</strong>
                </td>
                <td>
                  {order.users?.name || "Customer"}
                  <small>{order.users?.email}</small>
                </td>
                <td>{money(Number(order.total))}</td>
                <td>
                  <select
                    className={`status-select status-${order.status}`}
                    value={order.status}
                    onChange={(event) => onUpdate(order.id, event.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="admin-muted empty-state">No orders yet.</p>}
      </div>
    </div>
  );
}

function PreordersPanel({
  preorders,
  onUpdate,
}: {
  preorders: Preorder[];
  onUpdate: (id: string, status: string) => void;
}) {
  return (
    <div className="admin-panel admin-table-panel">
      <div className="panel-heading">
        <div>
          <p className="admin-eyebrow">REQUESTS / FOLLOW-UP</p>
          <h2>Contact every customer who asked.</h2>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Request</th>
              <th>Estimate</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {preorders.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.customer_name}</strong>
                  <small>{item.email}</small>
                  {item.phone && <small>{item.phone}</small>}
                  {(item.governorate || item.school) && (
                    <small>{[item.governorate, item.school].filter(Boolean).join(" / ")}</small>
                  )}
                </td>
                <td>
                  <strong>
                    {item.request_type === "bulk" ? "BULK" : "PRE-ORDER"} × {item.quantity}
                  </strong>
                  {item.items.map((line, index) => (
                    <small key={index}>
                      {line.product}
                      {line.size ? ` / ${line.size}` : ""} × {line.quantity}
                      {line.customization
                        ? ` — ${line.customization.studentName}, ${line.customization.lycee}, ${line.customization.section}`
                        : ""}
                    </small>
                  ))}
                  {item.notes && <small>“{item.notes}”</small>}
                </td>
                <td>{item.request_type === "bulk" ? "—" : money(Number(item.estimated_total))}</td>
                <td>
                  <select
                    className={`status-select status-${item.status}`}
                    value={item.status}
                    onChange={(event) => onUpdate(item.id, event.target.value)}
                  >
                    {preorderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(item.created_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {preorders.length === 0 && (
          <p className="admin-muted empty-state">No pre-order requests yet.</p>
        )}
      </div>
    </div>
  );
}

function UsersPanel({
  users,
  currentUserId,
  onRoleChange,
}: {
  users: AdminUser[];
  currentUserId: string;
  onRoleChange: (id: string, role: string) => void;
}) {
  return (
    <div className="admin-panel admin-table-panel">
      <div className="panel-heading">
        <div>
          <p className="admin-eyebrow">CUSTOMERS / ACCESS</p>
          <h2>Registered users.</h2>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    className="status-select"
                    value={user.role}
                    disabled={user.id === currentUserId}
                    title={
                      user.id === currentUserId ? "You cannot change your own role" : undefined
                    }
                    onChange={(event) => {
                      const role = event.target.value;
                      const message =
                        role === "admin"
                          ? `Give ${user.name} full administrator access?`
                          : `Remove administrator access from ${user.name}?`;
                      if (window.confirm(message)) onRoleChange(user.id, role);
                    }}
                  >
                    <option value="user">CUSTOMER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </td>
                <td>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="admin-muted empty-state">No users found.</p>}
      </div>
    </div>
  );
}

function FinancePanel({
  stats,
  orders,
}: {
  stats: { revenue: number; orders: number };
  orders: Order[];
}) {
  const completed = orders.filter((order) => order.status === "delivered");
  const cancelled = orders.filter((order) => order.status === "cancelled");
  const average = stats.orders ? stats.revenue / stats.orders : 0;
  return (
    <div className="admin-overview">
      <div className="admin-stat-grid">
        <Stat icon={<DollarSign />} label="Total revenue" value={stats.revenue} formatted />
        <Stat icon={<ShoppingCart />} label="Average order value" value={average} formatted />
        <Stat icon={<Check />} label="Completed orders" value={completed.length} />
        <Stat icon={<X />} label="Cancelled orders" value={cancelled.length} warning />
      </div>
      <div className="admin-panel admin-table-panel">
        <div className="panel-heading">
          <div>
            <p className="admin-eyebrow">REAL ORDER DATA</p>
            <h2>Revenue by order.</h2>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Date</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id.slice(0, 8)}</td>
                  <td>{order.status.toUpperCase()}</td>
                  <td>{new Date(order.created_at).toLocaleDateString("en-GB")}</td>
                  <td>{money(Number(order.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AddProduct({
  token,
  onClose,
  onCreated,
  onError,
}: {
  token: string;
  onClose: () => void;
  onCreated: (product: Product) => void;
  onError: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState("");

  useEffect(() => () => URL.revokeObjectURL(image), [image]);

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) {
      setFile(null);
      setImage("");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setImageError("Use a PNG, JPG, or WEBP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setFile(file);
    setImage(URL.createObjectURL(file));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setImageError("Please choose a product image.");
      return;
    }
    const values = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const upload = new FormData();
      upload.append("image", file);
      const { url } = await request<{ url: string }>("/uploads/image", token, {
        method: "POST",
        body: upload,
      });
      const product = await request<Product>("/products", token, {
        method: "POST",
        body: {
          category: values.get("category"),
          name: String(values.get("name")),
          type: values.get("type"),
          description: String(values.get("description")),
          basePrice: Number(values.get("basePrice")),
          stock: Number(values.get("stock")),
          colors: ["Black"],
          fabrics: [{ name: "Cotton", price: 0 }],
          sizes: ["S", "M", "L", "XL"],
          images: [url],
          active: true,
        },
      });
      onCreated(product);
    } catch (saveError) {
      onError(saveError instanceof Error ? saveError.message : "Unable to add product.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <div>
            <p className="admin-eyebrow">NEW CATALOG ITEM</p>
            <h2>Add product</h2>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <form onSubmit={submit} className="admin-form">
          <label>
            Name
            <input name="name" required minLength={2} />
          </label>
          <div className="admin-form-row">
            <label>
              Category
              <select name="category">
                <option value="main">Main collection</option>
                <option value="bac">BAC 2K27</option>
              </select>
            </label>
            <label>
              Type
              <select name="type">
                <option value="hoodie">Hoodie</option>
                <option value="tshirt">T-shirt</option>
                <option value="jacket">Jacket</option>
                <option value="polo">Polo</option>
                <option value="oversized">Oversized</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              Price (TND)
              <input name="basePrice" type="number" min="0" step="0.01" required />
            </label>
            <label>
              Initial stock
              <input name="stock" type="number" min="0" required />
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              required
              minLength={5}
              defaultValue="AZIX essential product."
            />
          </label>
          <label>
            Product image
            <input
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={selectImage}
              required
            />
            <small className="admin-field-help">PNG, JPG, or WEBP. Maximum 5 MB.</small>
          </label>
          {image && (
            <div className="admin-image-preview">
              <img src={image} alt="Product preview" />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImage("");
                }}
              >
                <X size={14} /> Remove image
              </button>
            </div>
          )}
          {imageError && <p className="admin-form-error">{imageError}</p>}
          <button className="admin-primary" disabled={saving}>
            {saving ? "ADDING..." : "ADD PRODUCT"} <Plus size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
