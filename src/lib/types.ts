export type WalletType = 'MetaMask' | 'Trust Wallet' | 'Phantom';

export type QuestionType = 'multiple_choice' | 'checkbox' | 'short_answer' | 'email' | 'country' | 'number';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

export type RewardType = 'points' | 'pool' | 'prize';

export interface BaseReward {
  type: RewardType;
  maxUsers: number | null;
}

export interface PointsReward extends BaseReward {
  type: 'points';
  points: number;
}

export interface PoolReward extends BaseReward {
  type: 'pool';
  supply: number;
  amountPerUser: number;
  tokenType: string;
  totalValue: number;
}

export interface PrizeReward extends BaseReward {
  type: 'prize';
  numberOfPrizes: number;
  description: string;
  totalValue: number;
}

export type Reward = PointsReward | PoolReward | PrizeReward;

export type WalletBalanceTarget = 'all' | 'non-zero' | 'low' | 'medium' | 'high';

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  reward: Reward;
  rewardsClaimed: number;
  walletBalanceTarget: WalletBalanceTarget;
  minWalletBalance: number;
  maxWalletBalance: number;
}

export interface AdminSurvey extends Survey {
  isActive: boolean;
  rewardsClaimed: number;
  targeting: TargetingCriteria;
}

export interface UserData {
  totalRewards: number;
  nextMilestone: number;
  completedSurveys: CompletedSurvey[];
  country: string;
}

export interface CompletedSurvey {
  id: string;
  title: string;
  reward: number | Reward;
  completedAt: string;
}

export type TargetingCriteria = 
  | { type: 'all' }
  | { type: 'countries', countries: string[] };