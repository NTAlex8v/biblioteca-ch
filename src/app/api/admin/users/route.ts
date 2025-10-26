
import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Directly import the service account credentials
import serviceAccount from "../../../../../firebase-service-account.json";

// Initialize Firebase Admin SDK if not already initialized
try {
  if (!admin.apps.length) {
    // Manually construct the credential object to ensure camelCase properties
    const credential = {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'), // Ensure newlines are correctly formatted
    };

    admin.initializeApp({
      credential: admin.credential.cert(credential),
    });
    console.log("Firebase Admin initialized successfully.");
  }
} catch (error: any) {
  console.error("Firebase Admin Initialization Error:", error.message);
}


export async function POST(req: Request) {
  // Check if the SDK was initialized correctly before proceeding
  if (!admin.apps.length) {
    console.error("API Error: Firebase Admin SDK is not initialized.");
    return NextResponse.json(
      { error: "Firebase Admin SDK not initialized. Check server logs for initialization errors." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const idToken = body?.idToken;

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify the ID token and check for the 'Admin' role
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // In a real app, you'd check a real custom claim. Here we allow the simulated one.
    const isAdmin = decodedToken.role === "Admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: User is not an admin." }, { status: 403 });
    }

    // Fetch all users from Firestore using the Admin SDK
    const usersSnap = await admin.firestore().collection("users").get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ users });

  } catch (err: any) {
    console.error("API /api/admin/users error:", err);
    // Provide a more specific error message if token verification fails
    if (err.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: "Token expired, please log in again." }, { status: 401 });
    }
    if (err.code === 'auth/argument-error') {
       return NextResponse.json({ error: "Invalid ID token." }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "An internal server error occurred." }, { status: 500 });
  }
}
