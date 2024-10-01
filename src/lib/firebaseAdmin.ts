import { AppOptions } from 'firebase-admin';
import * as firebaseAdmin from 'firebase-admin';

if (!firebaseAdmin.apps.length) {
  try {
    const cert = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    const options: AppOptions = {
      credential: firebaseAdmin.credential.cert(cert),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    };
    firebaseAdmin.initializeApp(options);
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export default firebaseAdmin;