import { db, auth } from './firebase';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';
import { Survey, AdminSurvey, UserData } from './types';

export async function fetchSurveys(): Promise<Survey[]> {
  const surveysCollection = collection(db, 'surveys');
  const surveysSnapshot = await getDocs(query(surveysCollection, where('isActive', '==', true)));
  return surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
}

export async function fetchSurvey(id: string): Promise<Survey> {
  const surveyDoc = await getDoc(doc(db, 'surveys', id));
  if (!surveyDoc.exists()) {
    throw new Error('Survey not found');
  }
  return { id: surveyDoc.id, ...surveyDoc.data() } as Survey;
}

export async function submitSurvey(id: string, answers: Record<string, string | string[]>): Promise<void> {
  const surveyRef = doc(db, 'surveys', id);
  const surveyDoc = await getDoc(surveyRef);
  if (!surveyDoc.exists()) {
    throw new Error('Survey not found');
  }

  const survey = surveyDoc.data() as AdminSurvey;

  // Check if rewards are still available
  if (survey.reward.type === 'pool' && survey.rewardsClaimed >= survey.reward.supply) {
    throw new Error('All rewards have been claimed for this survey');
  }
  if (survey.reward.maxUsers !== null && survey.rewardsClaimed >= survey.reward.maxUsers) {
    throw new Error('Maximum number of participants reached for this survey');
  }

  // Increment rewardsClaimed
  await updateDoc(surveyRef, {
    rewardsClaimed: survey.rewardsClaimed + 1
  });

  // TODO: Store survey answers in a separate collection
}

export async function fetchUserData(address: string): Promise<UserData> {
  // Fetch user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', address));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  
  // Fetch completed surveys
  const completedSurveysSnapshot = await getDocs(query(collection(db, 'completedSurveys'), where('userId', '==', address)));
  const completedSurveys = completedSurveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    ...userData,
    completedSurveys,
  } as UserData;
}

export async function fetchAdminSurveys(): Promise<AdminSurvey[]> {
  const surveysCollection = collection(db, 'surveys');
  const surveysSnapshot = await getDocs(surveysCollection);
  return surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminSurvey));
}

export async function createSurvey(survey: Omit<AdminSurvey, 'id'>): Promise<AdminSurvey> {
  const newSurveyRef = await addDoc(collection(db, 'surveys'), {
    ...survey,
    rewardsClaimed: 0,
    createdAt: new Date()
  });
  return { id: newSurveyRef.id, ...survey };
}

export async function updateSurvey(survey: AdminSurvey): Promise<void> {
  const surveyRef = doc(db, 'surveys', survey.id);
  const { id, ...updateData } = survey;
  await updateDoc(surveyRef, updateData);
}

export async function deleteSurvey(id: string): Promise<void> {
  await deleteDoc(doc(db, 'surveys', id));
}

export async function fetchSurveysForUser(userCountry: string): Promise<Survey[]> {
  const surveysCollection = collection(db, 'surveys');
  const surveysSnapshot = await getDocs(query(surveysCollection, where('isActive', '==', true)));
  const surveys = surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminSurvey));
  
  return surveys.filter(survey => 
    survey.targeting.type === 'all' || 
    (survey.targeting.type === 'countries' && survey.targeting.countries.includes(userCountry))
  );
}

export async function updateUserCountry(userId: string, country: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { country });
}

export async function createUserIfNotExists(address: string) {
  const userRef = doc(db, 'users', address);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create a new user document without setting a default country
    await setDoc(userRef, {
      address,
      createdAt: new Date().toISOString(),
      // Add any other default fields you want for new users
    });
  }
}