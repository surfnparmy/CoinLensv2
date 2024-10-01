import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Survey {
  id: string;
  title: string;
  description: string;
  reward: {
    type: 'points' | 'crypto';
    amount: number;
    currency?: string;
  };
  balanceTargeting: 'all' | 'balance';
  selectedBalanceBrackets: string[];
}

export function useSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchSurveys() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const surveysRef = collection(db, 'surveys');
        const q = query(surveysRef, where('active', '==', true));
        const querySnapshot = await getDocs(q);
        
        const fetchedSurveys: Survey[] = [];
        querySnapshot.forEach((doc) => {
          const surveyData = doc.data() as Survey;
          if (isUserEligibleForSurvey(user.ethBalance, surveyData)) {
            fetchedSurveys.push({ ...surveyData, id: doc.id });
          }
        });

        setSurveys(fetchedSurveys);
      } catch (err) {
        setError('Failed to fetch surveys');
        console.error('Error fetching surveys:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSurveys();
  }, [user]);

  function isUserEligibleForSurvey(userBalance: number, survey: Survey): boolean {
    if (survey.balanceTargeting === 'all') {
      return true;
    }

    return survey.selectedBalanceBrackets.some(bracket => {
      switch (bracket) {
        case 'non_zero':
          return userBalance > 0;
        case 'shrimp':
          return userBalance > 0 && userBalance <= 0.1;
        case 'crab':
          return userBalance > 0.1 && userBalance <= 1;
        case 'fish':
          return userBalance > 1 && userBalance <= 10;
        case 'dolphin':
          return userBalance > 10 && userBalance <= 32;
        case 'whale':
          return userBalance > 32;
        default:
          return false;
      }
    });
  }

  return { surveys, loading, error };
}