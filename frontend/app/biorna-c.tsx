import { PRODUCTS } from "@/src/catalog";
import { ResultsGallery } from "@/src/components/ResultsGallery";
import { BulletList, ProductGrid, Section, StoreScreen } from "@/src/components/Store";

export default function BioRnaC() {
  return (
    <StoreScreen
      title="BioRNA-C | C-Section Scar Care Patches"
      description="BioRNA-C micro-tip patches are designed for Caesarean section scars. Starter, Standard and Baby Gift packs."
      testID="biorna-c-screen"
    >
      <Section
        eyebrow="BioRNA-C collection"
        title="Postpartum care for your C-section scar."
        body="BioRNA-C is designed for Caesarean section scars. It uses RNA and hyaluronic acid micro-tip technology to hydrate and protect the skin and help reduce the appearance of post-surgical scars. Every recovery is different, and results vary."
      >
        <ProductGrid products={PRODUCTS.filter((p) => p.category === "biorna-c")} />
      </Section>
      <Section eyebrow="Baby Gift Collection" title="A 24-patch gift for new moms." body="Choose the Baby Girl or Baby Boy gift box. Both contain the same 24 BioRNA-C patches." tone="soft">
        <ProductGrid products={PRODUCTS.filter((p) => p.category === "gift")} />
      </Section>
      <ResultsGallery only="C-Section Scars" title="C-section results" showLink />
      <Section eyebrow="Good to know" title="Caring for a C-section scar">
        <BulletList
          items={[
            "Wait until the incision has fully closed and your healthcare provider says it is OK before using any scar-care product.",
            "Follow the wear time and schedule on the BioRNA-C package insert.",
            "Stop using the patch and ask your doctor if you notice irritation.",
          ]}
        />
      </Section>
    </StoreScreen>
  );
}
