const roundDown = (number, decimals) => {
  decimals = decimals || 0;
  return (Math.floor(number * 10 ** decimals) / 10 ** decimals);
};

const isInRange = ({ number, min, max }) => number >= min && number <= max;

module.exports = {
  roundDown,
  isInRange,
};
