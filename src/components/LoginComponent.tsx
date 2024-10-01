'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectWallet } from '@/lib/walletUtils';
import Image from 'next/image';

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const address = await connectWallet();
      if (address) {
        // TODO: Implement your authentication logic here
        // For now, we'll just redirect to the dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('MetaMask is not installed')) {
          setError('MetaMask is not installed. Please install it to use CoinLens.');
        } else if (err.message.includes('User rejected the connection request')) {
          setError('You need to connect your MetaMask wallet to use CoinLens.');
        } else {
          setError('An error occurred while connecting to MetaMask. Please try again.');
        }
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <div className="flex justify-center mb-6">
        <Image src="/coinlens-logo.png" alt="CoinLens Logo" width={100} height={100} />
      </div>
      <h1 className="text-2xl font-bold mb-6 text-center">Login to CoinLens</h1>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </span>
        ) : (
          <>
            <img src="/metamask-fox.svg" alt="MetaMask" className="w-6 h-6 mr-2" />
            Connect with MetaMask
          </>
        )}
      </button>
      {error && (
        <p className="mt-4 text-red-500 text-center">{error}</p>
      )}
      <p className="mt-4 text-sm text-gray-600 text-center">
        New to MetaMask? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Install it here</a>
      </p>
    </div>
  );
}