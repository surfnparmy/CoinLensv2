import React from 'react';

interface RewardOverviewProps {
  totalRewards: number;
  nextMilestone: number;
}

const RewardOverview: React.FC<RewardOverviewProps> = ({ totalRewards, nextMilestone }) => {
  const progress = (totalRewards / nextMilestone) * 100;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Reward Overview</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Your current rewards and progress</p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Total Rewards</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{totalRewards} points</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Next Milestone</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{nextMilestone} points</dd>
          </div>
          <div className="py-4 sm:py-5 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 mb-2">Progress to Next Milestone</dt>
            <dd className="mt-1">
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold inline-block text-blue-600">
                    {progress.toFixed(2)}%
                  </span>
                </div>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default RewardOverview;