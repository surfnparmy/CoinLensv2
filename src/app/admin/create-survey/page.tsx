'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { countries } from '@/lib/countries';
import Select from 'react-select';
import debounce from 'lodash/debounce';

type BalanceTargeting = 'all' | '100' | '1000' | '10000' | 'non-zero';
type RewardType = 'coinlens_points' | 'rewards_pool' | 'major_prize';
type QuestionType = 'multiple_choice' | 'open_ended' | 'country' | 'email' | 'checkbox' | 'short_answer';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

interface SurveyData {
  title: string;
  description: string;
  rewardType: RewardType;
  rewardDetails: {
    coinlensPoints?: number;
    rewardsPool?: {
      supply: number;
      amountPerUser: number;
      tokenType: string;
      totalValue: number;
    };
    majorPrize?: {
      numberOfPrizes: number;
      description: string;
      totalValue: number;
    };
  };
  maxUsers: number | null;
  expirationDate: string;
  targetCountryOption: 'all' | 'specific';
  targetCountries: string[];
  balanceTargeting: 'all' | 'balance';
  selectedBalanceBrackets: string[];
  questions: Question[];
}

const walletBalanceOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'balance', label: 'Balance Targeting' },
];

const balanceBracketOptions = [
  { value: 'non_zero', label: 'All Users with a Non-Zero Balance' },
  { value: 'shrimp', label: 'Shrimp (0-0.1 ETH)' },
  { value: 'crab', label: 'Crab (0.1-1 ETH)' },
  { value: 'fish', label: 'Fish (1-10 ETH)' },
  { value: 'dolphin', label: 'Dolphin (10-32 ETH)' },
  { value: 'whale', label: 'Whale (32 ETH +)' },
];

