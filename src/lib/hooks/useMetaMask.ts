import { useState } from 'react';
import { ethers } from 'ethers';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

export function useMetaMask() {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setAccount(address);

        // Get the balance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(address);
        const ethBalance = parseFloat(ethers.formatEther(balance));

        // Create or update user document in Firestore
        const userDocRef = doc(db, 'users', address);
        await setDoc(userDocRef, {
          walletAddress: address,
          ethBalance: ethBalance,
        }, { merge: true });

        // Sign in with Firebase
        try {
          const customToken = await getCustomToken(address);
          await signInWithCustomToken(auth, customToken);
          // Refresh the auth state
          await auth.currentUser?.reload();
        } catch (authError) {
          console.error('Authentication error:', authError);
          setError(`Failed to authenticate with Firebase: ${authError.message}`);
        }

      } catch (err) {
        console.error('Wallet connection error:', err);
        setError(`Failed to connect wallet: ${err.message}`);
      }
    } else {
      setError('Please install MetaMask');
    }
  };

  return { account, error, connectWallet };
}

async function getCustomToken(address: string): Promise<string> {
  const response = await fetch('/api/auth/getCustomToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to get custom token: ${errorData.error}, ${errorData.details}`);
  }
  const data = await response.json();
  return data.customToken;
}