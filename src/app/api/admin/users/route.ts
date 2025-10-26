import { type NextRequest, NextResponse } from "next/server";
import * as admin from 'firebase-admin';

// Importa las credenciales directamente. Asegúrate de que la ruta sea correcta.
import serviceAccount from '@/../firebase-service-account.json';

// Evita la inicialización múltiple
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

/**
 * Endpoint de API para obtener todos los usuarios.
 * Requiere un token de ID de Firebase en el cuerpo de la solicitud
 * y verifica si el usuario tiene el rol de 'Admin'.
 */
export async function POST(req: NextRequest) {
  if (!admin.apps.length) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized. Check server logs for initialization errors.' }, { status: 500 });
  }

  try {
    const { idToken, limit: queryLimit } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 401 });
    }

    // Verifica el token de ID. Esto también comprueba si el token ha expirado.
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // **VERIFICACIÓN DE SEGURIDAD CRÍTICA**
    // Comprueba si el usuario tiene el custom claim 'role' con el valor 'Admin'.
    if (decodedToken.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied. User is not an admin.' }, { status: 403 });
    }

    // Si el usuario es un admin, procede a listar los usuarios
    const limit = typeof queryLimit === 'number' && queryLimit > 0 ? queryLimit : 100;
    const userRecords = await admin.auth().listUsers(limit);
    
    // Mapea los resultados a un formato más simple si es necesario
    const users = userRecords.users.map(user => ({
      id: user.uid,
      email: user.email,
      name: user.displayName,
      avatarUrl: user.photoURL,
      role: user.customClaims?.role || 'User', // Devuelve el rol real o 'User' por defecto
    }));

    return NextResponse.json({ users });

  } catch (error: any) {
    console.error('API Error:', error);
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token has expired. Please log in again.' }, { status: 401 });
    }
     if (error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Invalid ID token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
