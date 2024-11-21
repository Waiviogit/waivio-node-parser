const { getCurrentPriceInfo } = require('../steemApi/usersUtil');

// check current calc +
// check actual rc: to parse in weight should multiply 0.000001 or * 1e-6 +
// check against waiv

const getUSDFromWeightHelper = async (weight) => {
  const { currentPrice: rate, rewardFund } = await getCurrentPriceInfo();
  const { recent_claims: recentClaims, reward_balance: rewardBalance } = rewardFund;

  return (weight / recentClaims) * rewardBalance.replace(' HIVE', '') * rate * 1000000;
};

const getWeightFromUSD = async (usdAmount) => {
  // Retrieve the necessary data
  const { currentPrice: rate, rewardFund } = await getCurrentPriceInfo();
  const { recent_claims: recentClaims, reward_balance: rewardBalance } = rewardFund;

  // Remove ' HIVE' from rewardBalance and convert to a number
  const rewardBalanceNumber = parseFloat(rewardBalance.replace(' HIVE', ''));

  // Calculate the weight
  const weight = (usdAmount / (rewardBalanceNumber * rate * 1000000)) * recentClaims;

  return weight;
};

// pending_payout_value: '218 HBD' / 2
// total_payout_value : '121.074 HBD'

