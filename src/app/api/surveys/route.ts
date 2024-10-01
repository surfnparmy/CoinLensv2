import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');
  const balance = parseFloat(searchParams.get('balance') || '0');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    const surveysRef = collection(db, 'surveys');
    const surveysQuery = query(surveysRef, where('expirationDate', '>', new Date().toISOString()));
    const surveysSnapshot = await getDocs(surveysQuery);

    const eligibleSurveys = surveysSnapshot.docs.filter(doc => {
      const surveyData = doc.data();
      if (surveyData.balanceTargeting === 'all') {
        return true;
      }

      if (surveyData.balanceTargeting === 'balance') {
        return surveyData.selectedBalanceBrackets.some(bracket => {
          switch (bracket) {
            case 'non_zero':
              return balance > 0;
            case 'shrimp':
              return balance > 0 && balance <= 0.1;
            case 'crab':
              return balance > 0.1 && balance <= 1;
            case 'fish':
              return balance > 1 && balance <= 10;
            case 'dolphin':
              return balance > 10 && balance <= 32;
            case 'whale':
              return balance > 32;
            default:
              return false;
          }
        });
      }

      return false;
    }).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(eligibleSurveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // ... existing code ...

  let minWalletBalance = 0;
  let maxWalletBalance = Infinity;

  switch (walletBalanceTarget) {
    case 'all':
      // Keep default values
      break;
    case 'non-zero':
      minWalletBalance = 0.000000000000000001; // Smallest possible non-zero value
      break;
    case 'low':
      minWalletBalance = 0;
      maxWalletBalance = 1;
      break;
    case 'medium':
      minWalletBalance = 1;
      maxWalletBalance = 10;
      break;
    case 'high':
      minWalletBalance = 10;
      break;
  }

  // ... rest of the function (create survey with minWalletBalance and maxWalletBalance)
}