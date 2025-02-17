const generateRandomNumber = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return randomNumber.toString();
};

module.exports = {
  generateRandomNumber,
};
