import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import type { User as AppUser } from '@/lib/types';
import serviceAccount from '@/../firebase-service-account.json';

// Helper function to initialize Firebase Admin SDK
function initializeAdminApp() {
    // Check if the app is already initialized to prevent errors
    if (admin.apps.length === 0) {
        try {
            // The service account JSON needs to be structured correctly for initialization
            const credential = {
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
            };

            admin.initializeApp({
                credential: admin.credential.cert(credential),
            });
        } catch (error: any) {
            console.error('Firebase Admin SDK initialization error:', error);
            // This error will be caught by the calling function
            throw new Error(`Firebase Admin SDK initialization error: ${error.message}`);
        }
    }
    return admin;
}


// Helper function to verify the user token and admin role
async function verifyAdmin(request: Request): Promise<admin.auth.DecodedIdToken> {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // The role is verified from the simulated claim sent by the client
    if (decodedToken.role !== 'Admin') {
        throw new Error('Forbidden');
    }
    return decodedToken;
}

// GET handler to list all users
export async function GET(request: Request) {
    try {
        initializeAdminApp();
        await verifyAdmin(request);
        
        const listUsersResult = await admin.auth().listUsers();
        const allUsers: UserRecord[] = listUsersResult.users;

        // Fetch corresponding user documents from Firestore to get the role
        const firestore = admin.firestore();
        const userDocsPromises = allUsers.map(user => 
            firestore.collection('users').doc(user.uid).get()
        );
        const userDocs = await Promise.all(userDocsPromises);

        const usersWithRoles: AppUser[] = allUsers.map((user, index) => {
            const userDoc = userDocs[index];
            const userData = userDoc.exists ? userDoc.data() : null;
            return {
                id: user.uid,
                email: user.email || '',
                name: user.displayName || '',
                avatarUrl: user.photoURL || '',
                role: userData?.role || 'User', // Default to 'User' if not found
            };
        });

        return NextResponse.json({ users: usersWithRoles });

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
            return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de administrador.' }, { status: 403 });
        }
        console.error('Error listing users:', error);
        return NextResponse.json({ error: 'Error interno del servidor al listar usuarios.', details: error.message }, { status: 500 });
    }
}

// POST handler to update a user's role
export async function POST(request: Request) {
    try {
        initializeAdminApp();
        await verifyAdmin(request);
        const { uid, role } = await request.json();

        if (!uid || !role) {
            return NextResponse.json({ error: 'Faltan los parámetros uid o role.' }, { status: 400 });
        }
        
        // Firestore is the source of truth for the role in this app's logic
        const firestore = admin.firestore();
        await firestore.collection('users').doc(uid).set({ role: role }, { merge: true });

        // IMPORTANT: In a real production app, you would set custom claims here like this:
        // await admin.auth().setCustomUserClaims(uid, { role: role });
        // This makes the role available in Security Rules and on the ID token.
        // For this project, we rely on reading from Firestore on the client as a simulation.

        return NextResponse.json({ success: true, message: `Rol de usuario actualizado a ${role}.` });

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
            return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de administrador.' }, { status: 403 });
        }
        console.error('Error updating user role:', error);
        return NextResponse.json({ error: 'Error interno del servidor al actualizar el rol.', details: error.message }, { status: 500 });
    }
}
