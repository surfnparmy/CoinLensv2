import React, { useState } from 'react';
import { MultiSelect } from '../FormComponents';

const SurveyCreationForm = () => {
  const [balanceTargeting, setBalanceTargeting] = useState('all');
  const [selectedBalanceBrackets, setSelectedBalanceBrackets] = useState([]);

  const balanceTargetingOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'balance', label: 'Balance Targeting' },
  ];

  const balanceBracketOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'non_zero', label: 'All Users with a Non-Zero Balance' },
    { value: 'shrimp', label: 'Shrimp (0-0.1 ETH)' },
    { value: 'crab', label: 'Crab (0.1-1 ETH)' },
    { value: 'fish', label: 'Fish (1-10 ETH)' },
    { value: 'dolphin', label: 'Dolphin (10-32 ETH)' },
    { value: 'whale', label: 'Whale (32 ETH +)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log({
      balanceTargeting,
      selectedBalanceBrackets: balanceTargeting === 'balance' ? selectedBalanceBrackets : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Other form fields for survey creation */}

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="walletBalanceTargeting">
          Wallet Balance Targeting
        </label>
        <select
          id="walletBalanceTargeting"
          value={balanceTargeting}
          onChange={(e) => setBalanceTargeting(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {balanceTargetingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {balanceTargeting === 'balance' && (
        <MultiSelect
          label="Select Balance Brackets"
          options={balanceBracketOptions}
          value={selectedBalanceBrackets}
          onChange={(selected) => setSelectedBalanceBrackets(selected)}
        />
      )}

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Create Survey
      </button>
    </form>
  );
};

export default SurveyCreationForm;