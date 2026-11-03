import { ResultsGallery } from "@/src/components/ResultsGallery";
import { StoreScreen } from "@/src/components/Store";

export default function Results() {
  return (
    <StoreScreen title="Clinical Results | SmoothScar" description="Clinical photographs documenting changes in scar appearance during BioRNA use." testID="results-screen">
      <ResultsGallery />
    </StoreScreen>
  );
}
