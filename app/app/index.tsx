import { useState, useRef } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  FadeInLeft,
  ReduceMotion,
} from "react-native-reanimated";
import { ScreenShell, SHELL_PX } from "@/components/ui/ScreenShell";
import { Paginator } from "@/components/ui/Paginator";
import { TamagotchiBlob } from "@/components/TamagotchiBlob";
import { PermissionRow } from "@/components/ui/PermissionRow";
import { getOrCreateDeviceId } from "@/lib/device";

const { width: SW } = Dimensions.get("window");

const TOTAL = 4;
const SPRING = {
  mass: 1,
  damping: 16,
  stiffness: 300,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
  reduceMotion: ReduceMotion.System,
};

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<any>(null);
  const [step, setStep] = useState(0);
  const animatedIndex = useSharedValue(0);
  const steppedAhead = useSharedValue(0);

  const [camPerm, requestCam] = useCameraPermissions();
  const [locGranted, setLocGranted] = useState(false);
  const camGranted = camPerm?.granted ?? false;

  const scrollTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * SW, y: 0, animated: true });
  };

  const handleNext = async () => {
    if (step === 0) await getOrCreateDeviceId();
    if (step < TOTAL - 1) {
      const next = step + 1;
      steppedAhead.value = withSpring(1, SPRING);
      animatedIndex.value = withSpring(next, SPRING);
      scrollTo(next);
      setStep(next);
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleBack = () => {
    if (step <= 0) return;
    const prev = step - 1;
    steppedAhead.value = withSpring(prev === 0 ? 0 : 1, SPRING);
    animatedIndex.value = withSpring(prev, SPRING);
    scrollTo(prev);
    setStep(prev);
  };

  const W = SW - SHELL_PX * 2;
  const MAIN_FULL = W;
  const MAIN_SMALL = W * 0.72;
  const BACK_W = W * 0.24;

  const mainBtnStyle = useAnimatedStyle(() => ({
    width: interpolate(
      steppedAhead.value,
      [0, 1],
      [MAIN_FULL, MAIN_SMALL]
    ),
  }));

  const backBtnStyle = useAnimatedStyle(() => ({
    width: interpolate(steppedAhead.value, [0, 1], [0, BACK_W]),
    transform: [
      {
        translateX: interpolate(
          steppedAhead.value,
          [0, 1],
          [-BACK_W, 0]
        ),
      },
    ],
  }));

  const isLast = step >= TOTAL - 1;
  const bothGranted = camGranted && locGranted;
  const btnLabel = isLast
    ? "Let's Go"
    : step === 0
      ? "Get Started"
      : "Continue";
  const isMainDisabled = isLast && !bothGranted;

  return (
    <ScreenShell>
      <View style={{ flex: 1, marginHorizontal: -SHELL_PX }}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* 0 — Welcome */}
          <View style={[s.page, { paddingHorizontal: SHELL_PX }]}>
            <Text
              className="text-tamagotchi text-4xl font-bold mb-10"
              style={{ letterSpacing: 10 }}
            >
              COMPASS
            </Text>
            <TamagotchiBlob size={200} />
            <Text className="text-foreground text-3xl font-bold text-center mt-10">
              Scan the world.{"\n"}Raise your tamagotchi.
            </Text>
            <Text
              className="text-white text-base text-center mt-3"
              style={{ textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}
            >
              Your AR companion is waiting to explore with you
            </Text>
          </View>

          {/* 1 — Scan & Raise */}
          <View style={[s.page, { paddingHorizontal: SHELL_PX + 16 }]}>
            <View style={s.iconCircle}>
              <Ionicons name="scan-outline" size={40} color="#7DFFA0" />
            </View>
            <Text className="text-foreground text-2xl font-bold text-center mb-4">
              Scan & Raise
            </Text>
            <Text
              className="text-white text-base text-center leading-6"
              style={{ textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}
            >
              Scan objects around you to raise your tamagotchi. Each object gives
              your companion a unique personality and mood.
            </Text>
          </View>

          {/* 2 — Explore & Level Up */}
          <View style={[s.page, { paddingHorizontal: SHELL_PX + 16 }]}>
            <View
              style={[s.iconCircle, { backgroundColor: "rgba(78,236,255,0.1)" }]}
            >
              <Ionicons name="compass-outline" size={40} color="#4EECFF" />
            </View>
            <Text className="text-foreground text-2xl font-bold text-center mb-4">
              Explore & Level Up
            </Text>
            <Text
              className="text-white text-base text-center leading-6"
              style={{ textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}
            >
              Your tamagotchi will suggest places nearby based on its personality.
              Visit them to level up and grow your bond.
            </Text>
          </View>

          {/* 3 — Permissions */}
          <View
            style={[
              s.page,
              {
                paddingHorizontal: SHELL_PX,
                justifyContent: "center",
                alignItems: undefined,
              },
            ]}
          >
            <Text className="text-foreground text-2xl font-bold mb-2">
              Almost there...
            </Text>
            <Text
              className="text-white text-base leading-6 mb-8"
              style={{ textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}
            >
              Enable permissions to unlock the full experience.
            </Text>
            <View style={{ gap: 12 }}>
              <PermissionRow
                icon="camera-outline"
                title="Camera Access"
                description="Place AR tamagotchis in the real world"
                granted={camGranted}
                onRequest={() => requestCam()}
              />
              <PermissionRow
                icon="location-outline"
                title="Location Access"
                description="Find fun places nearby to explore"
                granted={locGranted}
                onRequest={async () => {
                  const { status } =
                    await Location.requestForegroundPermissionsAsync();
                  setLocGranted(status === "granted");
                }}
              />
            </View>
          </View>
        </Animated.ScrollView>
      </View>

      {/* Bottom controls */}
      <View style={{ paddingBottom: 12 }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Paginator itemsLength={TOTAL} animatedIndex={animatedIndex} />
        </View>

        <View style={{ height: 56 }}>
          {/* Back */}
          <Animated.View
            style={[
              backBtnStyle,
              {
                position: "absolute",
                left: 0,
                height: 56,
                overflow: "hidden",
              },
            ]}
          >
            <Button
              variant="secondary"
              size="lg"
              className="w-full h-full"
              onPress={handleBack}
            >
              <Button.Label>Back</Button.Label>
            </Button>
          </Animated.View>

          {/* Main */}
          <Animated.View
            style={[
              mainBtnStyle,
              {
                position: "absolute",
                right: 0,
                height: 56,
                overflow: "hidden",
              },
            ]}
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full h-full"
              isDisabled={isMainDisabled}
              onPress={handleNext}
            >
              {isLast && (
                <Animated.View
                  entering={FadeInLeft.springify()}
                  style={s.checkBadge}
                >
                  <Ionicons name="checkmark" size={14} color="#7DFFA0" />
                </Animated.View>
              )}
              <Button.Label className="font-bold">{btnLabel}</Button.Label>
            </Button>
          </Animated.View>
        </View>
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  page: {
    width: SW,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(125,255,160,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#070B14",
    alignItems: "center",
    justifyContent: "center",
  },
});