export default function CreateSurveyPage() {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    title: '',
    description: '',
    rewardType: 'coinlens_points',
    rewardDetails: {
      coinlensPoints: 0,
    },
    maxUsers: null,
    expirationDate: '',
    targetCountryOption: 'all',
    targetCountries: [],
    balanceTargeting: 'all',
    selectedBalanceBrackets: [],
    questions: [],
  });

  const [loading, setLoading] = useState(false);
  const [eligibleUserCount, setEligibleUserCount] = useState<number | null>(null);
  const [balanceTargeting, setBalanceTargeting] = useState('all');
  const [selectedBalanceBrackets, setSelectedBalanceBrackets] = useState([]);

  const fetchEligibleUserCount = useCallback(
    debounce(async (targetingCriteria) => {
      try {
        const response = await fetch('/api/eligible-users-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(targetingCriteria),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setEligibleUserCount(data.count);
      } catch (error) {
        console.error('Error fetching eligible user count:', error);
        setEligibleUserCount(null);
      }
    }, 500),
    []
  );

  useEffect(() => {
    const targetingCriteria = {
      targetCountryOption: surveyData.targetCountryOption,
      targetCountries: surveyData.targetCountries,
      balanceTargeting,
      selectedBalanceBrackets,
    };
    fetchEligibleUserCount(targetingCriteria);
  }, [surveyData.targetCountryOption, surveyData.targetCountries, balanceTargeting, selectedBalanceBrackets, fetchEligibleUserCount]);

  useEffect(() => {
    if (surveyData.rewardType === 'rewards_pool' && surveyData.rewardDetails.rewardsPool) {
      const { supply, amountPerUser } = surveyData.rewardDetails.rewardsPool;
      const totalValue = supply * amountPerUser;
      setSurveyData(prev => ({
        ...prev,
        rewardDetails: {
          ...prev.rewardDetails,
          rewardsPool: {
            ...prev.rewardDetails.rewardsPool!,
            totalValue,
          },
        },
        maxUsers: supply,
      }));
    }
  }, [surveyData.rewardType, surveyData.rewardDetails.rewardsPool]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSurveyData(prev => ({ ...prev, [name]: value }));
  };

  const handleRewardTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rewardType = e.target.value as RewardType;
    setSurveyData(prev => ({
      ...prev,
      rewardType,
      rewardDetails: {
        coinlensPoints: rewardType === 'coinlens_points' ? 0 : undefined,
        rewardsPool: rewardType === 'rewards_pool' ? { supply: 0, amountPerUser: 0, tokenType: '', totalValue: 0 } : undefined,
        majorPrize: rewardType === 'major_prize' ? { numberOfPrizes: 0, description: '', totalValue: 0 } : undefined,
      },
      maxUsers: rewardType === 'rewards_pool' ? 0 : null,
    }));
  };

  const handleRewardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSurveyData(prev => {
      const updatedRewardDetails = { ...prev.rewardDetails };
      
      if (prev.rewardType === 'coinlens_points') {
        updatedRewardDetails.coinlensPoints = Number(value);
      } else if (prev.rewardType === 'rewards_pool' && updatedRewardDetails.rewardsPool) {
        updatedRewardDetails.rewardsPool = {
          ...updatedRewardDetails.rewardsPool,
          [name]: name === 'tokenType' ? value : Number(value)
        };
      } else if (prev.rewardType === 'major_prize' && updatedRewardDetails.majorPrize) {
        updatedRewardDetails.majorPrize = {
          ...updatedRewardDetails.majorPrize,
          [name]: name === 'description' ? value : Number(value)
        };
      }

      return {
        ...prev,
        rewardDetails: updatedRewardDetails,
      };
    });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: 'multiple_choice',
      options: [''],
      required: false,
    };
    setSurveyData(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
  };

  const updateQuestion = (id: string, field: string, value: string | boolean) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const addOption = (questionId: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, options: [...(q.options || []), ''] } : q
      ),
    }));
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? {
          ...q,
          options: q.options?.map((opt, i) => i === index ? value : opt)
        } : q
      ),
    }));
  };

  const deleteQuestion = (id: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const handleTargetCountryOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value as 'all' | 'specific';
    setSurveyData(prev => ({
      ...prev,
      targetCountryOption: option,
      targetCountries: option === 'all' ? [] : prev.targetCountries
    }));
  };

  const handleTargetCountriesChange = (selectedOptions: any) => {
    setSurveyData(prev => ({
      ...prev,
      targetCountries: selectedOptions.map((option: any) => option.value)
    }));
  };

  const handleBalanceTargetingChange = (selectedOption: any) => {
    setBalanceTargeting(selectedOption.value);
    if (selectedOption.value === 'all') {
      setSelectedBalanceBrackets([]);
    }
  };

  const handleBalanceBracketsChange = (selectedOptions: any[]) => {
    setSelectedBalanceBrackets(selectedOptions.map(option => option.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const surveyDataToSubmit = {
        ...surveyData,
        balanceTargeting,
        selectedBalanceBrackets: balanceTargeting === 'balance' ? selectedBalanceBrackets : [],
      };
      await addDoc(collection(db, 'surveys'), surveyDataToSubmit);
      alert('Survey created successfully!');
      // Reset form
      setSurveyData({
        title: '',
        description: '',
        rewardType: 'coinlens_points',
        rewardDetails: {
          coinlensPoints: 0,
        },
        maxUsers: null,
        expirationDate: '',
        targetCountryOption: 'all',
        targetCountries: [],
        balanceTargeting: 'all',
        selectedBalanceBrackets: [],
        questions: [],
      });
      setBalanceTargeting('all');
      setSelectedBalanceBrackets([]);
    } catch (error) {
      console.error('Error creating survey:', error);
      alert('Failed to create survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Create New Survey</h1>
      
      {/* Basic Information Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
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
        </div>
      </section>

      {/* Reward Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Reward</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="rewardType" className="block text-sm font-medium text-gray-700">Reward Type</label>
            <select
              id="rewardType"
              name="rewardType"
              value={surveyData.rewardType}
              onChange={handleRewardTypeChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="coinlens_points">CoinLens Points</option>
              <option value="rewards_pool">Rewards Pool</option>
              <option value="major_prize">Major Prize</option>
            </select>
          </div>

          {surveyData.rewardType === 'coinlens_points' && (
            <div>
              <label htmlFor="coinlensPoints" className="block text-sm font-medium text-gray-700">Points per User</label>
              <input
                type="number"
                id="coinlensPoints"
                name="coinlensPoints"
                value={surveyData.rewardDetails.coinlensPoints ?? ''}
                onChange={handleRewardDetailsChange}
                required
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          )}

          {surveyData.rewardType === 'rewards_pool' && (
            <>
              <div>
                <label htmlFor="supply" className="block text-sm font-medium text-gray-700">Supply of Rewards</label>
                <input
                  type="number"
                  id="supply"
                  name="supply"
                  value={surveyData.rewardDetails.rewardsPool?.supply ?? ''}
                  onChange={handleRewardDetailsChange}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="amountPerUser" className="block text-sm font-medium text-gray-700">Amount per User</label>
                <input
                  type="number"
                  id="amountPerUser"
                  name="amountPerUser"
                  value={surveyData.rewardDetails.rewardsPool?.amountPerUser ?? ''}
                  onChange={handleRewardDetailsChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="tokenType" className="block text-sm font-medium text-gray-700">Token Type</label>
                <input
                  type="text"
                  id="tokenType"
                  name="tokenType"
                  value={surveyData.rewardDetails.rewardsPool?.tokenType ?? ''}
                  onChange={handleRewardDetailsChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="totalValue" className="block text-sm font-medium text-gray-700">Total Value</label>
                <input
                  type="number"
                  id="totalValue"
                  name="totalValue"
                  value={surveyData.rewardDetails.rewardsPool?.totalValue ?? ''}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </>
          )}

          {surveyData.rewardType === 'major_prize' && (
            <>
              <div>
                <label htmlFor="numberOfPrizes" className="block text-sm font-medium text-gray-700">Number of Prizes</label>
                <input
                  type="number"
                  id="numberOfPrizes"
                  name="numberOfPrizes"
                  value={surveyData.rewardDetails.majorPrize?.numberOfPrizes ?? ''}
                  onChange={handleRewardDetailsChange}
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Prize Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={surveyData.rewardDetails.majorPrize?.description ?? ''}
                  onChange={handleRewardDetailsChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="totalValue" className="block text-sm font-medium text-gray-700">Total Prize Value</label>
                <input
                  type="number"
                  id="totalValue"
                  name="totalValue"
                  value={surveyData.rewardDetails.majorPrize?.totalValue ?? ''}
                  onChange={handleRewardDetailsChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </>
          )}

          {surveyData.rewardType !== 'rewards_pool' && (
            <div>
              <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700">Response Cap</label>
              <input
                type="number"
                id="maxUsers"
                name="maxUsers"
                value={surveyData.maxUsers || ''}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          )}
        </div>
      </section>

      {/* Questions Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Questions</h2>
        {surveyData.questions.map((question, index) => (
          <div key={question.id} className="mb-6 p-4 border rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Question {index + 1}</h3>
              <button
                type="button"
                onClick={() => deleteQuestion(question.id)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
            <input
              type="text"
              value={question.text}
              onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
              placeholder="Enter question text"
              className="mb-2 w-full p-2 border rounded"
            />
            <div className="flex justify-between items-center mb-2">
              <select
                value={question.type}
                onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                className="p-2 border rounded"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="open_ended">Open Ended</option>
                <option value="country">Country of Residence</option>
                <option value="email">Email</option>
                <option value="checkbox">Checkbox</option>
                <option value="short_answer">Short Answer</option>
              </select>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                  className="mr-2"
                />
                Required
              </label>
            </div>
            {question.type === 'multiple_choice' && (
              <div>
                {question.options?.map((option, optionIndex) => (
                  <input
                    key={optionIndex}
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="mb-2 w-full p-2 border rounded"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addOption(question.id)}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Option
                </button>
              </div>
            )}
            {question.type === 'checkbox' && (
              <div>
                {question.options?.map((option, optionIndex) => (
                  <input
                    key={optionIndex}
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                    placeholder={`Checkbox option ${optionIndex + 1}`}
                    className="mb-2 w-full p-2 border rounded"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addOption(question.id)}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Checkbox Option
                </button>
              </div>
            )}
            {(question.type === 'open_ended' || question.type === 'short_answer' || question.type === 'email' || question.type === 'country') && (
              <p className="text-sm text-gray-500 mt-2">
                {question.type === 'open_ended' && "Users will see a large text area for their response."}
                {question.type === 'short_answer' && "Users will see a single-line text input for their response."}
                {question.type === 'email' && "Users will be prompted to enter a valid email address."}
                {question.type === 'country' && "Users will select their country of residence from a dropdown."}
              </p>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Question
        </button>
      </section>

      {/* Targeting Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Targeting</h2>
        <div className="space-y-4">
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
            <label htmlFor="targetCountryOption" className="block text-sm font-medium text-gray-700">
              Target Country Option
            </label>
            <select
              id="targetCountryOption"
              name="targetCountryOption"
              value={surveyData.targetCountryOption}
              onChange={handleTargetCountryOptionChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="all">Send to All Users</option>
              <option value="specific">Select Target Countries</option>
            </select>
          </div>

          {surveyData.targetCountryOption === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target Countries
              </label>
              <Select
                isMulti
                name="countries"
                options={countries}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={handleTargetCountriesChange}
                value={countries.filter(country => surveyData.targetCountries.includes(country.value))}
              />
            </div>
          )}

          <div>
            <label htmlFor="balanceTargeting" className="block text-sm font-medium text-gray-700">
              Wallet Balance Targeting
            </label>
            <Select
              id="balanceTargeting"
              options={walletBalanceOptions}
              value={walletBalanceOptions.find(option => option.value === balanceTargeting)}
              onChange={handleBalanceTargetingChange}
              className="mt-1"
            />
          </div>

          {balanceTargeting === 'balance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Balance Brackets
              </label>
              <Select
                isMulti
                name="balanceBrackets"
                options={balanceBracketOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={handleBalanceBracketsChange}
                value={balanceBracketOptions.filter(option => selectedBalanceBrackets.includes(option.value))}
              />
            </div>
          )}

          {/* Eligible User Count Display */}
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-medium mb-2">Estimated Reach</h3>
            {eligibleUserCount !== null ? (
              <p>This survey will be sent to approximately {eligibleUserCount} users based on the current targeting criteria.</p>
            ) : (
              <p>Calculating estimated reach...</p>
            )}
          </div>
        </div>
      </section>

      <button 
        type="submit" 
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        disabled={loading}
      >
        {loading ? 'Creating Survey...' : 'Create Survey'}
      </button>
    </form>
  );
}