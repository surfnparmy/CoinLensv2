import { useAuth } from '@/lib/hooks/useAuth';
import { useWalletBalance } from '@/lib/hooks/useWalletBalance';
import { useSurveys } from '@/lib/hooks/useSurveys';

function SurveyList() {
  const { user } = useAuth();
  const { balance } = useWalletBalance(user?.uid);
  const { surveys } = useSurveys();

  const eligibleSurveys = surveys.filter(survey => {
    if (survey.walletBalanceTarget === 'all') {
      return true;
    } else if (survey.walletBalanceTarget === 'non-zero') {
      return balance > 0;
    } else {
      return balance >= survey.minWalletBalance && balance <= survey.maxWalletBalance;
    }
  });

  return (
    <div>
      {eligibleSurveys.map(survey => (
        <SurveyItem key={survey.id} survey={survey} />
      ))}
    </div>
  );
}

export default SurveyList;