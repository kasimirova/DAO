//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DAO {

    struct proposalInfo{
        uint256 amountOfVotesFor;
        uint256 amountOfVotesAgainst;
        uint256 startTime;
        uint256 lastsUntil;
        address recipient;
        bytes callData;
        string description;
    }

    struct userInfo{
        uint256 deposit;
        uint256 freezeTokensUntil;
    }

    address public chairPerson;
    address public voteToken;
    uint256 public minQuorum;
    uint256 public duration;
    uint256 public proposalId;

    mapping (uint256=>proposalInfo) proposal;
    mapping (address=>userInfo) user;
    mapping (address => mapping(uint256 => bool)) isUserVoted;

    event ProposalAdded(bytes callData, address recipient, string description);
    event UserVoted(address user, uint256 proposalId, bool vote);
    event ProposalFinishedSuccessfully(uint256 id);
    event ProposalFailed(uint256 id, string reason);

    modifier onlyChairPerson(){
        require(msg.sender == chairPerson, "Only chair person can add proposal");
        _;
    }
    constructor(address _chairPerson, address _voteToken, uint256 _minQuorum, uint256 _duration) {
        chairPerson = _chairPerson;
        voteToken = _voteToken;
        minQuorum = _minQuorum;
        duration = _duration;
    }

    function deposit(uint256 amount) public {
        IERC20(voteToken).transferFrom(msg.sender, address(this), amount);
        user[msg.sender].deposit+=amount;
    }

    function addProposal(bytes memory _callData, address _recipient, string memory _description) public onlyChairPerson{
        proposal[proposalId].callData = _callData;
        proposal[proposalId].recipient = _recipient;
        proposal[proposalId].description = _description;
        proposal[proposalId].startTime = block.timestamp;
        proposal[proposalId].lastsUntil = block.timestamp+duration;
        proposalId+=1;
        emit ProposalAdded(_callData, _recipient, _description);
    }

    function vote(uint256 id, bool _vote) public {
        require(proposal[id].startTime != 0, "Proposal with that id doesn't exist");
        require(!isUserVoted[msg.sender][id], "Sender has already voted");
        require(user[msg.sender].deposit > 0, "There isn't any tokens on sender's deposit");
        require(proposal[id].lastsUntil > block.timestamp, "Voting time is over");

        if(user[msg.sender].freezeTokensUntil<proposal[id].lastsUntil){
            user[msg.sender].freezeTokensUntil = proposal[id].lastsUntil;
        }
        _vote ? proposal[id].amountOfVotesFor+=user[msg.sender].deposit : proposal[id].amountOfVotesAgainst+=user[msg.sender].deposit;
        isUserVoted[msg.sender][id] = true;
        emit UserVoted(msg.sender, id, _vote);
    }

    function finishProposal(uint256 id) public {
        require(proposal[id].startTime != 0, "Proposal with that id doesn't exist");
        require(proposal[id].lastsUntil < block.timestamp, "It's too soon to finish this proposal");

        if (proposal[id].amountOfVotesFor+proposal[id].amountOfVotesAgainst < countMinAmountOfVotes()){
            emit ProposalFailed(id, "Not enough votes");
        }
        else if (proposal[id].amountOfVotesFor>proposal[id].amountOfVotesAgainst){
            bool result;
            result = callFunc(proposal[id].recipient, proposal[id].callData);
            if (result){
                emit ProposalFinishedSuccessfully(id);
            }
            else{
                emit ProposalFailed(id, "Error in call func");

            }
            // require(result, "Error in call func");
            // emit ProposalFinishedSuccessfully(id);
        }
        else{
            emit ProposalFailed(id, "The majority of participants vote against");
        }
        delete proposal[proposalId];
    }

    function countMinAmountOfVotes() public view returns(uint256){
        return IERC20(voteToken).totalSupply()/100*minQuorum;
    }

    function callFunc(address recipient, bytes memory signature) public returns(bool){   
        (bool success, ) = recipient.call(signature);
        return success;
    }

    function withdrawTokens() public {
        require(block.timestamp >= user[msg.sender].freezeTokensUntil, "Not all proposals that you participate in are finished");
        IERC20(voteToken).transfer(msg.sender, user[msg.sender].deposit);
    }

    function getUsersDeposit(address userId) public view returns (uint256) {
        return user[userId].deposit;
    }

    function checkIfUserVoted(address userId, uint256 propId) public view returns (bool) {
        return isUserVoted[userId][propId];
    }
}
