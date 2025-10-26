"use client";

import { useEffect } from "react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";

/**
 * An invisible component that runs once when a user is authenticated.
 * It ensures a user document exists in Firestore and forces a token refresh
 * to load the latest custom claims.
 */
export default function UserInitializer() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  useEffect(() => {
    // Exclude this logic on the signup page
    if (pathname === '/signup' || pathname === '/login') {
      return;
    }
    
    // Only run if services are ready, user is loaded, and we have a user object
    if (!firestore || isUserLoading || !user) {
      return;
    }

    const checkAndCreateUser = async () => {
      try {
        // Force a token refresh to get the latest custom claims
        await user.getIdToken(true);
        
        const userRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(userRef);

        // If the user document does not exist, create it.
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
          setDocumentNonBlocking(userRef, userData, {});
        }
      } catch (error) {
        console.error("Error in UserInitializer:", error);
      }
    };

    checkAndCreateUser();
  }, [user, isUserLoading, firestore, pathname]);

  // This component renders nothing.
  return null;
}
