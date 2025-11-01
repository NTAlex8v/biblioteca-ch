'use client';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeFirebase } from '.';

type SetRolePayload = {
    uid: string;
    role: 'Admin' | 'Editor' | 'User';
}

export const setRole = httpsCallable<SetRolePayload, { success: boolean; message: string }>(getFunctions(initializeFirebase().firebaseApp), 'setRole');
