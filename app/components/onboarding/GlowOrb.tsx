import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface GlowOrbProps {
  color: string;
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  delay?: number;
  duration?: number;
}

export function GlowOrb({
  color,
  size,
  top,
  left,
  right,
  bottom,
  delay = 0,
  duration = 4000,
}: GlowOrbProps) {
  const opacity = useSharedValue(0.12);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(0.3, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      translateY.value = withRepeat(
        withTiming(-14, {
          duration: duration * 0.9,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          right,
          bottom,
        },
        style,
      ]}
    />
  );
}
