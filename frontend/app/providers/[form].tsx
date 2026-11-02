import { Redirect, useLocalSearchParams } from "expo-router";

import { InquiryForm } from "@/src/components/InquiryForm";
import { Section, StoreScreen } from "@/src/components/Store";
import { formBySlug } from "@/src/providerForms";

export default function ProviderFormPage() {
  const { form } = useLocalSearchParams<{ form: string }>();
  const def = formBySlug(String(form));
  if (!def) return <Redirect href="/providers" />;
  return (
    <StoreScreen title={`${def.title} | SmoothScar for Providers`} description={def.intro} testID={`${def.id}-screen`}>
      <Section eyebrow="For providers" title={def.title} body={def.intro}>
        <InquiryForm def={def} />
      </Section>
    </StoreScreen>
  );
}
