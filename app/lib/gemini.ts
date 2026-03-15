// Vision API client for the Slime Companion app
// Sends photos to backend for Gemini-powered object detection and slime creation

import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { API_BASE_URL } from "./config";
import { getCurrentUser } from "./user";

export interface DetectionResult {
  result: string;
  slime?: {
    id: string;
    user_id: string;
    slime_type: string;
    personality: any;
    bond_level: number;
    state: string;
    dominant_color: string;
    size: number;
    created_at: string;
  };
  personality?: {
    temperament: string;
    interest: string;
    preferred_places: string[];
  };
}

/**
 * Sends a photo to the backend, which then calls Gemini safely.
 * Also creates a slime for the user if they don't have one yet.
 * @param photoPath - local file path
 * @param latitude - optional latitude where scan occurred
 * @param longitude - optional longitude where scan occurred
 * @param slimeName - optional name for the slime
 * @returns DetectionResult with object class and optional slime data
 */
export async function detectObject(
  photoPath: string,
  latitude?: number,
  longitude?: number,
  slimeName?: string
): Promise<DetectionResult | null> {
  try {
    const base64 = await readAsStringAsync(photoPath, {
      encoding: EncodingType.Base64,
    });

    // Get current user to pass user_id
    const user = await getCurrentUser();

    const response = await fetch(`${API_BASE_URL}/interpret-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user?.id || null,
        image_base64: base64,
        mime_type: "image/jpeg",
        latitude: latitude || null,
        longitude: longitude || null,
        slime_name: slimeName || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("Backend error:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Backend vision error:", error);
    return null;
  }
}
