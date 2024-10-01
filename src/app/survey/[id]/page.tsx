'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Survey, Question } from '@/lib/types';
import { fetchSurvey, submitSurvey } from '@/lib/api';
import SurveyQuestion from '@/components/SurveyQuestion';

export default function SurveyPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [rewardsAvailable, setRewardsAvailable] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadSurvey() {
      try {
        const surveyData = await fetchSurvey(params.id);
        setSurvey(surveyData);
        // Check if rewards are still available
        if (surveyData.reward.type === 'pool' && surveyData.rewardsClaimed >= surveyData.reward.supply) {
          setRewardsAvailable(false);
        } else if (surveyData.reward.maxUsers !== null && surveyData.rewardsClaimed >= surveyData.reward.maxUsers) {
          setRewardsAvailable(false);
        }
      } catch (error) {
        setError('Failed to load survey. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSurvey();
  }, [params.id]);

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (survey && currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (survey) {
      try {
        await submitSurvey(survey.id, answers);
        setCompleted(true);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to submit survey. Please try again.');
        }
      }
    }
  };

  if (loading) return <div>Loading survey...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!survey) return <div>Survey not found.</div>;

  if (!rewardsAvailable) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Survey Unavailable</h2>
        <p>We're sorry, but all rewards for this survey have been claimed. Thank you for your interest!</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Survey Completed!</h2>
        <p>Thank you for completing the survey. You've earned a reward.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-150 ease-in-out"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = survey.questions[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">{survey.title}</h1>
      <SurveyQuestion
        question={currentQuestion}
        onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
      />
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition duration-150 ease-in-out disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-150 ease-in-out"
        >
          {currentQuestionIndex === survey.questions.length - 1 ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}