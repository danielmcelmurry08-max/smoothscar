import { BrochureList } from "@/src/components/Brochures";
import { Section, StoreScreen } from "@/src/components/Store";

export default function ProviderResources() {
  return (
    <StoreScreen
      title="BioRNA Professional Resources | SmoothScar"
      description="Explore BioRNA scar-care technology, product information, and educational resources for healthcare professionals."
      testID="provider-resources-screen"
    >
      <Section
        eyebrow="For healthcare professionals"
        title="BioRNA Professional Resources"
        body="Explore BioRNA scar-care technology, product information, and educational resources for healthcare professionals."
      >
        <BrochureList />
      </Section>
    </StoreScreen>
  );
}
