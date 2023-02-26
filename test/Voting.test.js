const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Voting = artifacts.require('Voting');

contract('Voting', accounts => {

    let votingInstance;
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const voter3 = accounts[3];
    const nonVoter = accounts[4];

    describe('test onlyVoters modifier', () => {
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

        it('should emit VoterRegistered event', async () => {
            const addVoter = await votingInstance.addVoter(voter1, { from: owner });

            await expectEvent(addVoter, 'VoterRegistered', {
                voterAddress: voter1
            });
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

        it('should add a proposal', async () => {
            await votingInstance.startProposalsRegistering({ from: owner });

            const addProposal = await votingInstance.addProposal('Proposal 1', { from: voter1 });
            const proposal = await votingInstance.getOneProposal(1, { from: voter1 });

            expect(proposal.description).to.be.equal('Proposal 1');
            expect(proposal.voteCount).to.be.bignumber.equal(new BN(0));
        });

        it('should emit ProposalRegistered event', async () => {
            await votingInstance.startProposalsRegistering({ from: owner });
            const addProposal = await votingInstance.addProposal('Proposal 1', { from: voter1 });

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

    describe('test getOneProposal function', () => {
        before(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter2, { from: owner });
            await votingInstance.startProposalsRegistering({ from: owner });
        });

        it('should get a proposal', async () => {
            await votingInstance.addProposal('Be kind to all life forms', { from: voter2 });
            const proposal = await votingInstance.getOneProposal(1, { from: voter2 });

            expect(proposal.description).to.be.equal('Be kind to all life forms');
            expect(proposal.voteCount).to.be.bignumber.equal(new BN(0));
        });

        it('should revert when trying to get a proposal by non-voter account', async () => {
            await expectRevert(
                votingInstance.getOneProposal(1, { from: nonVoter }),
                "You're not a voter"
            );
        });

        it("should revert when trying to get a non-exist proposal ", async () => {
            await expectRevert.unspecified(
                votingInstance.getOneProposal(401, { from: voter2 }),
            );
        });
    });

    // describe('test getOneProposal function', () => {
    //     beforeEach(async () => {
    //         votingInstance = await Voting.new({ from: owner });
    //         await votingInstance.addVoter(voter2, { from: owner });
    //         await votingInstance.startProposalsRegistering({ from: owner });
    //     });

    //     it('should get a proposal', async () => {
    //         await votingInstance.addProposal('Be kind to all life forms', { from: voter2 });
    //         const proposal = await votingInstance.getOneProposal(1, { from: voter2 });

    //         expect(proposal.description).to.be.equal('Be kind to all life forms');
    //         expect(proposal.voteCount).to.be.bignumber.equal(new BN(0));
    //     });

    //     it('should revert when trying to get a proposal by non-voter account', async () => {
    //         await expectRevert(
    //             votingInstance.getOneProposal(1, { from: nonVoter }),
    //             "You're not a voter"
    //         );
    //     });

    //     it("should revert when trying to get a non-exist proposal ", async () => {
    //         await votingInstance.addProposal('Be kind to all life forms', { from: voter2 });
    //         await expectRevert.unspecified(
    //             votingInstance.getOneProposal(401, { from: voter2 }),
    //         );
    //     });
    // });

    describe('test setVote function', () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
            await votingInstance.addVoter(voter2, { from: owner });
            await votingInstance.startProposalsRegistering({ from: owner });
            await votingInstance.addProposal('First proposal', { from: voter1 });
            await votingInstance.addProposal('Second proposal', { from: voter2 });
            await votingInstance.addProposal('Third proposal', { from: voter2 });
            await votingInstance.endProposalsRegistering({ from: owner });
        });

        it('should vote count proposal set to 0, after adding proposal', async () => {
            await votingInstance.startVotingSession({ from: owner });

            const firstProposal = await votingInstance.getOneProposal(1, { from: voter1 });
            const secondProposal = await votingInstance.getOneProposal(2, { from: voter1 });
            
            expect(await firstProposal.voteCount).to.be.bignumber.equal(new BN(0));
            expect(await secondProposal.voteCount).to.be.bignumber.equal(new BN(0));
        });

        it('should vote count increased by 1, after the proposal has been chosen', async () => {
            await votingInstance.startVotingSession({ from: owner });
            await votingInstance.setVote(1, { from: voter1 });
            await votingInstance.setVote(2, { from: voter2 });

            const firstProposal = await votingInstance.getOneProposal(1, { from: voter1 });
            const secondProposal = await votingInstance.getOneProposal(2, { from: voter2 });
            
            expect(await firstProposal.voteCount).to.be.bignumber.equal(new BN(1));
            expect(await secondProposal.voteCount).to.be.bignumber.equal(new BN(1));
        });

        it('should update registered voter, after voting for a proposal', async () => {
            await votingInstance.startVotingSession({ from: owner });
            await votingInstance.setVote(2, { from: voter1 });

            const voter = await votingInstance.getVoter(voter1, { from: voter1 });

            expect(voter.hasVoted).to.equal(true);
            expect(voter.votedProposalId).to.be.bignumber.equal('2');
        });

        it('should revert when trying to vote, before voting session starts', async () => {
            await expectRevert(
                votingInstance.setVote(2, { from: voter1 }),
                'Voting session havent started yet'
            );
        });

        it('should revert when a voter has already voted', async () => {
            await votingInstance.startVotingSession({ from: owner });
            await votingInstance.setVote(1, { from: voter1 });

            await expectRevert(
                votingInstance.setVote(1, { from: voter1 }),
                "You have already voted"
            );
        });

        it('should revert when trying to vote for a non-existing proposal', async () => {
            await votingInstance.startVotingSession({ from: owner });

            await expectRevert(
                votingInstance.setVote(401, { from: voter1 }),
                'Proposal not found'
            );
        });
    });

    describe('test tallyVotes function', () => {
        let tallyVotes;

        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
            await votingInstance.addVoter(voter2, { from: owner });
            await votingInstance.addVoter(voter3, { from: owner });
            await votingInstance.startProposalsRegistering({ from: owner });
            await votingInstance.addProposal("Eating", { from: voter1 });
            await votingInstance.addProposal("Sleeping", { from: voter2 });
            await votingInstance.addProposal("Working", { from: voter3 });
            await votingInstance.endProposalsRegistering({ from: owner });
            await votingInstance.startVotingSession({ from: owner });
            await votingInstance.setVote(0, { from: voter1 });
            await votingInstance.setVote(1, { from: voter2 });
            await votingInstance.setVote(1, { from: voter3 });
            await votingInstance.endVotingSession({ from: owner });
            tallyVotes = await votingInstance.tallyVotes({ from: owner });
        });

        it('should tally votes when voting session is ended', async () => {
            expect(await votingInstance.winningProposalID()).to.be.bignumber.equal(new BN(1));
            expect(await votingInstance.workflowStatus()).to.be.bignumber.equal(new BN(5));
        });

        it('should emit WorkflowStatusChange event', async () => {
            await expectEvent(tallyVotes, 'WorkflowStatusChange', {
                previousStatus: new BN(4),
                newStatus: new BN(5)
            });
        });

        it('should revert when trying to tally votes before voting session ended', async () => {
            await expectRevert(
                votingInstance.tallyVotes({ from: owner }),
                "Current status is not voting session ended"
            );
        });

        it('should revert when a non-owner tries to tally votes', async () => {
            await expectRevert(
                votingInstance.tallyVotes({ from: voter1 }),
                'Ownable: caller is not the owner'
            );
        });
    });

    describe('test winningProposalID', () => {
        let winningProposalID;

        before(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
            await votingInstance.addVoter(voter2, { from: owner });
            await votingInstance.addVoter(voter3, { from: owner });
            await votingInstance.startProposalsRegistering({ from: owner });
            await votingInstance.addProposal("Eating", { from: voter1 });
            await votingInstance.addProposal("Sleeping", { from: voter2 });
            await votingInstance.addProposal("Working", { from: voter3 });
            await votingInstance.endProposalsRegistering({ from: owner });
            await votingInstance.startVotingSession({ from: owner });
            await votingInstance.setVote(2, { from: voter1 });
            await votingInstance.setVote(1, { from: voter2 });
            await votingInstance.setVote(2, { from: voter3 });
            await votingInstance.endVotingSession({ from: owner });
        });

        it('should winning proposal id equals to 0', async () => {
            winningProposalID = await votingInstance.winningProposalID();

            expect(winningProposalID).to.be.bignumber.equal(new BN(0));
        });

        it('should winning proposal id equals to 2', async () => {
            await votingInstance.tallyVotes({ from: owner });
            winningProposalID = await votingInstance.winningProposalID();

            expect(winningProposalID).to.be.bignumber.equal(new BN(2));
        });
    });

    describe('test startProposalsRegistering function', () => {
        let startProposalsRegistering;

        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
            startProposalsRegistering = await votingInstance.startProposalsRegistering({ from: owner });
        });

        it('should start proposals registering after voters registration started', async () => {
            expect(await votingInstance.workflowStatus()).to.be.bignumber.equal(new BN(1));
        });

        it('should add GENESIS proposal', async () => {
            const proposal = await votingInstance.getOneProposal(0, { from: voter1 });

            expect(proposal.description).to.be.equal('GENESIS');
            expect(proposal.voteCount).to.be.bignumber.equal(new BN(0));
        });

        it('should emit WorkflowStatusChange event', async () => {
            await expectEvent(startProposalsRegistering, 'WorkflowStatusChange', {
                previousStatus: new BN(0),
                newStatus: new BN(1)
            });
        });

        it('should revert when trying to start proposals registering before voters registration started', async () => {
            await expectRevert(
                votingInstance.startProposalsRegistering({ from: owner }),
                'Registering proposals cant be started now'
            );
        });

        it('should revert when a non-owner tries to start proposals registering', async () => {
            await expectRevert(
                votingInstance.startProposalsRegistering({ from: voter1 }),
                'Ownable: caller is not the owner'
            );
        });
    });

    describe('test endProposalsRegistering function', () => {
        let endProposalsRegistering;

        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
            await votingInstance.startProposalsRegistering({ from: owner });
            await votingInstance.addProposal('First proposal', { from: voter1 });
            endProposalsRegistering = await votingInstance.endProposalsRegistering({ from: owner });
        });

        it('should end proposals registration after proposals registration started', async () => {
            expect(await votingInstance.workflowStatus()).to.be.bignumber.equal(new BN(2));
        });

        it('should emit WorkflowStatusChange event', async () => {
            await expectEvent(endProposalsRegistering, 'WorkflowStatusChange', {
                previousStatus: new BN(1),
                newStatus: new BN(2)
            });
        });

        it('should revert when trying to end proposals registration before it started', async () => {
            await expectRevert(
                votingInstance.endProposalsRegistering({ from: owner }),
                'Registering proposals havent started yet'
            );
        });

        it('should revert when a non-owner tries to end proposals registration', async () => {
            await expectRevert(
                votingInstance.endProposalsRegistering({ from: voter1 }),
                'Ownable: caller is not the owner'
            );
        });
    });

    describe('test startVotingSession function', () => {
        let startVotingSession;

        before(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
            await votingInstance.startProposalsRegistering({ from: owner });
            await votingInstance.addProposal('First proposal', { from: voter1 });
            await votingInstance.endProposalsRegistering({ from: owner });
            startVotingSession = await votingInstance.startVotingSession({ from: owner });
        });

        it('should start voting session when proposals registration is ended', async () => {
            expect(await votingInstance.workflowStatus()).to.be.bignumber.equal(new BN(3));
        });

        it('should emit WorkflowStatusChange event', async () => {
            await expectEvent(startVotingSession, 'WorkflowStatusChange', {
                previousStatus: new BN(2),
                newStatus: new BN(3)
            });
        });

        it('should revert when trying to start voting session before proposals registration is ended', async () => {
            await expectRevert(
                votingInstance.startVotingSession({ from: owner }),
                'Registering proposals phase is not finished'
            );
        });

        it('should revert when a non-owner tries to start voting session', async () => {
            await expectRevert(
                votingInstance.startVotingSession({ from: voter1 }),
                'Ownable: caller is not the owner'
            );
        });
    });

    describe('test endVotingSession function', () => {
        let endVotingSession;

        before(async () => {
            votingInstance = await Voting.new({ from: owner });
            await votingInstance.addVoter(voter1, { from: owner });
            await votingInstance.startProposalsRegistering({ from: owner });
            await votingInstance.addProposal('First proposal', { from: voter1 });
            await votingInstance.endProposalsRegistering({ from: owner });
            await votingInstance.startVotingSession({ from: owner });
            endVotingSession = await votingInstance.endVotingSession({ from: owner });
        });

        it('should end voting session after start voting session started', async () => {
            expect(await votingInstance.workflowStatus()).to.be.bignumber.equal(new BN(4));
        });

        it('should emit WorkflowStatusChange event', async () => {
            await expectEvent(endVotingSession, 'WorkflowStatusChange', {
                previousStatus: new BN(3),
                newStatus: new BN(4)
            });
        });

        it('should revert when trying to end voting session before start voting session started', async () => {
            await expectRevert(
                votingInstance.endVotingSession({ from: owner }),
                'Voting session havent started yet'
            );
        });

        it('should revert when a non-owner tries to end voting session', async () => {
            await expectRevert(
                votingInstance.endVotingSession({ from: voter1 }),
                'Ownable: caller is not the owner'
            );
        });
    });

});
