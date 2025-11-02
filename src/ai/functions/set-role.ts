'use server';

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already done.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Cloud Function to assign a role to a user as a Custom Claim.
 * Can only be called by a user who is already an administrator.
 */
export const setRole = onCall(async ({ data, context }) => {
  // 1. Authentication and Permission Check
  // Ensure the calling user is authenticated and is an Admin.
  // The first Admin must be created manually via a server-side script or the gcloud CLI.
  if (!context.auth || context.auth.token.role !== 'Admin') {
    throw new HttpsError(
      'permission-denied',
      'This function can only be called by an administrator.'
    );
  }

  const { uid, role } = data;

  // 2. Input Data Validation
  if (
    !uid ||
    typeof uid !== 'string' ||
    !role ||
    typeof role !== 'string' ||
    !['Admin', 'Editor', 'User'].includes(role)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The function requires a "uid" and a valid "role" ("Admin", "Editor", "User") as strings.'
    );
  }

  try {
    // 3. Set the Custom Claim
    await admin.auth().setCustomUserClaims(uid, { role: role });

    // 4. (Recommended) Keep the Firestore document in sync
    await admin.firestore().collection('users').doc(uid).update({ role: role });

    // 5. Return a successful response
    return {
      status: 'success',
      message: `Role '${role}' has been assigned to user ${uid}.`,
    };
  } catch (error: any) {
    console.error('Error assigning role:', error);
    // Throw a generic error to the client to avoid leaking implementation details.
    throw new HttpsError(
      'internal',
      'An error occurred while trying to assign the role.',
      error.message
    );
  }
});
