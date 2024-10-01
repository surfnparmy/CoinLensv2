import React from 'react';
import Link from 'next/link';

interface Survey {
  id: string;
  title: string;
  description: string;
  reward: {
    type: 'coinlens_points' | 'rewards_pool' | 'major_prize';
    amount?: number;
    currency?: string;
  };
}

interface SurveyListProps {
  surveys: Survey[];
}

const SurveyList: React.FC<SurveyListProps> = ({ surveys }) => {
  return (
    <div className="space-y-4">
      {surveys.map((survey) => (
        <div key={survey.id} className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">{survey.title}</h3>
          <p className="text-gray-600 mb-2">{survey.description}</p>
          <p className="text-sm text-gray-500 mb-2">
            Reward: {renderReward(survey.reward)}
          </p>
          <Link href={`/surveys/${survey.id}`}>
            <a className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Start Survey
            </a>
          </Link>
        </div>
      ))}
    </div>
  );
};

function renderReward(reward: Survey['reward']) {
  switch (reward.type) {
    case 'coinlens_points':
      return `${reward.amount} CoinLens Points`;
    case 'rewards_pool':
      return `${reward.amount} ${reward.currency}`;
    case 'major_prize':
      return 'Major Prize';
    default:
      return 'Unknown reward';
  }
}

export default SurveyList;