import { PlanId } from "./content";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
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
export type AdminApplication = {
  id: string; clinic_name: string; email: string; phone: string; credentials: string | null; contact_name: string | null; role: string | null;
  location: string | null; practice_type: string | null; monthly_volume: string | null; message: string | null; created_at: string; email_status: string | null;
};
export const getAdminApplications = (passcode: string) =>
  fetch(`${BASE}/admin/clinic-applications`, { headers: { "X-Admin-Passcode": passcode } }).then(async (r) => {
    if (r.status === 401) throw new Error("Incorrect passcode");
    if (!r.ok) throw new Error("Couldn't load applications. Please try again.");
    return (await r.json()) as AdminApplication[];
  });
export const createClinicApplication = (body: unknown) =>
  request<{ id: string; clinic_name: string }>("/clinic-applications", { method: "POST", body: JSON.stringify(body) });
export const getOrder = (id: string) => request<Order>(`/orders/${id}`);
export const enableReminders = (id: string, push_user_id: string) =>
  request<Order>(`/orders/${id}/reminders`, { method: "POST", body: JSON.stringify({ push_user_id }) });
