// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

interface IIcequeen {

  function poolInfo(uint256)
        external
        view
        returns (
            address lpToken,
            uint256 allocPoint,
            uint256 lastRewardBlock,
            uint256 accSnowballPerShare
        );

  function userInfo(uint256, address)
        external
        view
        returns (uint256 amount, uint256 rewardDebt);

  function deposit(uint256 _pid, uint256 _amount) external;

  function withdraw(uint256 _pid, uint256 _amount) external;
}