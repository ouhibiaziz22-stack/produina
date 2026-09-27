import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The browser talks to Supabase directly with the public (publishable) key.
// Row Level Security and the database functions in supabase/migrations enforce every rule.
let client: SupabaseClient | undefined;

export function supabase(): SupabaseClient {
  if (!client) {
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) {
      throw new Error("The store is not configured yet. Please try again later.");
    }
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "azix-auth" },
    });
  }
  return client;
}

export type Profile = { id: string; name: string; email: string; phone?: string; role: string };

export type Product = {
  id: string;
  name: string;
  type: string;
  category: "main" | "bac";
  basePrice: number;
  stock: number;
  active: boolean;
  description: string;
  colors: string[];
  fabrics: Array<{ name: string; price: number }>;
  sizes: string[];
  images: string[];
};

type Row = Record<string, unknown>;

export function mapProduct(row: Row): Product {
  return {
    id: String(row["id"]),
    name: String(row["name"]),
    type: String(row["type"]),
    category: row["category"] === "bac" ? "bac" : "main",
    basePrice: Number(row["base_price"]),
    stock: Number(row["stock"] ?? 0),
    active: Boolean(row["active"]),
    description: String(row["description"] ?? ""),
    colors: (row["colors"] as string[]) ?? [],
    fabrics: (row["fabrics"] as Product["fabrics"]) ?? [],
    sizes: (row["sizes"] as string[]) ?? [],
    images: (row["images"] as string[]) ?? [],
  };
}

export function toProductRow(product: Partial<Product>) {
  const row: Row = {};
  if (product.name !== undefined) row["name"] = product.name;
  if (product.type !== undefined) row["type"] = product.type;
  if (product.category !== undefined) row["category"] = product.category;
  if (product.basePrice !== undefined) row["base_price"] = product.basePrice;
  if (product.stock !== undefined) row["stock"] = product.stock;
  if (product.active !== undefined) row["active"] = product.active;
  if (product.description !== undefined) row["description"] = product.description;
  if (product.colors !== undefined) row["colors"] = product.colors;
  if (product.fabrics !== undefined) row["fabrics"] = product.fabrics;
  if (product.sizes !== undefined) row["sizes"] = product.sizes;
  if (product.images !== undefined) row["images"] = product.images;
  return row;
}

// Supabase errors are often technical; map the common ones to something a shopper understands.
export function friendlyError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
  if (!message) return fallback;
  if (/failed to fetch|network/i.test(message)) {
    return "The store is unreachable right now. Check your connection and try again.";
  }
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email address first.";
  if (/user already registered/i.test(message)) return "An account already exists for this email.";
  if (/row-level security|permission denied/i.test(message))
    return "You don't have access to do that.";
  return message;
}

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase()
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function currentProfile(): Promise<Profile | null> {
  const { data: session } = await supabase().auth.getSession();
  const user = session.session?.user;
  if (!user) return null;
  const { data, error } = await supabase()
    .from("profiles")
    .select("id,name,email,phone,role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function signIn(email: string, password: string): Promise<Profile> {
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await currentProfile();
  if (!profile) throw new Error("Your account profile is missing. Please contact support.");
  return profile;
}

/** Returns the profile, or null when Supabase requires the user to confirm their email first. */
export async function signUp(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<Profile | null> {
  const { data, error } = await supabase().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { name: input.name, ...(input.phone ? { phone: input.phone } : {}) },
      ...(typeof window === "undefined" ? {} : { emailRedirectTo: window.location.origin }),
    },
  });
  if (error) throw error;
  return data.session ? currentProfile() : null;
}

export async function signOut() {
  await supabase().auth.signOut();
}

export async function submitPreorder(payload: Record<string, unknown>) {
  const { data, error } = await supabase().rpc("submit_preorder", { payload });
  if (error) throw error;
  return data as { received: boolean; id?: string };
}
