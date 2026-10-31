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
  currency: string;
  payment_method: string;
  customer: { full_name: string; email: string; phone: string; address: string; postal_code: string; clinic_name?: string | null };
  created_at: string;
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
export const getOrder = (id: string) => request<Order>(`/orders/${id}`);
