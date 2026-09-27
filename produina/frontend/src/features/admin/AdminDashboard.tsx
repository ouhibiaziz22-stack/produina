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
import {
  currentProfile,
  friendlyError,
  mapProduct,
  signIn,
  signOut,
  supabase,
  toProductRow,
  type Product,
  type Profile,
} from "@/lib/supabase";

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
type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  users?: { name?: string; email?: string } | undefined;
};
type AdminUser = { id: string; name: string; email: string; role: string; createdAt?: string };
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

function money(value: number) {
  return new Intl.NumberFormat("en-TN", { style: "currency", currency: "TND" }).format(value);
}

// Every query below runs as the signed-in admin; Row Level Security decides what it may see.
async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase()
    .from("notifications")
    .select("id,title,message,created_at,read_at,metadata")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, read: Boolean(row.read_at) }) as Notification);
}

async function fetchAdminData() {
  const db = supabase();
  const [products, orders, users, preorders, notifications] = await Promise.all([
    db.from("products").select("*").order("created_at", { ascending: false }),
    db
      .from("orders")
      .select("id,total,status,created_at,profiles(name,email)")
      .order("created_at", { ascending: false })
      .limit(1000),
    db
      .from("profiles")
      .select("id,name,email,role,created_at")
      .order("created_at", { ascending: false }),
    db.from("preorder_requests").select("*").order("created_at", { ascending: false }).limit(500),
    fetchNotifications().catch(() => [] as Notification[]),
  ]);
  for (const result of [products, orders, users, preorders]) if (result.error) throw result.error;
  return {
    products: (products.data ?? []).map(mapProduct),
    orders: (orders.data ?? []).map((row) => {
      const customer = row.profiles as unknown as { name?: string; email?: string } | null;
      return {
        id: row.id,
        total: Number(row.total),
        status: row.status,
        created_at: row.created_at,
        users: customer ?? undefined,
      } as Order;
    }),
    users: (users.data ?? []).map(
      (row) =>
        ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          createdAt: row.created_at,
        }) as AdminUser,
    ),
    preorders: (preorders.data ?? []) as Preorder[],
    notifications,
  };
}

