// Interaction API client for slime interactions
// Handles patting, feeding, and other touch-based interactions

import { API_ENDPOINTS } from "./config";

export interface PatResponse {
  success: boolean;
  bond_delta: number;
  new_bond_level: number;
  message: string;
  journey_started: boolean;
  destination?: {
    name: string;
    lat: number;
    lng: number;
    reason: string;
  } | null;
}

/**
 * Pat/rub the slime to increase bond level
 * @param slimeId - The slime's ID
 * @returns Pat response with bond updates and potential journey
 */
export async function patSlime(slimeId: string): Promise<PatResponse | null> {
  try {
    const response = await fetch(API_ENDPOINTS.patSlime(slimeId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Failed to pat slime:", await response.text());
      return null;
    }

    const data: PatResponse = await response.json();
    return data;
  } catch (error) {
    console.warn("Error patting slime:", error);
    return null;
  }
}
