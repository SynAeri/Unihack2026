import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native";
import { Uniwind } from "uniwind";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeIn } from "react-native-reanimated";
import "../global.css";

Uniwind.setTheme("dark");

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <StatusBar style="light" />
        <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </Animated.View>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
