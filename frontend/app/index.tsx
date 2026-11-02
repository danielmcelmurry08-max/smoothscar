import { useQuery } from "@tanstack/react-query";
import Head from "expo-router/head";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Agitation } from "@/src/components/Agitation";
import { checkCode } from "@/src/api";
import { CheckoutWidget, Selection } from "@/src/components/CheckoutWidget";
import { Evidence } from "@/src/components/Evidence";
import { Footer } from "@/src/components/Footer";
import { Hero } from "@/src/components/Hero";
import { Reviews } from "@/src/components/Reviews";
import { StickyCTA, STICKY_HEIGHT } from "@/src/components/StickyCTA";
import { Testimonials } from "@/src/components/Testimonials";
import { TrustInfo } from "@/src/components/TrustInfo";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles } from "@/src/theme";

type Anchor = "evidence" | "buy" | "info";

export default function Landing() {
  const styles = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const anchors = useRef<Record<Anchor, number>>({ evidence: 0, buy: 0, info: 0 });
  const [selection, setSelection] = useState<Selection>({ plan: "one_time", qty: 2 });
  const [hideSticky, setHideSticky] = useState(false);
  const { code } = useLocalSearchParams<{ code?: string }>();
  const refCode = typeof code === "string" ? code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) : "";
  const { data: refInfo } = useQuery({ queryKey: ["code", refCode], queryFn: () => checkCode(refCode), enabled: !!refCode, retry: false });

  const scrollTo = (k: Anchor) => scrollRef.current?.scrollTo({ y: Math.max(anchors.current[k] - 12, 0), animated: true });
  const mark = (k: Anchor) => (e: { nativeEvent: { layout: { y: number } } }) => {
    anchors.current[k] = e.nativeEvent.layout.y;
  };

  return (
    <View style={styles.root} testID="landing-screen">
      <Head>
        <title>BioRNA Antiscar — Steroid-free Micro-Tips Scar Patch | Singapore</title>
        <meta
          name="description"
          content="BioRNA Antiscar: steroid-free, painless micro-tips patch for C-section, keloid and hypertrophic scars. 95% scar volume reduction after 60 days. Annals of the Academy of Medicine, Singapore 2024;53:113-6."
        />
      </Head>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        testID="landing-scroll"
        scrollEventThrottle={100}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const h = e.nativeEvent.layoutMeasurement.height;
          const { buy, info } = anchors.current;
          const overWidget = buy > 0 && y + h > buy + 120 && y < info - 120;
          if (overWidget !== hideSticky) setHideSticky(overWidget);
        }}
      >
        <View role="main" style={styles.column}>
          <Hero />
          {refInfo ? (
            <View style={styles.refBanner} testID="referral-banner">
              <Text style={styles.refText}>
                {refInfo.kind === "referral" ? "A friend sent you " : "Your reward: "}
                <Text style={styles.refStrong}>{refInfo.kind === "referral" ? "$25 off" : "1 free box"}</Text>
                {refInfo.kind === "referral" ? " your first order" : ""} — code {refInfo.code} will be applied automatically at checkout.
              </Text>
            </View>
          ) : null}
          <Agitation />
          <View onLayout={mark("evidence")}>
            <Evidence />
          </View>
          <Testimonials />
          <Reviews />
          <View onLayout={mark("buy")}>
            <CheckoutWidget
              value={selection}
              onChange={setSelection}
              onApply={() => router.push("/clinic-apply")}
              onProceed={() =>
                router.push({
                  pathname: "/checkout",
                  params: { plan: selection.plan, qty: String(selection.qty), ...(refCode ? { code: refCode } : {}) },
                })
              }
            />
          </View>
          <View onLayout={mark("info")}>
            <TrustInfo />
          </View>
          <Footer onNavigate={scrollTo} onApply={() => router.push("/clinic-apply")} onAdmin={() => router.push("/admin")} bottomPad={STICKY_HEIGHT + insets.bottom + 24} />
        </View>
      </ScrollView>
      {hideSticky ? null : <StickyCTA onPress={() => scrollTo("buy")} />}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  scroll: { flexGrow: 1 },
  column: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", backgroundColor: c.surface },
  refBanner: { marginHorizontal: space.xl, marginBottom: space.xl, padding: space.lg, borderRadius: radius.md, backgroundColor: c.brandTertiary },
  refText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: c.onBrandTertiary },
  refStrong: { fontFamily: fonts.black },
}));
