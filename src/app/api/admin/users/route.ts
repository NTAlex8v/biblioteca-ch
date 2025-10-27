import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import type { User as AppUser } from '@/lib/types';
import serviceAccount from '@/../firebase-service-account.json';

// Helper to initialize Firebase Admin SDK, ensuring it's done only once.
function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin;
    }
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
    } catch (error: any) {
        console.error('Firebase Admin SDK initialization error:', error);
        // Throw an error that can be caught in the handlers
        throw new Error('Admin SDK initialization failed');
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
    
    // Initialize admin app if not already
    const adminApp = initializeAdminApp();
    const decodedToken = await adminApp.auth().verifyIdToken(idToken);
    
    // The role is verified from the claim, which is simulated on the client
    if (decodedToken.role !== 'Admin') {
        throw new Error('Forbidden');
    }
    return decodedToken;
}

// GET handler to list all users
export async function GET(request: Request) {
    try {
        const adminApp = initializeAdminApp();
        await verifyAdmin(request);
        
        const listUsersResult = await adminApp.auth().listUsers();
        const allUsers: UserRecord[] = listUsersResult.users;

        // Fetch corresponding user documents from Firestore to get the role
        const firestore = adminApp.firestore();
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
        const adminApp = initializeAdminApp();
        await verifyAdmin(request);
        const { uid, role } = await request.json();

        if (!uid || !role) {
            return NextResponse.json({ error: 'Faltan los parámetros uid o role.' }, { status: 400 });
        }
        
        const firestore = adminApp.firestore();
        await firestore.collection('users').doc(uid).set({ role: role }, { merge: true });

        // IMPORTANT: In a real production app, you would set custom claims here like this:
        // await admin.auth().setCustomUserClaims(uid, { role: role });
        // This makes the role available in Security Rules and on the ID token.

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
