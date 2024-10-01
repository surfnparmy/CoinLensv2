import React, { useState, useEffect } from 'react';
import { AdminSurvey, Question, Reward, QuestionType, RewardType, TargetingCriteria } from '@/lib/types';
import countryList from '@/lib/countryList';

interface SurveyFormProps {
  initialSurvey?: AdminSurvey;
  onSubmit: (survey: AdminSurvey) => void;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ initialSurvey, onSubmit }) => {
  const [survey, setSurvey] = useState<AdminSurvey>(
    initialSurvey || {
      id: '',
      title: '',
      description: '',
      questions: [],
      reward: { type: 'points', points: 0, maxUsers: null },
      isActive: false,
      rewardsClaimed: 0,
      targeting: { type: 'all' },
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSurvey((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const addQuestion = () => {
    setSurvey((prev) => {
      const questionCount = prev.questions.length + 1;
      let newQuestion: Question;

      switch (questionCount % 3) {  // Cycle through question types
        case 1:
          newQuestion = {
            id: `q${questionCount}`,
            text: 'What is your email address?',
            type: 'email',
            required: true
          };
          break;
        case 2:
          newQuestion = {
            id: `q${questionCount}`,
            text: 'What is your country of residence?',
            type: 'country',
            required: true
          };
          break;
        default:
          newQuestion = {
            id: `q${questionCount}`,
            text: '',
            type: 'multiple_choice',
            options: [''],
            required: false
          };
      }

      return {
        ...prev,
        questions: [...prev.questions, newQuestion],
      };
    });
  };

  const removeQuestion = (index: number) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      const options = newQuestions[questionIndex].options || [];
      options[optionIndex] = value;
      newQuestions[questionIndex].options = options;
      return { ...prev, questions: newQuestions };
    });
  };

  const addOption = (questionIndex: number) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options = [...(newQuestions[questionIndex].options || []), ''];
      return { ...prev, questions: newQuestions };
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options = newQuestions[questionIndex].options?.filter((_, i) => i !== optionIndex);
      return { ...prev, questions: newQuestions };
    });
  };

  const handleRewardChange = (field: string, value: any) => {
    setSurvey((prev) => ({
      ...prev,
      reward: { ...prev.reward, [field]: value },
    }));
  };

  const handleRewardTypeChange = (type: RewardType) => {
    let newReward: Reward;
    switch (type) {
      case 'points':
        newReward = { type, points: 0, maxUsers: null };
        break;
      case 'pool':
        newReward = { type, supply: 0, amountPerUser: 0, tokenType: '', totalValue: 0, maxUsers: 0 };
        break;
      case 'prize':
        newReward = { type, numberOfPrizes: 0, description: '', totalValue: 0, maxUsers: null };
        break;
    }
    setSurvey((prev) => ({ ...prev, reward: newReward }));
  };

  useEffect(() => {
    if (survey.reward.type === 'pool') {
      const totalValue = survey.reward.supply * survey.reward.amountPerUser;
      handleRewardChange('totalValue', totalValue);
      handleRewardChange('maxUsers', survey.reward.supply);
    }
  }, [survey.reward]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(survey);
  };

  const renderQuestionFields = (question: Question, index: number) => {
    switch (question.type) {
      case 'multiple_choice':
      case 'checkbox':
        return (
          <div className="mt-2">
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center mt-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                  placeholder={`Option ${optionIndex + 1}`}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index, optionIndex)}
                  className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 transition duration-150 ease-in-out"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(index)}
              className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition duration-150 ease-in-out"
            >
              Add Option
            </button>
          </div>
        );
      case 'short_answer':
      case 'email':
      case 'number':
      case 'country':
        return null; // No additional fields needed for these types in the admin view
      default:
        return null;
    }
  };

  const handleTargetingChange = (type: 'all' | 'countries') => {
    setSurvey((prev) => ({
      ...prev,
      targeting: type === 'all' ? { type: 'all' } : { type: 'countries', countries: [] },
    }));
  };

  const handleCountrySelection = (selectedCountries: string[]) => {
    setSurvey((prev) => ({
      ...prev,
      targeting: { type: 'countries', countries: selectedCountries },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Survey Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={survey.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Survey Description</label>
        <textarea
          id="description"
          name="description"
          value={survey.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Questions</h3>
        {survey.questions.map((question, index) => (
          <div key={question.id} className="mt-4 border-t border-gray-200 pt-4">
            <input
              type="text"
              value={question.text}
              onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
              placeholder={
                question.type === 'email'
                  ? 'What is your email address?'
                  : question.type === 'country'
                  ? 'What is your country of residence?'
                  : 'Enter question text'
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <select
              value={question.type}
              onChange={(e) => handleQuestionChange(index, 'type', e.target.value as QuestionType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="checkbox">Checkbox</option>
              <option value="short_answer">Short Answer</option>
              <option value="email">Email</option>
              <option value="country">Country of Residence</option>
              <option value="number">Number</option>
            </select>
            {renderQuestionFields(question, index)}
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Required</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => removeQuestion(index)}
              className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition duration-150 ease-in-out"
            >
              Remove Question
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="mt-4 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition duration-150 ease-in-out"
        >
          Add Question
        </button>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Reward</h3>
        <div className="mt-2">
          <select
            value={survey.reward.type}
            onChange={(e) => handleRewardTypeChange(e.target.value as RewardType)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="points">CoinLens Points</option>
            <option value="pool">Rewards Pool</option>
            <option value="prize">Major Prize</option>
          </select>
        </div>
        
        {survey.reward.type === 'points' && (
          <div className="mt-2">
            <label htmlFor="points" className="block text-sm font-medium text-gray-700">Points per user</label>
            <input
              type="number"
              id="points"
              value={survey.reward.points}
              onChange={(e) => handleRewardChange('points', parseInt(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        )}
        
        {survey.reward.type === 'pool' && (
          <div className="space-y-2 mt-2">
            <div>
              <label htmlFor="supply" className="block text-sm font-medium text-gray-700">Supply of rewards</label>
              <input
                type="number"
                id="supply"
                value={survey.reward.supply}
                onChange={(e) => handleRewardChange('supply', parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="amountPerUser" className="block text-sm font-medium text-gray-700">Amount per user</label>
              <input
                type="number"
                id="amountPerUser"
                value={survey.reward.amountPerUser}
                onChange={(e) => handleRewardChange('amountPerUser', parseFloat(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="tokenType" className="block text-sm font-medium text-gray-700">Token type</label>
              <input
                type="text"
                id="tokenType"
                value={survey.reward.tokenType}
                onChange={(e) => handleRewardChange('tokenType', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="totalValue" className="block text-sm font-medium text-gray-700">Total value</label>
              <input
                type="number"
                id="totalValue"
                value={survey.reward.totalValue}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
              />
            </div>
          </div>
        )}
        
        {survey.reward.type === 'prize' && (
          <div className="space-y-2 mt-2">
            <div>
              <label htmlFor="numberOfPrizes" className="block text-sm font-medium text-gray-700">Number of prizes</label>
              <input
                type="number"
                id="numberOfPrizes"
                value={survey.reward.numberOfPrizes}
                onChange={(e) => handleRewardChange('numberOfPrizes', parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="prizeDescription" className="block text-sm font-medium text-gray-700">Prize description</label>
              <input
                type="text"
                id="prizeDescription"
                value={survey.reward.description}
                onChange={(e) => handleRewardChange('description', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="prizeTotalValue" className="block text-sm font-medium text-gray-700">Total prize value</label>
              <input
                type="number"
                id="prizeTotalValue"
                value={survey.reward.totalValue}
                onChange={(e) => handleRewardChange('totalValue', parseFloat(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        )}
        
        {survey.reward.type !== 'pool' && (
          <div className="mt-2">
            <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700">Max number of users (optional)</label>
            <input
              type="number"
              id="maxUsers"
              value={survey.reward.maxUsers || ''}
              onChange={(e) => handleRewardChange('maxUsers', e.target.value ? parseInt(e.target.value) : null)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Targeting</h3>
        <div className="mt-2">
          <select
            value={survey.targeting.type}
            onChange={(e) => handleTargetingChange(e.target.value as 'all' | 'countries')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">Send to All Users</option>
            <option value="countries">Target Specific Countries</option>
          </select>
        </div>
        {survey.targeting.type === 'countries' && (
          <div className="mt-2">
            <select
              multiple
              value={survey.targeting.type === 'countries' ? survey.targeting.countries : []}
              onChange={(e) => handleCountrySelection(Array.from(e.target.selectedOptions, option => option.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {countryList.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Survey
        </button>
      </div>
    </form>
  );
};

export default SurveyForm;