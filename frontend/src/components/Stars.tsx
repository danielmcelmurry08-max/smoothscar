import { Star } from "phosphor-react-native";
import { Pressable, View } from "react-native";

import { useTheme } from "../theme";

type Props = { value: number; size?: number; onChange?: (n: number) => void; testIDPrefix?: string };

export function Stars({ value, size = 14, onChange, testIDPrefix }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: onChange ? 4 : 2 }} role={onChange ? "radiogroup" : undefined} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star size={size} color={n <= Math.round(value) ? colors.brandPrimary : colors.borderStrong} weight={n <= Math.round(value) ? "fill" : "regular"} />;
        return onChange ? (
          <Pressable
            key={n}
            testID={testIDPrefix ? `${testIDPrefix}-${n}` : undefined}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onPress={() => onChange(n)}
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={n}>{icon}</View>
        );
      })}
    </View>
  );
}
