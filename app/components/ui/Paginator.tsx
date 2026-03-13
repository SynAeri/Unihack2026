import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import { Dot, DOT_SIZE } from "./Dot";

const GAP = DOT_SIZE * 2;
const PROGRESS_SIZE = DOT_SIZE * 2.6;
const LEFT_OFFSET = -(PROGRESS_SIZE - DOT_SIZE) / 2;

interface PaginatorProps {
  itemsLength: number;
  animatedIndex: SharedValue<number>;
}

export function Paginator({ itemsLength, animatedIndex }: PaginatorProps) {
  const progressStyle = useAnimatedStyle(() => ({
    width: interpolate(
      animatedIndex.value,
      [0, itemsLength - 1],
      [
        PROGRESS_SIZE,
        itemsLength * (DOT_SIZE + GAP) -
          GAP +
          PROGRESS_SIZE -
          DOT_SIZE,
      ]
    ),
    left: LEFT_OFFSET,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.progress, progressStyle]} />
      {Array.from({ length: itemsLength }).map((_, i) => (
        <Dot key={i} index={i} animatedIndex={animatedIndex} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    columnGap: GAP,
    position: "relative",
    alignItems: "center",
  },
  progress: {
    backgroundColor: "#7DFFA0",
    position: "absolute",
    height: PROGRESS_SIZE,
    borderRadius: PROGRESS_SIZE / 2,
    zIndex: -1,
  },
});
