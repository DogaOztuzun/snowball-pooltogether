// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

import {
    IYieldSource
} from "@pooltogether/yield-source-interface/contracts/IYieldSource.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IIcequeen.sol";

contract SnowballYieldSource is IYieldSource {
    using SafeMath for uint256;

    address public sToken;
    address public icequeen;
    uint256 public poolIndex;
    mapping(address => uint256) public balances;

    IERC20 private sTokenContract;
    IERC20 private snowballTokenContact;
    IIcequeen private icequeenContract;

    address _owner;

    // Dev fund (10% initially)
    uint256 public devFundDivRate = 10;
    // Dev address.
    address public devfund;

    event Harvest(address indexed prizePool, uint256 indexed poolId, uint256 amount, uint256 devFund);

    constructor(
        address _sToken,
        address _icequeen,
        address _snowballToken,
        uint256 _poolIndex
    ) public {
        sToken = _sToken;
        icequeen = _icequeen;
        poolIndex = _poolIndex;

        icequeenContract = IIcequeen(icequeen);
        sTokenContract = IERC20(sToken);
        snowballTokenContact = IERC20(_snowballToken);

        _owner = msg.sender;
        devfund = msg.sender;
    }

    /// @notice Returns the ERC20 asset token used for deposits.
    /// @return The ERC20 asset token
    function depositToken() external view override returns (address) {
        return (sToken);
    }

    /// @return The underlying balance of asset tokens
    function balanceOfToken(address addr) external override returns (uint256) {
        if (balances[addr] == 0) return 0;

        return balances[addr];
    }

    /// @notice Supplies tokens to the yield source.  Allows assets to be supplied on other user's behalf using the `to` param.
    /// @param amount The amount of `token()` to be supplied
    /// @param to The user whose balance will receive the tokens
    function supplyTokenTo(uint256 amount, address to) public override {
        sTokenContract.transferFrom(msg.sender, address(this), amount);
        sTokenContract.approve(icequeen, amount);

        uint256 iqBeforeBalance = getBalanceFromIcequeen(address(this));

        icequeenContract.deposit(poolIndex, amount);

        uint256 iqAfterBalance = getBalanceFromIcequeen(address(this));
        uint256 balanceDiff = iqAfterBalance.sub(iqBeforeBalance);
        balances[to] = balances[to].add(balanceDiff);
    }

    /// @notice Redeems tokens from the yield source.
    /// @param amount The amount of `token()` to withdraw.  Denominated in `token()` as above.
    /// @return The actual amount of tokens that were redeemed.
    function redeemToken(uint256 amount) external override returns (uint256) {
        icequeenContract.withdraw(poolIndex, amount);
        sTokenContract.transfer(msg.sender, amount);
        balances[msg.sender] = balances[msg.sender].sub(amount);

        return (amount);
    }

    function harvest(address prizePool) external returns (uint256) {
        require(_owner == msg.sender);

        icequeenContract.deposit(poolIndex, 0);
        uint256 amount = snowballTokenContact.balanceOf(address(this));

        uint256 devAmount = 0;
        if (devFundDivRate > 0) {
            devAmount = amount.div(devFundDivRate);
            snowballTokenContact.transfer(devfund, devAmount);
        }

        uint256 reward = amount.sub(devAmount);

        snowballTokenContact.transfer(prizePool, reward);

        emit Harvest(prizePool, poolIndex, reward, devAmount);

        return amount;
    }

    function getLiqProviderFromIcequeen() private view returns (address) {
        (address lp, , , ) = icequeenContract.poolInfo(poolIndex);
        return lp;
    }

    function getBalanceFromIcequeen(address adr)
        private
        view
        returns (uint256)
    {
        (uint256 balance, ) = icequeenContract.userInfo(poolIndex, adr);

        return balance;
    }

    function setDevFundDivRate(uint256 _devFundDivRate) public {
        require(_owner == msg.sender);

        devFundDivRate = _devFundDivRate;
    }

    // Update dev address by the previous dev.
    function updateDevfund(address _devfund) public {
        require(msg.sender == devfund, "dev: wut?");

        devfund = _devfund;
    }
}
