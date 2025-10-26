
import { NextResponse } from "next/server";
import admin from "firebase-admin";

const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT || null;

try {
  if (!admin.apps.length) {
    if (SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(SERVICE_ACCOUNT)),
      });
      console.log("Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT.");
    } else {
      // This will fail in a serverless environment if GOOGLE_APPLICATION_CREDENTIALS is not set
      // But it's a standard way to initialize in many GCP environments.
      admin.initializeApp();
      console.log("Firebase Admin initialized via default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS).");
    }
  }
} catch (initErr: any) {
  console.error("Failed to initialize Firebase Admin:", initErr.message);
  // We log the error but don't throw, allowing the endpoint to report the initialization failure.
}


const DEFAULT_LIMIT = 50;

export async function POST(req: Request) {
  try {
    // Check if the admin SDK is initialized before proceeding.
    if (!admin.apps.length) {
       return NextResponse.json({ error: "Firebase Admin SDK not initialized. Check server environment variables (FIREBASE_SERVICE_ACCOUNT)." }, { status: 500 });
    }

    const body = await req.json();
    const idToken = body?.idToken;
    const limit = Math.min(Number(body?.limit) || DEFAULT_LIMIT, 500);
    const startAfterId = body?.startAfterId;

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify the token and its claims
    const decoded = await admin.auth().verifyIdToken(idToken);
    
    // We allow override for a specific UID for development purposes
    const isAdmin = decoded.role === "Admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: User does not have Admin role." }, { status: 403 });
    }

    // Query with pagination by documentId
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
