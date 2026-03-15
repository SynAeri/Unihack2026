// Slime API client for the Slime Companion app
// Handles fetching user slimes and interacting with slime endpoints

import { API_ENDPOINTS } from "./config";

export interface Slime {
  id: string;
  user_id: string;
  name?: string;
  slime_type: string;
  personality: {
    temperament: string;
    interest: string;
    preferred_places: string[];
  };
  bond_level: number;
  state: string;
  dominant_color: string;
  size: number;
  health?: number;
  happiness?: number;
  bond_gauge?: number;
  created_at: string;
}

/**
 * Fetch the user's slime from the backend
 * @param userId - The user's ID
 * @returns Slime object or null if user has no slime
 */
export async function getUserSlime(userId: string): Promise<Slime | null> {
  try {
    const response = await fetch(API_ENDPOINTS.getUserSlime(userId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      // User has no slime yet
      return null;
    }

    if (!response.ok) {
      console.warn("Failed to fetch user slime:", await response.text());
      return null;
    }

    const slime: Slime = await response.json();
    return slime;
  } catch (error) {
    console.warn("Error fetching user slime:", error);
    return null;
  }
}

/**
 * Map slime type to GLB model color
 * Based on available models in assets/templates/slime/
 */
export function getSlimeColor(slimeType: string): string {
  const colorMap: Record<string, string> = {
    scholar: "blue",      // Books/study -> blue
    glutton: "orange",    // Food -> orange
    athlete: "green",     // Sports/exercise -> green
    wanderer: "purple",   // Curious/exploration -> purple
  };

  return colorMap[slimeType.toLowerCase()] || "white";
}

/**
 * Get the GLB model filename for a slime type
 */
export function getSlimeModelPath(slimeType: string): any {
  const color = getSlimeColor(slimeType);

  // Map to require() paths for the GLB models
  const modelMap: Record<string, any> = {
    black: require("../assets/templates/slime/slime_black.glb"),
    blue: require("../assets/templates/slime/slime_blue.glb"),
    green: require("../assets/templates/slime/slime_green.glb"),
    orange: require("../assets/templates/slime/slime_orange.glb"),
    purple: require("../assets/templates/slime/slime_purple.glb"),
    red: require("../assets/templates/slime/slime_red.glb"),
    white: require("../assets/templates/slime/slime_white.glb"),
    yellow: require("../assets/templates/slime/slime_yellow.glb"),
  };

  return modelMap[color] || modelMap.white;
}
