
'use server';

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { defineFunction } from "firebase-functions/v2/builder";

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const SetRoleInputSchema = z.object({
  uid: z.string().min(1),
  role: z.enum(['Admin', 'Editor', 'User']),
});

// Using defineFunction for better type safety and explicit options.
export const setRole = defineFunction(
    {
        region: 'us-central1', // Example region, adjust as necessary
    },
    onCall(async (request) => {
        // 1. Authentication Check: Ensure the user calling the function is authenticated.
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
        }

        // 2. Authorization Check: Ensure the user calling the function is an Admin.
        // The 'role' custom claim is checked on the verified ID token.
        if (request.auth.token.role !== 'Admin') {
            throw new HttpsError('permission-denied', 'Only admins can set user roles.');
        }

        // 3. Input Validation: Use Zod to parse and validate the incoming data.
        const validation = SetRoleInputSchema.safeParse(request.data);
        if (!validation.success) {
            throw new HttpsError('invalid-argument', 'The data provided is not valid.', validation.error.format());
        }

        const { uid, role } = validation.data;

        try {
            // 4. Set Custom Claim: This is the core logic. It attaches the role to the user's auth token.
            await admin.auth().setCustomUserClaims(uid, { role });

            // 5. Update Firestore Document: Keep the Firestore user document in sync with the custom claim.
            // This is useful for querying users by role and displaying roles in the UI.
            await admin.firestore().collection('users').doc(uid).update({ role });
            
            // 6. Success Response: Return a success message.
            return {
                status: 'success',
                message: `Successfully set user ${uid} to the role of ${role}.`,
            };
        } catch (error) {
            console.error('Error setting custom user claims:', error);
            throw new HttpsError('internal', 'An internal error occurred while setting the user role.');
        }
    })
);
