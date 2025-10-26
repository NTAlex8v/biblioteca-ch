
import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Directly import the service account credentials
import serviceAccount from "../../../../../firebase-service-account.json";

// Define the credential object outside to be used in the function.
// Manually construct the credential object to ensure correct property names (camelCase)
// and to handle the private key formatting.
const credential = {
  projectId: serviceAccount.project_id,
  clientEmail: serviceAccount.client_email,
  privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
};

export async function POST(req: Request) {
  // --- INITIALIZATION MOVED HERE ---
  // Initialize Firebase Admin SDK if not already initialized.
  // This guarantees it runs every time the API is called.
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(credential),
      });
      console.log("Firebase Admin initialized successfully inside POST handler.");
    }
  } catch (error: any) {
    console.error("Firebase Admin Initialization Error inside POST handler:", error.message);
    // If initialization fails, we cannot proceed.
    return NextResponse.json(
      { error: "Critical: Firebase Admin SDK failed to initialize. Check server logs." },
      { status: 500 }
    );
  }
  // --- END INITIALIZATION ---

  try {
    const body = await req.json();
    const idToken = body?.idToken;

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    const isAdmin = decodedToken.role === "Admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: User is not an admin." }, { status: 403 });
    }

    const usersSnap = await admin.firestore().collection("users").get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ users });

  } catch (err: any) {
    console.error("API /api/admin/users error:", err);
    if (err.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: "Token expired, please log in again." }, { status: 401 });
    }
    if (err.code === 'auth/argument-error') {
       return NextResponse.json({ error: "Invalid ID token." }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "An internal server error occurred." }, { status: 500 });
  }
}
