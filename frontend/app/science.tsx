import { BulletList, HowItWorks, HowToUse, Section, StoreScreen } from "@/src/components/Store";

export default function Science() {
  return (
    <StoreScreen
      title="The Science Behind BioRNA | Micro-Tip Patch Technology"
      description="How BioRNA's dissolvable hyaluronic-acid micro-tip patch technology works, and the research behind it."
      testID="science-screen"
    >
      <Section
        eyebrow="Science behind BioRNA"
        title="Research-led scar care."
        body="RNAscence Biotechnology developed BioRNA in Singapore. The patch combines RNA and hyaluronic acid technology with dissolvable micro-tips, giving a needle-free way to deliver its formulated ingredients to the skin."
      />
      <HowItWorks />
      <Section eyebrow="Research" title="Clinical study">
        <BulletList
          items={[
            "BioRNA was evaluated in a randomized, single-blinded, intraindividual controlled clinical trial. In this type of study, each participant's scar is compared against a control on the same person.",
            "The findings were published in Annals of the Academy of Medicine, Singapore (2024;53:113-6).",
            "Individual results vary. BioRNA is intended to help improve the appearance of scars. It is not a cure, and results are not guaranteed.",
          ]}
        />
      </Section>
      <HowToUse />
    </StoreScreen>
  );
}
