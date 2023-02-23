const Voting = artifacts.require("Voting");

module.exports = (deployer) => {
  deployer.deploy(Voting);
};
