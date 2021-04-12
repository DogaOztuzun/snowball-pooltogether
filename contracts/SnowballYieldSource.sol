// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

import { IYieldSource } from "@pooltogether/yield-source-interface/contracts/IYieldSource.sol";
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
  IIcequeen private icequeenContract;
  

  constructor(address _sToken, address _icequeen, uint256 _poolIndex) public {
    sToken = _sToken;
    icequeen = _icequeen;
    poolIndex = _poolIndex;

    icequeenContract = IIcequeen(icequeen);
    sTokenContract = IERC20(sToken);
  }

  /// @notice Returns the ERC20 asset token used for deposits.
  /// @return The ERC20 asset token
  function depositToken() external view override returns (address){
    return (sToken);
  }

  /// @notice Returns the total balance (in asset tokens).  This includes the deposits and interest.
  /// @return The underlying balance of asset tokens
  function balanceOfToken(address addr) external override returns (uint256) {
    if(balances[addr] == 0) return 0;

    uint256 shares = getBalanceFromIcequeen(address(this));
    IERC20 lp = IERC20(getLiqProviderFromIcequeen());
    uint256 totalShares = lp.totalSupply();

    uint256 balance =
        shares.mul(sTokenContract.balanceOf(address(icequeen))).div(
            totalShares
        );
    uint256 sourceShares = getBalanceFromIcequeen(address(this));

    return (balances[addr].mul(balance).div(sourceShares));
    // return totalShares;
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
    address lp = getLiqProviderFromIcequeen();
    IERC20 lpToken = IERC20(lp);
    uint256 totalShares = lpToken.totalSupply();
    uint256 iqSnowglobeBalance = sTokenContract.balanceOf(icequeen); // todo: SNOB ?
    uint256 requiredShares = amount.mul(totalShares).div(iqSnowglobeBalance);

    uint256 iqBeforeBalance = getBalanceFromIcequeen(address(this));
    uint256 sgBeforeBalance = sTokenContract.balanceOf(address(this));

    icequeenContract.withdraw(poolIndex, requiredShares);

    uint256 iqAfterBalance = getBalanceFromIcequeen(address(this));
    uint256 sgAfterBalance = sTokenContract.balanceOf(address(this));

    uint256 iqBalanceDiff = iqBeforeBalance.sub(iqAfterBalance);
    uint256 sgBalanceDiff = sgAfterBalance.sub(sgBeforeBalance);

    balances[msg.sender] = balances[msg.sender].sub(iqBalanceDiff);
    sTokenContract.transfer(msg.sender, iqBalanceDiff);

    return (sgBalanceDiff);
  }

  function getLiqProviderFromIcequeen() private view returns (address) {
    (address lp, uint256 x, uint256 y, uint256 z) = icequeenContract.poolInfo(poolIndex);
    return lp;
  }

  function getBalanceFromIcequeen(address adr) private view returns (uint256) {
    (uint256 balance, uint256 y1) = icequeenContract.userInfo(poolIndex, adr);

    return balance;
  }
}