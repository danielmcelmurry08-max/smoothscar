import { PlanId, Prices } from "./content";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

export type Order = {
  id: string;
  order_number: string;
  plan: PlanId;
  plan_name: string;
  interval: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  shipping: number;
  total: number;
  discount?: number;
  discount_label?: string | null;
  applied_code?: string | null;
  referral_code?: string | null;
  currency: string;
  payment_method: string;
  customer: { full_name: string; email: string; phone: string; address: string; postal_code: string; clinic_name?: string | null };
  created_at: string;
  reminders_enabled?: boolean;
};

let authToken: string | null = null;
export const setAuthToken = (t: string | null) => {
  authToken = t;
};
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && authToken && (path.startsWith("/me") || path.startsWith("/auth/me"))) onUnauthorized?.();
  if (!res.ok) {
    const detail = (data as any)?.detail;
    throw new Error(typeof detail === "string" ? detail : "Please check your details and try again.");
  }
  return data as T;
}

export const createOrder = (body: unknown) => request<Order>("/orders", { method: "POST", body: JSON.stringify(body) });
export type CodePreview = { code: string; kind: "referral" | "reward"; label: string };
export const checkCode = (code: string) => request<CodePreview>(`/codes/${encodeURIComponent(code)}`);
export type ReferralStatus = { code: string; successful_count: number; friends_to_next_reward: number; rewards_earned: number; friend_discount: number; friends_per_reward: number };
export const getReferral = (code: string) => request<ReferralStatus>(`/referrals/${encodeURIComponent(code)}`);
export type User = { user_id: string; email: string | null; name: string | null; picture: string | null; provider: string };
export type AuthResponse = { session_token: string; user: User };
export const exchangeGoogleSession = (session_id: string) => request<AuthResponse>("/auth/session", { method: "POST", body: JSON.stringify({ session_id }) });
export const appleSignIn = (body: { identity_token: string; full_name: string | null; email: string | null }) =>
  request<AuthResponse>("/auth/apple", { method: "POST", body: JSON.stringify(body) });
export const getMe = () => request<User>("/auth/me");
export const logoutApi = () => request<{ ok: boolean }>("/auth/logout", { method: "POST" });
export const getMyOrders = () => request<Order[]>("/me/orders");
export type AutoShip = {
  id: string; order_number: string; status: "active" | "paused" | "cancelled"; quantity: number; unit_price: number;
  per_shipment: number; next_ship_date: string | null; skips_used: number; shipments_sent: number; created_at: string;
};
export const getMyAutoShips = () => request<AutoShip[]>("/me/autoships");
export const updateAutoShip = (id: string, action: "pause" | "resume" | "skip" | "change_qty" | "cancel", quantity?: number) =>
  request<AutoShip>(`/me/autoships/${id}`, { method: "POST", body: JSON.stringify({ action, quantity }) });
export const getMyReferral = () => request<(ReferralStatus & { reward_codes: { code: string; used: boolean }[] }) | null>("/me/referral");
export type AdminApplication = {
  id: string; clinic_name: string; email: string; phone: string; credentials: string | null; contact_name: string | null; role: string | null;
  location: string | null; practice_type: string | null; monthly_volume: string | null; message: string | null; created_at: string; email_status: string | null;
};
async function adminRequest<T>(passcode: string, path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}/admin${path}`, { ...init, headers: { "Content-Type": "application/json", "X-Admin-Passcode": passcode } });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) throw new Error("Incorrect passcode");
  if (!r.ok) {
    const detail = (data as any)?.detail;
    const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? String(detail[0]?.msg ?? "").replace(/^Value error, /, "") : "";
    throw new Error(msg || "Something went wrong. Please try again.");
  }
  return data as T;
}
export const getAdminApplications = (passcode: string) => adminRequest<AdminApplication[]>(passcode, "/clinic-applications");

export type AdminOrder = {
  id: string; order_number: string; created_at: string; sgt_time: string; time_slot: string; plan: PlanId | "clinic"; plan_name: string;
  quantity: number; unit_price: number; total: number; discount: number; applied_code: string | null; payment_method: string;
  customer: Order["customer"]; region: string; account: { user_id: string; name: string | null; email: string | null; provider: string | null } | null;
  autoship_status: "active" | "paused" | "cancelled" | null; next_ship_date: string | null; shipments_sent: number | null;
};
export type AdminStats = {
  orders: number; revenue: number; boxes: number; average_order: number; unique_customers: number; signed_in_orders: number; active_autoships: number;
  by_region: { region: string; orders: number; boxes: number }[]; by_time_slot: { slot: string; orders: number }[]; by_hour: number[];
  peak_hour: number | null; by_plan: Record<string, number>;
};
export const getAdminOrders = (passcode: string, days: number) =>
  adminRequest<{ orders: AdminOrder[]; stats: AdminStats }>(passcode, `/orders?days=${days}`);
export const getAdminPricing = (passcode: string) => adminRequest<Prices>(passcode, "/pricing");
export const setAdminPricing = (passcode: string, prices: Prices) =>
  adminRequest<Prices>(passcode, "/pricing", { method: "PUT", body: JSON.stringify(prices) });
export type ReviewStatus = "pending" | "approved" | "rejected";
export type AdminReview = Review & { order_number: string; customer_email: string; status: ReviewStatus };
export const getAdminReviews = (passcode: string, status: ReviewStatus | "all") => adminRequest<AdminReview[]>(passcode, `/reviews?status=${status}`);
export const decideReview = (passcode: string, id: string, status: ReviewStatus) =>
  adminRequest<{ id: string; status: ReviewStatus }>(passcode, `/reviews/${id}`, { method: "POST", body: JSON.stringify({ status }) });

export const getPricing = () => request<{ currency: string; prices: Prices }>("/pricing");
export type Review = { id: string; display_name: string; rating: number; title: string | null; body: string; scar_type: string | null; created_at: string };
export type ReviewSummary = { average: number | null; count: number; distribution: Record<string, number>; reviews: Review[] };
export const getReviews = () => request<ReviewSummary>("/reviews");
export const createReview = (body: unknown) => request<{ status: string }>("/reviews", { method: "POST", body: JSON.stringify(body) });
export const createClinicApplication = (body: unknown) =>
  request<{ id: string; clinic_name: string }>("/clinic-applications", { method: "POST", body: JSON.stringify(body) });
export const getOrder = (id: string) => request<Order>(`/orders/${id}`);
export const enableReminders = (id: string, push_user_id: string) =>
  request<Order>(`/orders/${id}/reminders`, { method: "POST", body: JSON.stringify({ push_user_id }) });