export function AdminDashboard() {
  const [admin, setAdmin] = useState<Profile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [section, setSection] = useState<Section>("overview");
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    currentProfile()
      .then((profile) => setAdmin(profile?.role === "admin" ? profile : null))
      .catch(() => setAdmin(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await fetchAdminData();
      setProducts(next.products);
      setOrders(next.orders);
      setUsers(next.users);
      setPreorders(next.preorders);
      setNotifications(next.notifications);
    } catch (loadError) {
      setError(friendlyError(loadError, "Unable to load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) void loadData();
  }, [admin, loadData]);

  useEffect(() => {
    if (!admin) return;
    const poll = window.setInterval(async () => {
      try {
        setNotifications(await fetchNotifications());
      } catch {
        // The dashboard keeps its current data when a polling request fails.
      }
    }, 15000);
    return () => window.clearInterval(poll);
  }, [admin]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const profile = await signIn(email.trim().toLowerCase(), password);
      if (profile.role !== "admin") {
        await signOut();
        throw new Error("This account does not have administrator access.");
      }
      setAdmin(profile);
      setPassword("");
    } catch (loginError) {
      setError(friendlyError(loginError, "Unable to sign in."));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await signOut().catch(() => undefined);
    setAdmin(null);
  }

  async function updateProduct(id: string, values: Partial<Product>) {
    try {
      const { data, error: updateError } = await supabase()
        .from("products")
        .update({ ...toProductRow(values), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      if (updateError) throw updateError;
      const updated = mapProduct(data);
      setProducts((current) => current.map((product) => (product.id === id ? updated : product)));
      setNotice("Product updated.");
    } catch (updateError) {
      setError(friendlyError(updateError, "Unable to update product."));
    }
  }

  async function removeProduct(id: string) {
    if (!window.confirm("Remove this product permanently?")) return;
    try {
      const { error: removeError } = await supabase().from("products").delete().eq("id", id);
      if (removeError) throw removeError;
      setProducts((current) => current.filter((product) => product.id !== id));
      setNotice("Product removed.");
    } catch (removeError) {
      setError(friendlyError(removeError, "Unable to remove product."));
    }
  }

  async function updateOrder(id: string, status: string) {
    try {
      const { error: orderError } = await supabase()
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (orderError) throw orderError;
      setOrders((current) =>
        current.map((order) => (order.id === id ? { ...order, status } : order)),
      );
      setNotice(`Order marked ${status}.`);
    } catch (orderError) {
      setError(friendlyError(orderError, "Unable to update order."));
    }
  }

  async function updatePreorder(id: string, status: string) {
    try {
      const { data, error: preorderError } = await supabase()
        .from("preorder_requests")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single();
      if (preorderError) throw preorderError;
      setPreorders((current) =>
        current.map((item) => (item.id === id ? (data as Preorder) : item)),
      );
      setNotice(`Pre-order marked ${status}.`);
    } catch (preorderError) {
      setError(friendlyError(preorderError, "Unable to update pre-order."));
    }
  }

  async function updateRole(id: string, role: string) {
    try {
      const { data, error: roleError } = await supabase().rpc("set_user_role", {
        target_id: id,
        new_role: role,
      });
      if (roleError) throw roleError;
      const updated = data as { name: string; role: string };
      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, role: updated.role } : user)),
      );
      setNotice(`${updated.name} is now ${role === "admin" ? "an administrator" : "a customer"}.`);
    } catch (roleError) {
      setError(friendlyError(roleError, "Unable to change role."));
    }
  }

  async function markNotificationsRead(id?: string) {
    let query = supabase().from("notifications").update({ read_at: new Date().toISOString() });
    query = id ? query.eq("id", id) : query.is("read_at", null);
    const { error: readError } = await query;
    if (readError) throw readError;
    setNotifications((current) =>
      current.map((item) => (!id || item.id === id ? { ...item, read: true } : item)),
    );
  }

  const stats = useMemo(
    () => ({
      products: products.length,
      active: products.filter((product) => product.active).length,
      lowStock: products.filter((product) => product.stock < 5).length,
      pending: orders.filter((order) => ["new", "confirmed", "preparing"].includes(order.status))
        .length,
      orders: orders.length,
      revenue: orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
      users: users.length,
    }),
    [products, orders, users],
  );

  if (!authChecked) {
    return (
      <main className="admin-login">
        <p className="admin-muted">Loading…</p>
      </main>
    );
  }

  if (!admin) {
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
        <button className="admin-logout" onClick={() => void logout()}>
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
            <span>{admin.name}</span>
            <small>{admin.email}</small>
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
                    onClick={() =>
                      markNotificationsRead().catch((readError) =>
                        setError(friendlyError(readError)),
                      )
                    }
                  >
                    Mark all read
                  </button>
                </div>
                {notifications.slice(0, 8).map((notification) => (
                  <button
                    className={`admin-notification ${notification.read ? "read" : ""}`}
                    key={notification.id}
                    onClick={async () => {
                      await markNotificationsRead(notification.id).catch(() => undefined);
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
            onRefresh={() => void loadData()}
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
          <UsersPanel users={users} currentUserId={admin.id} onRoleChange={updateRole} />
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
  onClose,
  onCreated,
  onError,
}: {
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
      const extensions: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
      };
      const extension = extensions[file.type] ?? "png";
      const path = `products/${crypto.randomUUID()}.${extension}`;
      const storage = supabase().storage.from("product-images");
      const { error: uploadError } = await storage.upload(path, file, {
        contentType: file.type,
        cacheControl: "31536000",
      });
      if (uploadError) throw uploadError;
      const url = storage.getPublicUrl(path).data.publicUrl;
      const input = {
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
      } as unknown as Partial<Product>;
      const { data, error: insertError } = await supabase()
        .from("products")
        .insert(toProductRow(input))
        .select("*")
        .single();
      if (insertError) {
        await storage.remove([path]);
        throw insertError;
      }
      const product = mapProduct(data);
      onCreated(product);
    } catch (saveError) {
      onError(friendlyError(saveError, "Unable to add product."));
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
