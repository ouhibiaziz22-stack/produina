import type { RequestHandler } from "express";
import { supabase } from "../config/database.js";
import { mapUser } from "../repositories/supabaseRepository.js";
import { publicUser } from "../services/tokenService.js";
import { AppError } from "../utils/AppError.js";

const count = async (table: string) => {
  const result = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
};

export const dashboard: RequestHandler = async (_request, response) => {
  const [users, products, orders, productRows, orderRows] = await Promise.all([
    count("users"),
    count("products"),
    count("orders"),
    supabase
      .from("products")
      .select("id,name,stock,active")
      .order("stock", { ascending: true }),
    supabase
      .from("orders")
      .select("id,total,status,created_at,users(name,email)")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  if (productRows.error) throw new Error(productRows.error.message);
  if (orderRows.error) throw new Error(orderRows.error.message);
  const allOrders = orderRows.data ?? [];
  const openStatuses = new Set(["new", "confirmed", "preparing"]);
  const revenue = allOrders.reduce(
    (sum, order) =>
      order.status === "cancelled" ? sum : sum + Number(order.total ?? 0),
    0,
  );
  const recentOrders = allOrders.slice(0, 10);
  response.json({
    success: true,
    data: {
      users,
      products,
      orders,
      revenue,
      totalUsers: users,
      totalProducts: products,
      totalOrders: orders,
      totalRevenue: revenue,
      openOrders: allOrders.filter((order) =>
        openStatuses.has(String(order.status)),
      ).length,
      lowStock: (productRows.data ?? []).filter(
        (product) => Number(product.stock ?? 0) < 5,
      ).length,
      recentOrders,
      productsByStatus: {
        active: (productRows.data ?? []).filter((product) => product.active)
          .length,
        inactive: (productRows.data ?? []).filter((product) => !product.active)
          .length,
      },
    },
  });
};

export const listAdminUsers: RequestHandler = async (request, response) => {
  const search =
    typeof request.query.search === "string" ? request.query.search.trim() : "";
  const role =
    request.query.role === "admin" || request.query.role === "user"
      ? request.query.role
      : undefined;
  const page = Math.max(1, Number(request.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 25));
  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (search)
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  if (role) query = query.eq("role", role);
  const result = await query.range((page - 1) * limit, page * limit - 1);
  if (result.error) throw new Error(result.error.message);
  response.json({
    success: true,
    data: (result.data ?? []).map((row) => publicUser(mapUser(row))),
    meta: { page, limit, total: result.count ?? 0 },
  });
};

export const listNotifications: RequestHandler = async (request, response) => {
  const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 30));
  const since =
    typeof request.query.since === "string" ? request.query.since : undefined;
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (since) query = query.gt("created_at", since);
  const result = await query;
  if (result.error) {
    if (
      result.error.code === "42P01" ||
      result.error.code === "PGRST205" ||
      result.error.message.toLowerCase().includes("could not find the table")
    ) {
      response.json({ success: true, data: [] });
      return;
    }
    throw new Error(result.error.message);
  }
  response.json({
    success: true,
    data: (result.data ?? []).map((notification) => ({
      ...notification,
      read: Boolean(notification.read_at),
      isRead: Boolean(notification.read_at),
    })),
  });
};

export const markNotificationRead: RequestHandler = async (
  request,
  response,
) => {
  const result = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", request.params.id)
    .select("*")
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new AppError("Notification not found", 404);
  response.json({ success: true, data: result.data });
};

export const markAllNotificationsRead: RequestHandler = async (
  _request,
  response,
) => {
  const result = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  response.json({ success: true, data: { updated: result.data?.length ?? 0 } });
};
