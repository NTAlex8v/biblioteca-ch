"use client";

import { useEffect } from "react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * An invisible component that runs once when a user is authenticated.
 * It ensures a user document exists in Firestore for every authenticated user.
 */
export default function UserInitializer() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Only run if services are ready, user is loaded, and we have a user object
    if (!firestore || isUserLoading || !user) {
      return;
    }

    const userRef = doc(firestore, "users", user.uid);

    const checkAndCreateUser = async () => {
      try {
        const docSnap = await getDoc(userRef);

        // If the user document does not exist, create it.
        // This handles first-time logins, especially from social providers.
        if (!docSnap.exists()) {
          console.log("User document does not exist. Creating...");
          const userData = {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email, // Fallback to email for name
            avatarUrl: user.photoURL,
            role: 'User', // Assign a default role
            createdAt: new Date().toISOString(),
          };
          // Use a non-blocking write. setDoc without merge ensures it only creates.
          // But since we checked existence, it's safe.
          setDocumentNonBlocking(userRef, userData, {});
        }
      } catch (error) {
        console.error("Error checking or creating user document:", error);
      }
    };

    checkAndCreateUser();
  }, [user, isUserLoading, firestore]);

  // This component renders nothing.
  return null;
}
