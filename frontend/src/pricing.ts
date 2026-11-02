import { useQuery } from "@tanstack/react-query";

import { getPricing } from "./api";
import { DEFAULT_PRICES, Prices } from "./content";

export function usePrices(): Prices {
  const { data } = useQuery({ queryKey: ["pricing"], queryFn: getPricing, staleTime: 60_000 });
  return data?.prices ?? DEFAULT_PRICES;
}
