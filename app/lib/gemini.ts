// Vision API client for the Slime Companion app
// Sends photos to backend for Gemini-powered object detection

import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { API_BASE_URL } from "./config";

/**
 * Sends a photo to the backend, which then calls Gemini safely.
 * @param photoPath - local file path
 * @returns "Food" | "Book" | "Unknown" | null
 */
export async function detectObject(photoPath: string): Promise<string | null> {
  try {
    const base64 = await readAsStringAsync(photoPath, {
      encoding: EncodingType.Base64,
    });

    const response = await fetch(`${API_BASE_URL}/interpret-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_base64: base64,
        mime_type: "image/jpeg",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("Backend error:", data);
      return null;
    }

    return data.result || null;
  } catch (error) {
    console.warn("Backend vision error:", error);
    return null;
  }
}
