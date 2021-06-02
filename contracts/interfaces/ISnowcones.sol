// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

interface ISnowcones {
  function DISTRIBUTION (  ) external view returns ( address );
  function DURATION (  ) external view returns ( uint256 );
  function SNOWBALL (  ) external view returns ( address );
  function SNOWCONE (  ) external view returns ( address );
  function TOKEN (  ) external view returns ( address );
  function TREASURY (  ) external view returns ( address );
  function balanceOf ( address account ) external view returns ( uint256 );
  function deposit ( uint256 amount ) external;
  function depositAll (  ) external;
  function depositFor ( uint256 amount, address account ) external;
  function derivedBalance ( address account ) external view returns ( uint256 );
  function derivedBalances ( address ) external view returns ( uint256 );
  function derivedSupply (  ) external view returns ( uint256 );
  function earned ( address account ) external view returns ( uint256 );
  function exit (  ) external;
  function getReward (  ) external;
  function getRewardForDuration (  ) external view returns ( uint256 );
  function kick ( address account ) external;
  function lastTimeRewardApplicable (  ) external view returns ( uint256 );
  function lastUpdateTime (  ) external view returns ( uint256 );
  function notifyRewardAmount ( uint256 reward ) external;
  function periodFinish (  ) external view returns ( uint256 );
  function rewardPerToken (  ) external view returns ( uint256 );
  function rewardPerTokenStored (  ) external view returns ( uint256 );
  function rewardRate (  ) external view returns ( uint256 );
  function rewards ( address ) external view returns ( uint256 );
  function totalSupply (  ) external view returns ( uint256 );
  function userRewardPerTokenPaid ( address ) external view returns ( uint256 );
  function withdraw ( uint256 amount ) external;
  function withdrawAll (  ) external;
}
