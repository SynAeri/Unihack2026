import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { SHELL_PX } from "@/components/ui/Primary";
import { Globe } from "@/components/home/Globe";
import { AnimatedProgressBar } from "@/components/ui/organisms/progress";

const PET_NAME = "Blobby";
const HEALTH = 0.85;
const HAPPINESS = 0.72;

export default function HomeTab() {
  return (
    <View style={s.root}>
      {/* Globe spans full width — slime is 3D in scene */}
      <Animated.View entering={FadeInUp.delay(100).springify()} style={s.globeSection}>
        <Globe />
      </Animated.View>

      {/* Name + Personality + Bars — padded content below */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={s.info}>
        <Text style={s.name}>{PET_NAME}</Text>
        <Text style={s.personality}>Curious & Playful</Text>

        {/* Health & Happiness bars — between personality and tab bar */}
        <View style={s.bars}>
          <View style={s.barRow}>
            <Ionicons name="heart" size={16} color="#ff6b6b" />
            <Text style={s.barLabel}>Health</Text>
            <AnimatedProgressBar
              progress={HEALTH}
              height={8}
              width="100%"
              progressColor="#ff6b6b"
              trackColor="rgba(255,255,255,0.1)"
              borderRadius={4}
              containerStyle={s.barTrack}
            />
          </View>
          <View style={s.barRow}>
            <Ionicons name="happy" size={16} color="#7DFFA0" />
            <Text style={s.barLabel}>Happiness</Text>
            <AnimatedProgressBar
              progress={HAPPINESS}
              height={8}
              width="100%"
              progressColor="#7DFFA0"
              trackColor="rgba(255,255,255,0.1)"
              borderRadius={4}
              containerStyle={s.barTrack}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  globeSection: {
    height: 400,
    position: "relative",
  },
  info: {
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: SHELL_PX,
  },
  name: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
  },
  personality: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: 6,
    letterSpacing: 1,
  },
  bars: {
    marginTop: 20,
    width: "100%",
    gap: 12,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  barLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    width: 72,
  },
  barTrack: {
    flex: 1,
  },
});
