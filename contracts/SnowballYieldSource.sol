// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

import {
    IYieldSource
} from "@pooltogether/yield-source-interface/contracts/IYieldSource.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISnowcones.sol";

contract SnowballYieldSource is IYieldSource {
    using SafeMath for uint256;

    address public gaugeToken;
    address public snowballGauge;
    mapping(address => uint256) public balances;

    IERC20 private gaugeTokenContract;
    IERC20 private snowballTokenContact;
    ISnowcones private snowballGaugeContract;

    address _owner;

    // Dev fund (10% initially)
    uint256 public devFundDivRate = 10;
    // Dev address.
    address public devfund;

    event Harvest(address indexed prizePool, uint256 amount, uint256 devFund);

    constructor(
        address _gaugeToken,
        address _gauge,
        address _snowballToken
    ) public {
        gaugeToken = _gaugeToken;
        snowballGauge = _gauge;

        snowballGaugeContract = ISnowcones(_gauge);
        gaugeTokenContract = IERC20(gaugeToken);
        snowballTokenContact = IERC20(_snowballToken);

        _owner = msg.sender;
        devfund = msg.sender;
    }

    /// @notice Returns the ERC20 asset token used for deposits.
    /// @return The ERC20 asset token
    function depositToken() external view override returns (address) {
        return (gaugeToken);
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
        gaugeTokenContract.transferFrom(msg.sender, address(this), amount);
        gaugeTokenContract.approve(snowballGauge, amount);

        uint256 gaugeBeforeBalance = snowballGaugeContract.balanceOf(address(this));

        snowballGaugeContract.deposit(amount);

        uint256 gaugeAfterBalance = snowballGaugeContract.balanceOf(address(this));
        uint256 balanceDiff = gaugeAfterBalance.sub(gaugeBeforeBalance);
        balances[to] = balances[to].add(balanceDiff);
    }

    /// @notice Redeems tokens from the yield source.
    /// @param amount The amount of `token()` to withdraw.  Denominated in `token()` as above.
    /// @return The actual amount of tokens that were redeemed.
    function redeemToken(uint256 amount) external override returns (uint256) {
        require(balances[msg.sender] >= amount);

        snowballGaugeContract.withdraw(amount);
        gaugeTokenContract.transfer(msg.sender, amount);
        balances[msg.sender] = balances[msg.sender].sub(amount);

        return (amount);
    }

    function harvest(address prizePool) external returns (uint256) {
        require(_owner == msg.sender);

        snowballGaugeContract.getReward();
        uint256 amount = snowballTokenContact.balanceOf(address(this));

        uint256 devAmount = 0;
        if (devFundDivRate > 0) {
            devAmount = amount.div(devFundDivRate);
            snowballTokenContact.transfer(devfund, devAmount);
        }

        uint256 reward = amount.sub(devAmount);

        snowballTokenContact.transfer(prizePool, reward);

        emit Harvest(prizePool, reward, devAmount);

        return amount;
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
