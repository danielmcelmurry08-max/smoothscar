import { BulletList, Section, StoreScreen } from "@/src/components/Store";

export default function Privacy() {
  return (
    <StoreScreen title="Privacy Policy | SmoothScar" description="How SmoothScar handles information submitted through this website." testID="privacy-screen">
      <Section eyebrow="Privacy" title="Privacy Policy" body="This notice explains how we handle information you send through the provider inquiry forms on this website.">
        <BulletList
          items={[
            "What we collect: the business contact details and inquiry information you type into a form. The forms do not ask for patient or health information, and you should not include any.",
            "How we use it: only to respond to your inquiry and to discuss partnership, sample or wholesale opportunities with you.",
            "Where it is stored: submissions are stored securely through our website host, Netlify, and only authorized SmoothScar administrators can access them.",
            "Sharing: we do not sell your information. We may share it with the product manufacturer, RNAscence Biotechnology, only as needed to answer your inquiry.",
            "Your choices: you can ask us to access, correct or delete your information at any time by replying to any email we send you.",
          ]}
        />
      </Section>
    </StoreScreen>
  );
}
