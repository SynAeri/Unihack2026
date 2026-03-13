import { useEffect } from "react";
import Svg, {
  Path,
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface SlimeBlobProps {
  size?: number;
}

export function SlimeBlob({ size = 200 }: SlimeBlobProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      <Svg viewBox="0 0 200 200" width={size} height={size}>
        <Defs>
          <RadialGradient id="bodyGrad" cx="50%" cy="40%" r="55%">
            <Stop offset="0%" stopColor="#A5FFD6" />
            <Stop offset="50%" stopColor="#7DFFA0" />
            <Stop offset="100%" stopColor="#2A9D5C" />
          </RadialGradient>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#7DFFA0" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#7DFFA0" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle cx="100" cy="100" r="95" fill="url(#glowGrad)" />
        <Ellipse
          cx="100"
          cy="172"
          rx="55"
          ry="8"
          fill="rgba(125,255,160,0.12)"
        />

        <Path
          d="M38,152 C22,148 14,118 20,85 C26,48 58,22 100,22 C142,22 174,48 180,85 C186,118 178,148 162,152 Q100,164 38,152 Z"
          fill="url(#bodyGrad)"
        />

        <Ellipse
          cx="72"
          cy="58"
          rx="22"
          ry="12"
          fill="rgba(255,255,255,0.3)"
        />

        <Circle cx="76" cy="92" r="12" fill="white" />
        <Circle cx="79" cy="89" r="6" fill="#1A2235" />
        <Circle cx="82" cy="87" r="2.5" fill="white" />

        <Circle cx="124" cy="92" r="12" fill="white" />
        <Circle cx="127" cy="89" r="6" fill="#1A2235" />
        <Circle cx="130" cy="87" r="2.5" fill="white" />

        <Path
          d="M88,118 Q100,130 112,118"
          fill="none"
          stroke="#1F7A45"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <Circle cx="60" cy="108" r="8" fill="rgba(255,200,200,0.2)" />
        <Circle cx="140" cy="108" r="8" fill="rgba(255,200,200,0.2)" />
      </Svg>
    </Animated.View>
  );
}
