import React from 'react';
import { Survey } from '@/lib/types';

interface SurveyHistoryProps {
  userData: {
    completedSurveys: Survey[];
  };
}

export default function SurveyHistory({ userData }: SurveyHistoryProps) {
  const { completedSurveys } = userData;

  if (!completedSurveys || completedSurveys.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Survey History</h2>
        <p>You haven't completed any surveys yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Survey History</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {completedSurveys.map((survey) => (
              <li key={survey.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{survey.title}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Reward: {survey.reward}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Completed on: {new Date(survey.completedAt).toLocaleDateString()}
                    </p>
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