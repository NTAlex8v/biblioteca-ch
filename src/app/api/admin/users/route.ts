
import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Importa las credenciales directamente desde el archivo JSON.
// Esto es más robusto en entornos donde las variables de entorno pueden no estar configuradas.
import serviceAccount from '@/../firebase-service-account.json';

try {
  // Asegúrate de que la inicialización solo ocurra una vez.
  if (!admin.apps.length) {
    // Convierte las claves del snake_case al camelCase esperado por el SDK.
    const credential = {
      type: serviceAccount.type,
      projectId: serviceAccount.project_id,
      privateKeyId: serviceAccount.private_key_id,
      privateKey: serviceAccount.private_key,
      clientEmail: serviceAccount.client_email,
      clientId: serviceAccount.client_id,
      authUri: serviceAccount.auth_uri,
      tokenUri: serviceAccount.token_uri,
      authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
      clientX509CertUrl: serviceAccount.client_x509_cert_url,
    } as admin.ServiceAccount;

    admin.initializeApp({
      credential: admin.credential.cert(credential),
    });
  }
} catch (initErr: any) {
  console.error("Critical: Failed to initialize Firebase Admin SDK:", initErr.message);
}


const DEFAULT_LIMIT = 50;

export async function POST(req: Request) {
  try {
    // Verifica si la inicialización falló y devuelve un error claro.
    if (!admin.apps.length) {
       return NextResponse.json({ error: "Firebase Admin SDK not initialized. Check server logs for initialization errors." }, { status: 500 });
    }

    const body = await req.json();
    const idToken = body?.idToken;
    const limit = Math.min(Number(body?.limit) || DEFAULT_LIMIT, 500);
    const startAfterId = body?.startAfterId;

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verifica el token y sus claims
    const decoded = await admin.auth().verifyIdToken(idToken);
    
    // La verificación de rol debe ser estricta. Solo los usuarios con el claim 'Admin' pueden pasar.
    if (decoded.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden: User does not have Admin role." }, { status: 403 });
    }

    // Query con paginación por documentId
    let q = admin.firestore().collection("users").orderBy(admin.firestore.FieldPath.documentId()).limit(limit);
    if (startAfterId) {
      const docRef = admin.firestore().collection("users").doc(String(startAfterId));
      const docSnap = await docRef.get();
      if (docSnap.exists) q = q.startAfter(docSnap);
    }

    const snap = await q.get();
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("API /api/admin/users error:", err);
    
    if (err.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: "Token expired. Please sign in again." }, { status: 401 });
    }
    if (err.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Invalid token provided." }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "An unknown server error occurred." }, { status: 500 });
  }
}
