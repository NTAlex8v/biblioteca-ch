
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import type { User as AppUser } from '@/lib/types';
import serviceAccount from '@/../firebase-service-account.json';

// Corrected initialization for Next.js API routes
if (!admin.apps.length) {
  try {
    const sanitizedServiceAccount = {
      ...serviceAccount,
      private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(sanitizedServiceAccount as any),
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

async function verifyAdmin(request: Request): Promise<admin.auth.DecodedIdToken> {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }
    const idToken = authorization.split('Bearer ')[1];
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    if (decodedToken.role !== 'Admin') {
        throw new Error('Forbidden');
    }
    return decodedToken;
}

export async function GET(request: Request) {
    try {
        await verifyAdmin(request);
        
        const listUsersResult = await admin.auth().listUsers();
        const allUsers: UserRecord[] = listUsersResult.users;

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
                role: userData?.role || 'User',
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

export async function POST(request: Request) {
    try {
        await verifyAdmin(request);
        const { uid, role } = await request.json();

        if (!uid || !role) {
            return NextResponse.json({ error: 'Faltan los parámetros uid o role.' }, { status: 400 });
        }
        
        const firestore = admin.firestore();
        await firestore.collection('users').doc(uid).set({ role: role }, { merge: true });

        // Set custom claims for security rules
        await admin.auth().setCustomUserClaims(uid, { role: role });

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
