import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  const targetingCriteria = await request.json();
  const { targetCountryOption, targetCountries, balanceTargeting, selectedBalanceBrackets } = targetingCriteria;

  try {
    const usersRef = collection(db, 'users');
    let userQuery = query(usersRef);

    if (targetCountryOption === 'specific' && targetCountries.length > 0) {
      userQuery = query(userQuery, where('country', 'in', targetCountries));
    }

    const snapshot = await getDocs(userQuery);
    let eligibleCount = 0;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const userBalance = userData.ethBalance || 0;

      if (balanceTargeting === 'all' || isEligibleBalance(userBalance, selectedBalanceBrackets)) {
        eligibleCount++;
      }
    }

    return NextResponse.json({ count: eligibleCount });
  } catch (error) {
    console.error('Error calculating eligible user count:', error);
    return NextResponse.json({ error: 'Failed to calculate eligible user count' }, { status: 500 });
  }
}

function isEligibleBalance(balance: number, selectedBrackets: string[]): boolean {
  if (selectedBrackets.length === 0) return true; // If no brackets are selected, all balances are eligible

  return selectedBrackets.some(bracket => {
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