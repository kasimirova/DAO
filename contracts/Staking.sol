//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is AccessControl{
    struct userInfo{
        uint256 amountofStakedLPTokens;
        uint256 timeOfStake;
        uint256 rewardDebt;
        uint256 freezeUntil;
    }

    mapping (address => userInfo) public user;
    address ownerAddress;
    address lpToken;
    address rewardToken;
    uint256 freezingTimeForLP;
    uint256 rewardTime;
    uint8 percent;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");


    constructor(address _lpToken, address _rewardToken, uint256 _freezingTimeForLP, uint256 _rewardTime, uint8 _percent) {
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        ownerAddress = msg.sender;
        lpToken = _lpToken;
        rewardToken = _rewardToken;
        freezingTimeForLP = _freezingTimeForLP;
        rewardTime = _rewardTime;
        percent = _percent;
    }


    function stake(uint256 amount) external{
        if (user[msg.sender].amountofStakedLPTokens > 0){
            user[msg.sender].rewardDebt+=countReward(msg.sender);
        }
        user[msg.sender].amountofStakedLPTokens+=amount;
        user[msg.sender].timeOfStake = block.timestamp;
        user[msg.sender].freezeUntil = block.timestamp + freezingTimeForLP;
        IERC20(lpToken).transferFrom(msg.sender, address(this), amount);
    }

    function claim() external{
        IERC20(rewardToken).transfer(msg.sender, countReward(msg.sender)+user[msg.sender].rewardDebt);
        user[msg.sender].timeOfStake = block.timestamp;
        user[msg.sender].rewardDebt=0;
    }

    function unstake() external{
        require(block.timestamp >= user[msg.sender].freezeUntil, "It's too soon to unstake");
        IERC20(lpToken).transfer(msg.sender, user[msg.sender].amountofStakedLPTokens);
        user[msg.sender].rewardDebt+=countReward(msg.sender);      
        user[msg.sender].amountofStakedLPTokens = 0;
    }
    
    function countReward(address _user) public view returns(uint256) {
        return (block.timestamp - user[_user].timeOfStake)/rewardTime * user[_user].amountofStakedLPTokens/100*percent;
    }

    function setRewardTime(uint256 newRewardTime) public onlyRole(ADMIN_ROLE){
        rewardTime = newRewardTime;
    }
    

    function setRewardPercent(uint8 newRewardPercent) public onlyRole(DAO_ROLE)  {
        percent = newRewardPercent;
    }

    function getRewardPercent() public view returns (uint8){
        return percent;
    }

    function setFreezingTimeForLP(uint256 newFreezingTime) public onlyRole(DAO_ROLE){
        freezingTimeForLP = newFreezingTime;
    }

    function getFreezingTimeForLP() public view returns (uint256){
        return freezingTimeForLP;
    }

    function getRewardDebt(address _user) public view returns(uint256) {
        return user[_user].rewardDebt;
    }

    function getAmountofStakedTokens(address _user) public view returns(uint256) {
        return user[_user].amountofStakedLPTokens;
    }

}
