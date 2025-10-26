
import { NextResponse } from "next/server";
import admin from "firebase-admin";

const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT; // JSON stringificado

// Inicializar firebase-admin de forma segura (evita inicializar más de una vez)
if (!admin.apps.length) {
  try {
    if (SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(SERVICE_ACCOUNT)),
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT no está configurado. La inicialización del Admin SDK puede fallar.");
    }
  } catch(e) {
    console.error("Error al inicializar Firebase Admin SDK:", e);
  }
}

const DEFAULT_LIMIT = 50;

export async function POST(req: Request) {
  try {
    // Asegurarse de que el SDK de Admin esté inicializado
    if (!admin.apps.length) {
       return NextResponse.json({ error: "Firebase Admin SDK not initialized." }, { status: 500 });
    }

    const body = await req.json();
    const idToken = body?.idToken;
    const limit = Math.min(Number(body?.limit) || DEFAULT_LIMIT, 500);
    const startAfterId = body?.startAfterId;

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verificar el token y sus claims
    const decoded = await admin.auth().verifyIdToken(idToken);
    
    // Usamos el override para el admin específico si no hay claim 'role'
    const isAdmin = decoded.role === "Admin" || decoded.uid === "2bIAW4LIstaHXKSSRhr2nRpvKr02";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (err.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
