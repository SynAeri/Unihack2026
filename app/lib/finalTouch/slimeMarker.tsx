// Custom slime marker component for MapLibre
// Provides animated, personality-based markers for map visualization

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface SlimeMarkerProps {
  slimeType: 'scholar' | 'glutton' | 'athlete' | 'wanderer';
  size?: number;
  isMoving?: boolean;
}

/**
 * Get color for slime type
 */
export function getSlimeMarkerColor(slimeType: string): string {
  const colorMap: Record<string, string> = {
    scholar: '#4A90E2',    // Blue
    glutton: '#FF8C42',    // Orange
    athlete: '#7DFFA0',    // Green
    wanderer: '#9B6DE8',   // Purple
  };

  return colorMap[slimeType.toLowerCase()] || '#7DFFA0';
}

/**
 * Get emoji/icon for slime type (fallback for custom images)
 */
export function getSlimeEmoji(slimeType: string): string {
  const emojiMap: Record<string, string> = {
    scholar: '📚',
    glutton: '🍔',
    athlete: '⚡',
    wanderer: '🧭',
  };

  return emojiMap[slimeType.toLowerCase()] || '🟢';
}

/**
 * Animated slime marker component
 * Can be used as custom MapLibre marker or standalone
 */
export function SlimeMarker({ slimeType, size = 40, isMoving = false }: SlimeMarkerProps) {
  const pulseScale = useSharedValue(1);
  const bounceTranslate = useSharedValue(0);

  React.useEffect(() => {
    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Bounce animation when moving
    if (isMoving) {
      bounceTranslate.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isMoving]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceTranslate.value }],
  }));

  const markerColor = getSlimeMarkerColor(slimeType);

  return (
    <View style={styles.container}>
      {/* Pulsing glow background */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: markerColor,
          },
          pulseStyle,
        ]}
      />

      {/* Main marker */}
      <Animated.View
        style={[
          styles.marker,
          {
            width: size,
            height: size,
            borderRadius: size * 0.5,
            backgroundColor: markerColor,
          },
          bounceStyle,
        ]}
      >
        {/* Inner circle */}
        <View
          style={[
            styles.inner,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: size * 0.35,
            },
          ]}
        />
      </Animated.View>

      {/* Shadow */}
      <View
        style={[
          styles.shadow,
          {
            width: size * 0.8,
            height: size * 0.2,
            borderRadius: size * 0.4,
          },
        ]}
      />
    </View>
  );
}

/**
 * Slime marker pin with shadow (for MapLibre PointAnnotation)
 */
export function SlimeMarkerPin({ slimeType, size = 50 }: SlimeMarkerProps) {
  const markerColor = getSlimeMarkerColor(slimeType);

  return (
    <View style={styles.pinContainer}>
      {/* Pin shape */}
      <View
        style={[
          styles.pin,
          {
            width: size,
            height: size * 1.3,
            borderTopLeftRadius: size * 0.5,
            borderTopRightRadius: size * 0.5,
            borderBottomLeftRadius: size * 0.5,
            borderBottomRightRadius: size * 0.5,
            backgroundColor: markerColor,
          },
        ]}
      >
        <View style={[styles.pinInner, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]} />
      </View>

      {/* Pin point */}
      <View
        style={[
          styles.pinPoint,
          {
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.2,
            borderRightWidth: size * 0.2,
            borderTopWidth: size * 0.3,
            borderTopColor: markerColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    opacity: 0.3,
  },
  marker: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  inner: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  shadow: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  pinContainer: {
    alignItems: 'center',
  },
  pin: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  pinInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  pinPoint: {
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});

/**
 * Helper to create marker view for MapLibre
 * Returns a view that can be used with MapLibre's custom marker API
 */
export function createSlimeMarkerView(
  slimeType: 'scholar' | 'glutton' | 'athlete' | 'wanderer',
  isMoving: boolean = false
): React.ReactElement {
  return <SlimeMarker slimeType={slimeType} size={40} isMoving={isMoving} />;
}
