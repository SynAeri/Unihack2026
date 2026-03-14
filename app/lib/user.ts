// User initialization service for the Slime Companion app
// Automatically creates and persists a user on app startup using device ID, connects to Supabase via FastAPI backend

import * as SecureStore from "expo-secure-store";
import { getOrCreateDeviceId } from "./device";
import { API_ENDPOINTS } from "./config";

const USER_KEY = "compass_user_data";

export interface User {
  id: string;
  username: string;
  created_at: string;
}

/**
 * Get stored user data from secure storage
 */
async function getStoredUser(): Promise<User | null> {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.warn("Error reading stored user:", error);
    return null;
  }
}

/**
 * Store user data in secure storage
 */
async function storeUser(user: User): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn("Error storing user:", error);
  }
}

/**
 * Create or login user via backend API (which talks to Supabase)
 */
async function createOrLoginUser(username: string): Promise<User | null> {
  try {
    const response = await fetch(API_ENDPOINTS.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      console.warn("Failed to create/login user:", await response.text());
      return null;
    }

    const user: User = await response.json();
    return user;
  } catch (error) {
    console.warn("Error creating/logging in user:", error);
    return null;
  }
}

/**
 * Initialize user on app startup
 *
 * Flow:
 * 1. Check if user is already stored locally (SecureStore)
 * 2. If yes, return stored user (app hasn't been reinstalled)
 * 3. If no, get/create device ID and use it as username
 * 4. Call backend /auth/login which creates user in Supabase if doesn't exist
 * 5. Store user locally
 *
 * Note: When app is reinstalled, SecureStore is cleared,
 * so a new device ID will be generated and a new user created in Supabase.
 * Each teammate reinstalling the app will get their own user.
 */
export async function initializeUser(): Promise<User | null> {
  try {
    // Check for existing user
    const storedUser = await getStoredUser();
    if (storedUser) {
      console.log("Using existing user:", storedUser.username);
      return storedUser;
    }

    console.log("No stored user found, creating new user...");

    // Get or create device ID to use as username
    const deviceId = await getOrCreateDeviceId();
    const username = `user_${deviceId.substring(0, 8)}`;

    // Create/login user via backend (backend talks to Supabase)
    const user = await createOrLoginUser(username);

    if (!user) {
      console.warn("Failed to initialize user");
      return null;
    }

    // Store user locally
    await storeUser(user);
    console.log("New user created and stored:", user.username);

    return user;
  } catch (error) {
    console.warn("Error initializing user:", error);
    return null;
  }
}

/**
 * Get the current user
 * Should be called after initializeUser() has been called at app startup
 */
export async function getCurrentUser(): Promise<User | null> {
  return await getStoredUser();
}

/**
 * Clear user data (for testing/debugging)
 * This simulates a fresh install - next time initializeUser() is called,
 * a new user will be created in Supabase
 */
export async function clearUserData(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
    console.log("User data cleared");
  } catch (error) {
    console.warn("Error clearing user data:", error);
  }
}
