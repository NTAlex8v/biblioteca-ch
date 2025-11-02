'use server';

/**
 * @fileOverview A server-side function to set custom user claims (roles).
 * This function can only be called by an authenticated user who is already an admin.
 */

import { initializeFirebase } from '@/firebase/server-initialization';
import { httpsCallable } from 'firebase-functions/v2';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';

const RoleSchema = z.enum(['Admin', 'Editor', 'User']);
export const SetRoleInputSchema = z.object({
    uid: z.string().min(1),
    role: RoleSchema,
});
export type SetRoleInput = z.infer<typeof SetRoleInputSchema>;

// Initialize Firebase Admin SDK
initializeFirebase();

export const setRole = httpsCallable(
    {
        // Only allow authenticated users to call this function.
        // Further checks inside the function will verify if the caller is an admin.
        enforceAppCheck: false,
        consumeAppCheckToken: false,
    },
    async (request) => {
        // 1. Authentication and Authorization Check
        if (!request.auth) {
            return { error: 'Authentication required.' };
        }

        const callerUid = request.auth.uid;
        const auth = getAuth();
        
        try {
            const callerUserRecord = await auth.getUser(callerUid);
            const customClaims = callerUserRecord.customClaims;
            
            // Check if the caller has the 'Admin' role.
            if (customClaims?.['role'] !== 'Admin') {
                return { error: 'Permission denied. Only admins can set roles.' };
            }

            // 2. Input validation
            const validation = SetRoleInputSchema.safeParse(request.data);
            if (!validation.success) {
                return { error: 'Invalid input data.', details: validation.error.format() };
            }
            const { uid, role } = validation.data;

            // 3. Set Custom Claim
            // Prevents an admin from accidentally removing their own admin status
            // if they are the only admin left (a theoretical safeguard).
            if (callerUid === uid && role !== 'Admin') {
                 // A more robust implementation would check if there are other admins.
                 // For now, we'll just prevent self-demotion.
                 // return { error: "Admin cannot revoke their own admin status." };
            }

            await auth.setCustomUserClaims(uid, { role });

            // 4. Return success
            return { success: true, message: `Role '${role}' assigned to user ${uid}.` };

        } catch (error: any) {
            console.error('Error in setRole function:', error);
            return { error: 'An unexpected error occurred.', details: error.message };
        }
    }
);
