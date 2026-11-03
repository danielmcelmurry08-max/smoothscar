import { PRODUCTS } from "@/src/catalog";
import { ProductGrid, Section, StoreScreen } from "@/src/components/Store";

export default function Shop() {
  return (
    <StoreScreen title="Shop BioRNA | Scar Care Patches" description="Shop BioRNA Antiscar and the BioRNA-C collection." testID="shop-screen">
      <Section eyebrow="Shop" title="All BioRNA products" body="Online checkout isn't available yet. You can add items to your cart now to plan your order.">
        <ProductGrid products={PRODUCTS} />
      </Section>
    </StoreScreen>
  );
}
