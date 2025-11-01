'use server';

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Inicializa Firebase Admin SDK si no se ha hecho antes.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Cloud Function para asignar un rol a un usuario como un Custom Claim.
 * Solo puede ser llamada por un usuario que ya sea administrador.
 */
export const setRole = onCall(async ({ data, context }) => {
  // 1. Verificación de Autenticación y Permisos
  // Asegurarse de que el usuario que llama está autenticado y es un Admin.
  if (!context.auth || context.auth.token.role !== 'Admin') {
    throw new HttpsError(
      'permission-denied',
      'Esta función solo puede ser llamada por un administrador.'
    );
  }

  const { uid, role } = data;

  // 2. Validación de Datos de Entrada
  if (
    !uid ||
    typeof uid !== 'string' ||
    !role ||
    typeof role !== 'string'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'La función requiere un "uid" y un "role" como strings.'
    );
  }

  try {
    // 3. Asignación del Custom Claim
    await admin.auth().setCustomUserClaims(uid, { role: role });

    // (Opcional pero recomendado) Mantener sincronizado el documento de Firestore
    await admin.firestore().collection('users').doc(uid).update({ role: role });

    // 4. Devolver una respuesta exitosa
    return {
      status: 'success',
      message: `El rol '${role}' ha sido asignado al usuario ${uid}.`,
    };
  } catch (error: any) {
    console.error('Error al asignar el rol:', error);
    throw new HttpsError(
      'internal',
      'Ocurrió un error al intentar asignar el rol.',
      error.message
    );
  }
});
