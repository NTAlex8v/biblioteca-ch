
import {getAuth} from 'firebase-admin/auth';
import {initializeApp, getApps} from 'firebase-admin/app';
import {https} from 'firebase-functions/v2';
import { doc, getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();
const firestore = getFirestore();

/**
 * Cloud Function to set a user's role and custom claims.
 * This function is callable from the client-side.
 */
export const setRole = https.onCall(async (request) => {
  // 1. Authentication and Authorization Check
  // Ensure the user calling the function is an authenticated Admin.
  if (request.auth?.token?.role !== 'Admin') {
    throw new https.HttpsError(
      'permission-denied',
      'This function can only be called by an Admin user.'
    );
  }

  const { uid, role } = request.data;

  // 2. Input Validation
  if (!uid || typeof uid !== 'string') {
    throw new https.HttpsError('invalid-argument', 'The function must be called with a "uid" argument.');
  }
  const validRoles = ['Admin', 'Editor', 'User'];
  if (!role || !validRoles.includes(role)) {
    throw new https.HttpsError('invalid-argument', `The "role" must be one of the following: ${validRoles.join(', ')}`);
  }

  try {
    // 3. Set Custom Claim
    // This is the "official" way to set a role that security rules can trust.
    await auth.setCustomUserClaims(uid, { role: role });
    
    // 4. Update Firestore Document
    // Also update the role in the user's Firestore document for client-side display.
    const userDocRef = doc(firestore, 'users', uid);
    await userDocRef.update({ role: role });

    // 5. Return Success
    return {
      success: true,
      message: `Successfully set user ${uid} to role ${role}.`,
    };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new https.HttpsError(
      'internal',
      'An internal error occurred while setting the user role.'
    );
  }
});
