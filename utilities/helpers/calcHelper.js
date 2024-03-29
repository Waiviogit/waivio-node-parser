const roundDown = (number, decimals) => {
  decimals = decimals || 0;
  return (Math.floor(number * 10 ** decimals) / 10 ** decimals);
};

module.exports = {
  roundDown,
};
