// Pat interaction system for AR slime
// Handles touch detection, hand pat animation, thought bubble trigger, and bond level increase

import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, PanResponder, Image, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PatInteractionProps {
  onPatComplete: () => void;
  slimeScreenPosition?: { x: number; y: number }; // Screen coordinates of slime
  slimeRadius?: number; // Touch radius around slime
  isSlimeSpawned?: boolean; // Only allow patting after slime is spawned
}

export function SlimePatInteraction({
  onPatComplete,
  slimeScreenPosition = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
  slimeRadius = 100,
  isSlimeSpawned = false,
}: PatInteractionProps) {
  const [isPatting, setIsPatting] = useState(false);
  const [patTrail, setPatTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const patCount = useRef(0);
  const trailIdCounter = useRef(0);

  // Pan responder for detecting touch/drag over slime area
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isSlimeSpawned,
      onMoveShouldSetPanResponder: () => isSlimeSpawned && isPatting,

      onPanResponderGrant: (_, gestureState) => {
        const touchX = gestureState.x0;
        const touchY = gestureState.y0;

        // Check if touch is within slime area
        const distance = Math.sqrt(
          Math.pow(touchX - slimeScreenPosition.x, 2) +
          Math.pow(touchY - slimeScreenPosition.y, 2)
        );

        if (distance <= slimeRadius) {
          setIsPatting(true);
          addPatMark(touchX, touchY);
          patCount.current = 1;
        }
      },

      onPanResponderMove: (_, gestureState) => {
        if (!isPatting) return;

        const touchX = gestureState.moveX;
        const touchY = gestureState.moveY;

        // Check if still within slime area
        const distance = Math.sqrt(
          Math.pow(touchX - slimeScreenPosition.x, 2) +
          Math.pow(touchY - slimeScreenPosition.y, 2)
        );

        if (distance <= slimeRadius) {
          addPatMark(touchX, touchY);
          patCount.current++;
        }
      },

      onPanResponderRelease: () => {
        if (isPatting && patCount.current >= 3) {
          // Successful pat (at least 3 touch points)
          setTimeout(() => {
            onPatComplete();
          }, 300);
        }

        // Clear trail after a moment
        setTimeout(() => {
          setIsPatting(false);
          setPatTrail([]);
          patCount.current = 0;
        }, 1000);
      },
    })
  ).current;

  const addPatMark = (x: number, y: number) => {
    const newMark = { x, y, id: trailIdCounter.current++ };
    setPatTrail((prev) => [...prev, newMark]);

    // Remove old marks after 1 second
    setTimeout(() => {
      setPatTrail((current) => current.filter((mark) => mark.id !== newMark.id));
    }, 1000);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Render hand pat images along the trail */}
      {patTrail.map((mark) => (
        <PatMark key={mark.id} x={mark.x} y={mark.y} />
      ))}
    </View>
  );
}

// Individual pat mark component with fade-out animation
function PatMark({ x, y }: { x: number; y: number }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate out after delay
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 700);
  }, []);

  return (
    <Animated.View
      style={[
        styles.patMark,
        {
          left: x - 25, // Center the 50px image
          top: y - 25,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Image
        source={require('../../assets/images/HandPat.png')}
        style={styles.handImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  patMark: {
    position: 'absolute',
    width: 50,
    height: 50,
    pointerEvents: 'none',
  },
  handImage: {
    width: '100%',
    height: '100%',
  },
});
