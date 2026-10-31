import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Platform, Text, View } from "react-native";

import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

type Props = { before: string; after: string; label: string; testID: string };

export function BeforeAfterSlider({ before, after, label, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const pos = useRef(new Animated.Value(0)).current;
  const current = useRef(0);
  const start = useRef(0);
  const widthRef = useRef(0);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => Platform.OS === "web",
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const x = Math.min(Math.max(e.nativeEvent.locationX, 0), widthRef.current);
          start.current = x;
          current.current = x;
          pos.setValue(x);
        },
        onPanResponderMove: (_, g) => {
          const x = Math.min(Math.max(start.current + g.dx, 0), widthRef.current);
          current.current = x;
          pos.setValue(x);
        },
        onPanResponderRelease: () => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      }),
    [pos],
  );

  return (
    <View
      testID={testID}
      role="img"
      aria-label={`Before and after comparison: ${label}`}
      style={[styles.wrap, Platform.OS === "web" ? ({ userSelect: "none", cursor: "ew-resize" } as object) : null]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        widthRef.current = w;
        if (!width) {
          current.current = w / 2;
          pos.setValue(w / 2);
        }
        setWidth(w);
      }}
      {...responder.panHandlers}
    >
      <View style={styles.full} pointerEvents="none">
        <Image source={{ uri: after }} style={styles.full} contentFit="cover" accessibilityLabel={`${label} after treatment`} />
      </View>
      <Animated.View style={[styles.clip, { width: pos }]} pointerEvents="none">
        <Image source={{ uri: before }} style={[styles.beforeImg, { width }]} contentFit="cover" accessibilityLabel={`${label} before treatment`} />
      </Animated.View>
      <View style={[styles.tag, styles.tagLeft]} pointerEvents="none">
        <Text style={styles.tagText}>BEFORE</Text>
      </View>
      <View style={[styles.tag, styles.tagRight]} pointerEvents="none">
        <Text style={styles.tagText}>AFTER</Text>
      </View>
      <Animated.View style={[styles.handleLine, { transform: [{ translateX: pos }] }]} pointerEvents="none">
        <View style={styles.knob} testID={`${testID}-handle`}>
          <CaretLeft size={14} color={colors.brandPrimary} weight="bold" />
          <CaretRight size={14} color={colors.brandPrimary} weight="bold" />
        </View>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { height: 260, borderRadius: radius.md, overflow: "hidden", backgroundColor: c.surfaceTertiary },
  full: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  clip: { position: "absolute", top: 0, left: 0, bottom: 0, overflow: "hidden" },
  beforeImg: { height: "100%" },
  tag: {
    position: "absolute",
    top: space.md,
    backgroundColor: c.glass,
    paddingHorizontal: space.sm,
    height: 24,
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  tagLeft: { left: space.md },
  tagRight: { right: space.md },
  tagText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2, color: c.onSurface },
  handleLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -1,
    width: 2,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  knob: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: c.surfaceInverse,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
}));
