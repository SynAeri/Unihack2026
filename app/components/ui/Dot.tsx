import Animated, {
  useAnimatedStyle,
  interpolateColor,
  SharedValue,
} from "react-native-reanimated";

export const DOT_SIZE = 10;

interface DotProps {
  index: number;
  animatedIndex: SharedValue<number>;
}

export function Dot({ index, animatedIndex }: DotProps) {
  const style = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedIndex.value,
      [index - 1, index],
      ["rgba(255,255,255,0.35)", "white"]
    );
    return { backgroundColor };
  });

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: "rgba(255,255,255,0.35)",
        },
        style,
      ]}
    />
  );
}
