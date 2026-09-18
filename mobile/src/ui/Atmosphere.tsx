import { StyleSheet, View, useWindowDimensions, type ViewProps } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { atmosphere } from "./styles";

/**
 * The page atmosphere.
 *
 * Web paints this with three stacked CSS radial gradients over a vertical
 * linear one (`.mh-atmosphere` in patient.css). React Native has no radial
 * background, so the same four layers are drawn here in SVG instead — which
 * also means the shape of each bloom is specified rather than approximated.
 *
 * A CSS radial is an *ellipse*: `radial-gradient(120% 80% at 15% -10%, …)` is
 * centred at (15%, -10%) with radii 120% of the width and 80% of the height.
 * SVG's radial gradient is circular in its own space, so each bloom is drawn
 * as a circle of r = 0.5 and then scaled by 2× its radius and translated —
 * `gradientTransform` with objectBoundingBox units.
 */
export function Atmosphere({ children, style, ...rest }: ViewProps) {
  const { width, height } = useWindowDimensions();

  const scaleX = width || 1;
  const scaleY = height || 1;

  return (
    <View style={[styles.root, style]} {...rest}>
      <Svg style={StyleSheet.absoluteFill} width={scaleX} height={scaleY} pointerEvents="none">
        <Defs>
          <LinearGradient id="mhAtmosBase" x1="0" y1="0" x2="0" y2="1">
            {atmosphere.base.map((c, i) => (
              <Stop key={c} offset={[0, 0.55, 1][i]} stopColor={c} />
            ))}
          </LinearGradient>

          {atmosphere.blooms.map((b, i) => {
            const cx = parseFloat(b.cx) / 100;
            const cy = parseFloat(b.cy) / 100;
            /* Radii are percentages of width and height in CSS; SVG works in
               the bounding box, so the scale factors are radius × 2. */
            const sx = b.rx * 2;
            const sy = b.ry * 2;
            return (
              <RadialGradient
                key={i}
                id={`mhBloom${i}`}
                cx={0}
                cy={0}
                r={0.5}
                gradientTransform={`translate(${cx}, ${cy}) scale(${sx}, ${sy})`}
              >
                <Stop offset={0} stopColor={b.color} />
                <Stop offset={b.to} stopColor={b.color.replace(/[\d.]+\)$/, "0)")} />
              </RadialGradient>
            );
          })}
        </Defs>

        <Rect x={0} y={0} width="100%" height="100%" fill="url(#mhAtmosBase)" />
        {atmosphere.blooms.map((_, i) => (
          <Rect key={i} x={0} y={0} width="100%" height="100%" fill={`url(#mhBloom${i})`} />
        ))}
      </Svg>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: atmosphere.base[0] },
});
