'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminSurveys, updateSurvey, deleteSurvey } from '@/lib/api';
import { AdminSurvey, Reward } from '@/lib/types';
import Link from 'next/link';
import { auth } from '@/lib/firebase';

export default function AdminDashboardPage() {
  const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/admin/login');
      } else {
        loadSurveys();
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function loadSurveys() {
    try {
      const surveyData = await fetchAdminSurveys();
      setSurveys(surveyData);
    } catch (err) {
      setError('Failed to load surveys. Please try again.');
      console.error('Survey loading error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleActive = async (survey: AdminSurvey) => {
    try {
      const updatedSurvey = { ...survey, isActive: !survey.isActive };
      await updateSurvey(updatedSurvey);
      setSurveys(surveys.map(s => s.id === survey.id ? updatedSurvey : s));
    } catch (err) {
      console.error('Failed to toggle survey active status:', err);
      setError('Failed to update survey. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSurvey(id);
      setSurveys(surveys.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete survey:', err);
      setError('Failed to delete survey. Please try again.');
    }
  };

  const formatReward = (reward: Reward) => {
    switch (reward.type) {
      case 'points':
        return `${reward.points} CoinLens Points`;
      case 'pool':
        return `${reward.supply} x ${reward.amountPerUser} ${reward.tokenType} (Total: ${reward.totalValue} ${reward.tokenType})`;
      case 'prize':
        return `${reward.numberOfPrizes} x ${reward.description} (Total value: ${reward.totalValue})`;
    }
  };

  const formatRewardsLeft = (survey: AdminSurvey) => {
    const { reward, rewardsClaimed } = survey;
    switch (reward.type) {
      case 'points':
        return reward.maxUsers === null
          ? 'Unlimited rewards available'
          : `${Math.max(0, reward.maxUsers - rewardsClaimed)} rewards left`;
      case 'pool':
        return `${Math.max(0, reward.supply - rewardsClaimed)} rewards left`;
      case 'prize':
        return `${Math.max(0, reward.numberOfPrizes - rewardsClaimed)} prizes left`;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading surveys...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <Link href="/admin/create-survey" className="mb-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-150 ease-in-out">
          Create New Survey
        </Link>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {surveys.map((survey) => (
              <li key={survey.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{survey.title}</h3>
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${survey.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {survey.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{survey.description}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Reward: {formatReward(survey.reward)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatRewardsLeft(survey)}
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => handleToggleActive(survey)}
                      className="mr-2 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition duration-150 ease-in-out"
                    >
                      {survey.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link href={`/admin/edit-survey/${survey.id}`} className="mr-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition duration-150 ease-in-out">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition duration-150 ease-in-out"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}