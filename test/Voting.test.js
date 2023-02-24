const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Voting = artifacts.require('Voting');

contract('Voting', accounts => {

    let votingInstance;
    const owner = accounts[0];
    const voter1 = accounts[1];

    describe ('Add voter test', () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
        });
    
        it('should add a voter', async() => {
            await votingInstance.addVoter(voter1, { from: owner });
            const voter = await votingInstance.getVoter(voter1, { from: voter1 });
    
            expect(voter.isRegistered).to.be.true;
            expect(voter.hasVoted).to.be.false;
            expect(voter.votedProposalId).to.be.bignumber.equal(new BN(0));
        });
    
        it('should revert when adding a registered voter', async() => {
            await votingInstance.addVoter(voter1, { from: owner });
    
            await expectRevert(
                votingInstance.addVoter(voter1, { from: owner }),
                'Already registered'
            );
        });
    
        it('should revert when adding a voter by non-owner account', async() => {
            await expectRevert(
                votingInstance.addVoter(voter1, { from: voter1 }),
                'Ownable: caller is not the owner'
            );
        });
    })

});

