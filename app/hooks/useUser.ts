// React hook to access current user from anywhere in the app
// Connects to user service that manages Supabase user via backend

import { useState, useEffect } from "react";
import { getCurrentUser, User } from "@/lib/user";

/**
 * Hook to get the current user
 *
 * Usage:
 * ```tsx
 * const user = useUser();
 * if (user) {
 *   console.log("User ID:", user.id);
 * }
 * ```
 *
 * Note: User should always be available after app initialization,
 * but this returns null during initial load or if initialization failed
 */
export function useUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }

    loadUser();
  }, []);

  return user;
}
