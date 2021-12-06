const { AirdropWAIV, User } = require('database').models;

module.exports = async () => {
  try {
    const airdrops = await AirdropWAIV.find({}, { name: 1, expertiseWAIV: 1 });
    for (const airdrop of airdrops) {
      await User.updateOne({ name: airdrop.name }, { expertiseWAIV: airdrop.expertiseWAIV });
    }
    console.log('task finished');
  } catch (error) {
    return { error };
  }
};
