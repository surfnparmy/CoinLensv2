'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/hooks/useWallet';

export default function Login() {
  const { user, loading, error, login } = useAuth();
  const { walletState, detectWallets } = useWallet();
  const router = useRouter();

  useEffect(() => {
    console.log('Login useEffect - user:', user, 'walletState:', walletState);
    if (user) {
      console.log('User detected, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, walletState, router]);

  const handleLogin = async (walletType: 'MetaMask' | 'TrustWallet' | 'Phantom') => {
    console.log('Attempting login with', walletType);
    await login(walletType);
    console.log('Login attempt completed, user:', user, 'walletState:', walletState);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const wallets = detectWallets();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Login to CoinLens</h1>
      <div className="space-y-4">
        {wallets.hasMetaMask && (
          <button
            onClick={() => handleLogin('MetaMask')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out w-64"
          >
            Connect with MetaMask
          </button>
        )}
        {wallets.hasTrustWallet && (
          <button
            onClick={() => handleLogin('TrustWallet')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out w-64"
          >
            Connect with Trust Wallet
          </button>
        )}
        {wallets.hasPhantom && (
          <button
            onClick={() => handleLogin('Phantom')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out w-64"
          >
            Connect with Phantom
          </button>
        )}
        {!wallets.hasMetaMask && !wallets.hasTrustWallet && !wallets.hasPhantom && (
          <p className="text-red-500">
            No supported wallet detected. Please install MetaMask, Trust Wallet, or Phantom.
          </p>
        )}
      </div>
      {error && <p className="text-red-500 mt-4">{error.message}</p>}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Debug Information:</h2>
        <pre className="bg-gray-200 p-4 rounded">
          {JSON.stringify({ user, loading, error, wallets, walletState }, null, 2)}
        </pre>
      </div>
    </div>
  );
}