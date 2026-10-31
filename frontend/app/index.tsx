import Head from "expo-router/head";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Agitation } from "@/src/components/Agitation";
import { CheckoutWidget, Selection } from "@/src/components/CheckoutWidget";
import { Evidence } from "@/src/components/Evidence";
import { Footer } from "@/src/components/Footer";
import { Hero } from "@/src/components/Hero";
import { STICKY_HEIGHT, StickyCTA } from "@/src/components/StickyCTA";
import { TrustInfo } from "@/src/components/TrustInfo";
import { MAX_WIDTH } from "@/src/fonts";
import { makeStyles } from "@/src/theme";

type Anchor = "evidence" | "buy" | "info";

export default function Landing() {
  const styles = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const anchors = useRef<Record<Anchor, number>>({ evidence: 0, buy: 0, info: 0 });
  const [selection, setSelection] = useState<Selection>({ plan: "subscribe", qty: 1 });

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
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} testID="landing-scroll">
        <View role="main" style={styles.column}>
          <Hero />
          <Agitation />
          <View onLayout={mark("evidence")}>
            <Evidence />
          </View>
          <View onLayout={mark("buy")}>
            <CheckoutWidget
              value={selection}
              onChange={setSelection}
              onProceed={() => router.push({ pathname: "/checkout", params: { plan: selection.plan, qty: String(selection.qty) } })}
            />
          </View>
          <View onLayout={mark("info")}>
            <TrustInfo />
          </View>
          <Footer onNavigate={scrollTo} bottomPad={STICKY_HEIGHT + insets.bottom + 24} />
        </View>
      </ScrollView>
      <StickyCTA onPress={() => scrollTo("buy")} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  scroll: { flexGrow: 1 },
  column: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", backgroundColor: c.surface },
}));
