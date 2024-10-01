import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useWallet } from './useWallet';

interface AuthUser {
  uid: string;
  walletAddress: string;
  ethBalance?: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { walletState, connectWallet, disconnectWallet } = useWallet();

  useEffect(() => {
    async function loadUserData() {
      console.log('loadUserData called, walletState:', walletState);
      if (walletState.account) {
        try {
          setLoading(true);
          const userDocRef = doc(db, 'users', walletState.account);
          const userDoc = await getDoc(userDocRef);
          
          let userData: AuthUser;
          if (userDoc.exists()) {
            console.log('User document exists:', userDoc.data());
            userData = {
              uid: walletState.account,
              walletAddress: walletState.account,
              ethBalance: parseFloat(walletState.balance || '0'),
              ...userDoc.data(),
            } as AuthUser;
          } else {
            console.log('User document does not exist, creating new user');
            userData = {
              uid: walletState.account,
              walletAddress: walletState.account,
              ethBalance: parseFloat(walletState.balance || '0'),
            };
            await setDoc(userDocRef, userData);
          }
          console.log('Setting user:', userData);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No wallet account, setting user to null');
        setUser(null);
        localStorage.removeItem('user');
        setLoading(false);
      }
    }

    loadUserData();
  }, [walletState]);

  const login = async (walletType: 'MetaMask' | 'TrustWallet' | 'Phantom') => {
    try {
      setLoading(true);
      console.log('Attempting to connect wallet:', walletType);
      await connectWallet(walletType);
      console.log('Wallet connected successfully, walletState:', walletState);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred during login'));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await disconnectWallet();
      setUser(null);
      localStorage.removeItem('user');
      console.log('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred during logout'));
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, login, logout };
}