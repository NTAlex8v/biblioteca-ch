"use client";

import { useEffect } from "react";
import { useUser, useFirestore, setDocumentNonBlocking, useUserClaims } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";

/**
 * An invisible component that runs once when a user is authenticated.
 * It ensures a user document exists in Firestore and that its role matches
 * the custom claims from the auth token.
 */
export default function UserInitializer() {
  const { user, isUserLoading } = useUser();
  const { claims, isLoadingClaims } = useUserClaims();
  const firestore = useFirestore();
  const pathname = usePathname();

  useEffect(() => {
    // Exclude this logic on auth pages or if services/claims are not ready
    if (pathname === '/signup' || pathname === '/login' || !firestore || isUserLoading || isLoadingClaims || !user) {
      return;
    }

    const checkAndSyncUserDocument = async () => {
      try {
        const userRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(userRef);

        const roleFromClaims = claims?.role as ('Admin' | 'Editor' | 'User') || 'User';

        if (!docSnap.exists()) {
          console.log("User document does not exist. Creating with role from claims...");
          const userData = {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email,
            avatarUrl: user.photoURL || null,
            role: roleFromClaims, // Use role from claims
            createdAt: new Date().toISOString(),
          };
          setDocumentNonBlocking(userRef, userData, {});
        } else {
          // If doc exists, check if role in DB matches claims
          const dbRole = docSnap.data()?.role;
          if (dbRole !== roleFromClaims) {
            console.log(`Role mismatch in DB. Updating DB role to: ${roleFromClaims}`);
            setDocumentNonBlocking(userRef, { role: roleFromClaims }, { merge: true });
          }
        }
      } catch (error) {
        console.error("Error in UserInitializer (checkAndSyncUserDocument):", error);
      }
    };

    checkAndSyncUserDocument();
  }, [user, isUserLoading, firestore, pathname, claims, isLoadingClaims]);

  // This component renders nothing.
  return null;
}
