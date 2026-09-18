import { Text, type StyleProp, type TextStyle } from "react-native";
import { useFluidText } from "@app/patient/lib/useFluidText";

/**
 * Text whose numbers travel to a new value rather than snapping to it.
 *
 * See `useFluidText` for why this is worth doing; this is just the native
 * binding for it.
 */
export function FluidText({
  value,
  style,
  duration,
  numberOfLines,
}: {
  value: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
  numberOfLines?: number;
}) {
  const display = useFluidText(value, duration);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {display}
    </Text>
  );
}
