'use server';

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { defineFunction } from "firebase-functions/v2/builder";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const SetRoleInputSchema = z.object({
  uid: z.string().min(1),
  role: z.enum(['Admin', 'Editor', 'User']),
});

export const setRole = defineFunction(
    {
        region: 'us-central1',
    },
    onCall(async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
        }

        if (request.auth.token.role !== 'Admin') {
            throw new HttpsError('permission-denied', 'Only admins can set user roles.');
        }

        const validation = SetRoleInputSchema.safeParse(request.data);
        if (!validation.success) {
            throw new HttpsError('invalid-argument', 'The data provided is not valid.', validation.error.format());
        }

        const { uid, role } = validation.data;

        try {
            await admin.auth().setCustomUserClaims(uid, { role });

            // Also update the role in the user's Firestore document for consistency in the UI
            await admin.firestore().collection('users').doc(uid).set({ role: role }, { merge: true });
            
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
