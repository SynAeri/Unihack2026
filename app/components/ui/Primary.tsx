import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GrainyBackground } from "@/components/ui/GrainyBackground";

export const SHELL_PX = 24;

export function Primary({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-background">
      <GrainyBackground
        colors={["#070B14", "#7DFFA0", "#4EECFF", "#C084FC", "#070B14"]}
        intensity={0.08}
        amplitude={0.12}
        brightness={-0.1}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: SHELL_PX }}>
        {children}
      </SafeAreaView>
    </View>
  );
}
