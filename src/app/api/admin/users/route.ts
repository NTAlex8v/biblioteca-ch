
import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Check if the service account JSON is available in the environment variable
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error in API route: ", error);
    // Return a server error response if initialization fails
    return NextResponse.json({ error: "Firebase Admin SDK initialization failed." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idToken = body.idToken;
    if (!idToken) {
      return NextResponse.json({ error: "No token provided." }, { status: 401 });
    }

    // Verify the ID token to ensure the request is from an authenticated user
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Use our hardcoded override for the specific admin user if claims are not set
    const isAdmin = decodedToken.role === "Admin" || decodedToken.uid === "2bIAW4LIstaHXKSSRhr2nRpvKr02";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: User is not an admin." }, { status: 403 });
    }

    // If the user is an admin, fetch all users from Firestore using the Admin SDK
    const usersSnap = await admin.firestore().collection("users").get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ users });

  } catch (err: any) {
    console.error("API Error in /api/admin/users: ", err);
    // Distinguish between auth errors and other server errors
    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
        return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "An unexpected server error occurred." }, { status: 500 });
  }
}
