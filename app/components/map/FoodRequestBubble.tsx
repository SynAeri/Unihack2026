// Food Request Bubble Component
// Shows what food the slime desires based on their personality type
// Uses desire speech bubble assets

import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface FoodRequestBubbleProps {
  slimeType: string;
  visible: boolean;
}

// Map slime types to their desired food
const FOOD_DESIRES: Record<string, { image: any; name: string; scanType: string }> = {
  scholar: {
    image: require('../../assets/speech/desire/Book.png'),
    name: 'Book',
    scanType: 'book'
  },
  glutton: {
    image: require('../../assets/speech/desire/Burger.png'),
    name: 'Food',
    scanType: 'food'
  },
  athlete: {
    image: require('../../assets/speech/desire/Fit.png'),
    name: 'Exercise Equipment',
    scanType: 'sport'
  },
  wanderer: {
    image: require('../../assets/speech/desire/Burger.png'),
    name: 'Snack',
    scanType: 'food'
  },
};

export function FoodRequestBubble({ slimeType, visible }: FoodRequestBubbleProps) {
  if (!visible) return null;

  const desire = FOOD_DESIRES[slimeType.toLowerCase()] || FOOD_DESIRES.wanderer;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      style={styles.container}
    >
      <View style={styles.bubble}>
        <Image
          source={desire.image}
          style={styles.desireImage}
          resizeMode="contain"
        />
        <Text style={styles.requestText}>
          I want {desire.name}!
        </Text>
        <Text style={styles.instructionText}>
          Scan {desire.name.toLowerCase()} in the Scan tab to feed me
        </Text>
      </View>
    </Animated.View>
  );
}

// Helper to get what food type the slime wants
export function getDesiredFood(slimeType: string): string {
  const desire = FOOD_DESIRES[slimeType.toLowerCase()] || FOOD_DESIRES.wanderer;
  return desire.scanType;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  bubble: {
    backgroundColor: 'rgba(7, 11, 20, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#7DFFA0',
    padding: 20,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#7DFFA0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  desireImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  requestText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
