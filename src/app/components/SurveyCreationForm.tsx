import React, { useState } from 'react';
import { useFirestore } from '@/lib/hooks/useFirestore';

type BalanceTargeting = 'all' | '100' | '1000' | '10000';

interface SurveyData {
  title: string;
  description: string;
  reward: number;
  expirationDate: string;
  targetCountry: string;
  balanceTargeting: BalanceTargeting;
}

export default function SurveyCreationForm() {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    title: '',
    description: '',
    reward: 0,
    expirationDate: '',
    targetCountry: '',
    balanceTargeting: 'all',
  });

  const { addDocument } = useFirestore('surveys');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSurveyData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDocument(surveyData);
      // Handle success (e.g., show a success message, reset form)
      alert('Survey created successfully!');
      setSurveyData({
        title: '',
        description: '',
        reward: 0,
        expirationDate: '',
        targetCountry: '',
        balanceTargeting: 'all',
      });
    } catch (error) {
      // Handle error (e.g., show error message)
      console.error('Error creating survey:', error);
      alert('Failed to create survey. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={surveyData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          name="description"
          value={surveyData.description}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label htmlFor="reward" className="block text-sm font-medium text-gray-700">Reward (in tokens)</label>
        <input
          type="number"
          id="reward"
          name="reward"
          value={surveyData.reward}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration Date</label>
        <input
          type="date"
          id="expirationDate"
          name="expirationDate"
          value={surveyData.expirationDate}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label htmlFor="targetCountry" className="block text-sm font-medium text-gray-700">Target Country</label>
        <input
          type="text"
          id="targetCountry"
          name="targetCountry"
          value={surveyData.targetCountry}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label htmlFor="balanceTargeting" className="block text-sm font-medium text-gray-700">
          Wallet Balance Targeting
        </label>
        <select
          id="balanceTargeting"
          name="balanceTargeting"
          value={surveyData.balanceTargeting}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          <option value="all">Send to All Users</option>
          <option value="100">Send to Users with Greater than $100 Balance</option>
          <option value="1000">Send to Users with Greater than $1,000 Balance</option>
          <option value="10000">Send to Users with Greater than $10,000 Balance</option>
        </select>
      </div>

      <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Create Survey
      </button>
    </form>
  );
}