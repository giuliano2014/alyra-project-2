const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Voting = artifacts.require('Voting');

contract('Voting', accounts => {

    let votingInstance;
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const nonVoter = accounts[3];

    describe('test onlyVoter modifier', () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
            await votingInstance.addVoter(voter2, { from: owner });
        });

        it("should allow access for registered voter", async() => {
            await votingInstance.getVoter(voter1, { from: voter1 });
            await votingInstance.getVoter(voter1, { from: voter2 });
            await votingInstance.getVoter(voter2, { from: voter1 });
        });

        it('should revert when non-registered voter tries to access', async () => {
            await expectRevert(
                votingInstance.getVoter(voter1, { from: owner }),
                "You're not a voter"
            );
            await expectRevert(
                votingInstance.getVoter(voter2, { from: owner }),
                "You're not a voter"
            );
        });
    });

    describe('test addVoter function', () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
        });
    
        it('should add a voter', async () => {
            await votingInstance.addVoter(voter1, { from: owner });
            const voter = await votingInstance.getVoter(voter1, { from: voter1 });
    
            expect(voter.isRegistered).to.be.true;
            expect(voter.hasVoted).to.be.false;
            expect(voter.votedProposalId).to.be.bignumber.equal(new BN(0));
        });
    
        it('should revert when adding a registered voter', async () => {
            await votingInstance.addVoter(voter1, { from: owner });
    
            await expectRevert(
                votingInstance.addVoter(voter1, { from: owner }),
                'Already registered'
            );
        });
    
        it('should revert when adding a voter by non-owner account', async () => {
            await expectRevert(
                votingInstance.addVoter(voter2, { from: voter1 }),
                'Ownable: caller is not the owner'
            );
        });
    });

    describe('test getVoter function', () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
        });

        it('should return correct voter information', async () => {
            await votingInstance.addVoter(voter1, { from: owner });

            const voter = await votingInstance.getVoter(voter1, { from: voter1 });

            expect(voter.isRegistered).to.be.true;
            expect(voter.hasVoted).to.be.false;
            expect(voter.votedProposalId).to.be.bignumber.equal(new BN(0));
        });

        it('should revert when getting non-registered voter', async () => {
            await expectRevert.unspecified(
                votingInstance.getVoter(nonVoter, { from: voter1 }),
            );
        });

        // it('should revert when getting non-registered voter', async () => {
        //     await expectRevert(
        //         votingInstance.getVoter(nonVoter, { from: voter1 }),
        //         "You're not a voter"
        //     );
        // });
    });

    describe('test addProposal function', () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
        });

        it('should add a proposal and emit ProposalRegistered event', async () => {
            await votingInstance.startProposalsRegistering({ from: owner });

            const addProposal = await votingInstance.addProposal('Proposal 1', { from: voter1 });
            const proposal = await votingInstance.getOneProposal(1, { from: voter1 });

            expect(proposal.description).to.be.equal('Proposal 1');
            expect(proposal.voteCount).to.be.bignumber.equal(new BN(0));

            expectEvent(addProposal, 'ProposalRegistered', { proposalId: new BN(1) });
        });

        it('should revert when adding an empty proposal', async () => {
            await votingInstance.startProposalsRegistering({ from: owner });
            await expectRevert(
                votingInstance.addProposal('', { from: voter1 }),
                'Vous ne pouvez pas ne rien proposer'
            );
        });

        it("should revert when adding a proposal outside of proposals registration phase", async () => {
            await expectRevert(
                votingInstance.addProposal("Proposal 1", { from: voter1 }),
                "Proposals are not allowed yet"
            );
        });
    });

});
