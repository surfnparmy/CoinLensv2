'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSurveys } from '@/lib/hooks/useSurveys';
import SurveyList from '@/components/SurveyList';

export default function Dashboard() {
  const { user, loading, error, logout } = useAuth();
  const { surveys, loading: surveysLoading, error: surveysError } = useSurveys();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading || surveysLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || surveysError) {
    return <div className="container mx-auto px-4 py-8">Error: {error?.message || surveysError}</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>No user found. Please <Link href="/login" className="text-blue-500 hover:text-blue-700">login</Link>.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <p className="mb-2">Wallet Address: {user.walletAddress}</p>
        <p className="mb-2">ETH Balance: {user.ethBalance} ETH</p>
      </div>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-4">Available Surveys</h2>
        <SurveyList surveys={surveys} />
      </div>

      <div className="mt-4">
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      </div>
    </div>
  );
}